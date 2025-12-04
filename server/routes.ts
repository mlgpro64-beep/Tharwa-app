import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { insertUserSchema, insertTaskSchema, insertBidSchema, insertMessageSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import "express-session";
import { sendOtpEmail } from "./email";

let bcrypt: any;
try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = {
    hash: (pass: string) => Promise.resolve(pass),
    compare: (pass: string, hash: string) => Promise.resolve(pass === hash),
  };
}

export const router = Router();

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

// Helper to strip password from user objects
function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

// Middleware to get current user
const getCurrentUser = async (req: Request, res: Response, next: Function) => {
  const userId = req.session?.userId;
  if (userId) {
    req.user = await storage.getUser(userId);
    req.userId = userId;
  }
  next();
};

router.use(getCurrentUser);

// Auth routes
router.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, name, role, taskerType, certificateUrl } = req.body;
    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = {
      username,
      email,
      password: hashedPassword,
      name,
      role: role || "client",
    };
    
    if (role === 'tasker') {
      const validTaskerType = taskerType === 'specialized' ? 'specialized' : 'general';
      userData.taskerType = validTaskerType;
      userData.verificationStatus = validTaskerType === 'specialized' ? 'pending' : 'approved';
      
      if (validTaskerType === 'specialized' && certificateUrl) {
        if (typeof certificateUrl === 'string' && certificateUrl.startsWith('data:image/')) {
          const base64Length = certificateUrl.length * 0.75;
          const maxSize = 5 * 1024 * 1024;
          if (base64Length <= maxSize) {
            userData.certificateUrl = certificateUrl;
          }
        }
      }
    }
    
    const user = await storage.createUser(userData);
    
    req.session!.userId = user.id;
    res.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    req.session!.userId = user.id;
    res.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/auth/logout", (req, res) => {
  req.session?.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ success: true });
  });
});

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
router.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, type = "registration" } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Check if email already exists for registration
    if (type === "registration") {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }
    
    // For login type, verify user exists
    if (type === "login") {
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        return res.status(400).json({ error: "No account found with this email" });
      }
    }
    
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await storage.createOtpCode({
      email,
      code,
      type,
      expiresAt,
    });
    
    // Send email via Resend
    const emailResult = await sendOtpEmail(email, code, type as any);
    
    if (!emailResult.success) {
      console.warn(`[OTP] Email sending failed, falling back to console: ${emailResult.error}`);
      console.log(`[OTP] Email: ${email}, Code: ${code}, Type: ${type}`);
    }
    
    res.json({ 
      success: true, 
      message: "OTP sent successfully",
      // Include OTP in dev mode for testing if email fails
      ...(process.env.NODE_ENV !== 'production' && !emailResult.success && { devCode: code })
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, code, type = "registration" } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }
    
    const otpRecord = await storage.getValidOtpCode(email, code, type);
    
    if (!otpRecord) {
      // Check if there's any pending OTP for this email to increment attempts
      const existingOtp = await storage.getPendingOtpByEmail(email, type);
      if (existingOtp) {
        await storage.incrementOtpAttempts(existingOtp.id);
      }
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    
    await storage.markOtpAsVerified(otpRecord.id);
    
    // If verifying email for existing user, mark email as verified
    if (type === "email_verification") {
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.updateUser(user.id, { emailVerified: true } as any);
      }
    }
    
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login with OTP (passwordless)
router.post("/api/auth/login-with-otp", async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    
    if (!email || !otpCode) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }
    
    // Verify OTP
    const otpRecord = await storage.getValidOtpCode(email, otpCode, "login");
    
    if (!otpRecord) {
      // Check if there's any pending OTP for this email to increment attempts
      const existingOtp = await storage.getPendingOtpByEmail(email, "login");
      if (existingOtp) {
        await storage.incrementOtpAttempts(existingOtp.id);
      }
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    
    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No account found with this email" });
    }
    
    // Mark OTP as verified
    await storage.markOtpAsVerified(otpRecord.id);
    
    // Create session
    req.session!.userId = user.id;
    
    res.json({ 
      success: true, 
      user: sanitizeUser(user),
      message: "Logged in successfully" 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register with OTP verification
router.post("/api/auth/register-with-otp", async (req, res) => {
  try {
    const { username, email, password, name, role, taskerType, certificateUrl, otpCode } = req.body;
    
    // Verify OTP first
    const otpRecord = await storage.getValidOtpCode(email, otpCode, "registration");
    if (!otpRecord || !otpRecord.verified) {
      // Try to verify the OTP if not already verified
      if (otpRecord && !otpRecord.verified) {
        const validOtp = await storage.getValidOtpCode(email, otpCode, "registration");
        if (!validOtp) {
          return res.status(400).json({ error: "Invalid or expired OTP" });
        }
        await storage.markOtpAsVerified(validOtp.id);
      } else if (!otpRecord) {
        return res.status(400).json({ error: "Please verify your email first" });
      }
    }
    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }
    
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = {
      username,
      email,
      password: hashedPassword,
      name,
      role: role || "client",
      emailVerified: true, // Email verified through OTP
    };
    
    if (role === 'tasker') {
      const validTaskerType = taskerType === 'specialized' ? 'specialized' : 'general';
      userData.taskerType = validTaskerType;
      userData.verificationStatus = validTaskerType === 'specialized' ? 'pending' : 'approved';
      
      if (validTaskerType === 'specialized' && certificateUrl) {
        if (typeof certificateUrl === 'string' && certificateUrl.startsWith('data:image/')) {
          const base64Length = certificateUrl.length * 0.75;
          const maxSize = 5 * 1024 * 1024;
          if (base64Length <= maxSize) {
            userData.certificateUrl = certificateUrl;
          }
        }
      }
    }
    
    const user = await storage.createUser(userData);
    
    req.session!.userId = user.id;
    res.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/users/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(sanitizeUser(req.user));
});

router.patch("/api/users/me", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const updated = await storage.updateUser(req.userId, req.body);
    res.json(sanitizeUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks routes
router.get("/api/tasks", async (req, res) => {
  try {
    const { status, category, clientId } = req.query;
    const tasks = await storage.getTasks({
      status: status as string,
      category: category as string,
      clientId: clientId as string,
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tasks/my", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const userTasks = await storage.getTasks({ clientId: req.userId });
    res.json(userTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tasks/available", async (req, res) => {
  try {
    const tasks = await storage.getTasks({ status: "open" });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tasks/saved", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const savedTasks = await storage.getSavedTasksForUser(req.userId);
    res.json(savedTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/tasks/:id", async (req, res) => {
  try {
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Daily task limit for clients: 5 tasks per day
const DAILY_TASK_LIMIT = 5;

router.get("/api/tasks/my/today-count", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const count = await storage.getTasksCreatedToday(String(req.userId));
    res.json({ count, limit: DAILY_TASK_LIMIT, remaining: DAILY_TASK_LIMIT - count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tasks", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Check daily task limit for clients
    const todayCount = await storage.getTasksCreatedToday(String(req.userId));
    if (todayCount >= DAILY_TASK_LIMIT) {
      return res.status(429).json({ 
        error: "Daily task limit reached",
        message: "You can only post 5 tasks per day. Please try again tomorrow.",
        limit: DAILY_TASK_LIMIT,
        count: todayCount
      });
    }
    
    const data = { ...req.body, clientId: req.userId };
    const task = await storage.createTask(data);
    
    // Send notifications to taskers in the same category
    try {
      const taskersInCategory = await storage.getTaskersByCategory(task.category);
      for (const tasker of taskersInCategory) {
        if (tasker.id !== req.userId) {
          await storage.createNotification({
            userId: tasker.id,
            type: 'new_task',
            title: 'مهمة جديدة في تخصصك',
            message: `تم نشر مهمة جديدة: "${task.title}"`,
            icon: 'briefcase',
            color: 'primary',
            actionUrl: `/task/${task.id}`,
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send category notifications:', notifError);
    }
    
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/api/tasks/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Not authorized" });
    
    const updated = await storage.updateTask(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/api/tasks/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Not authorized" });
    
    if (task.status !== 'open') {
      return res.status(400).json({ error: "Only open tasks can be deleted" });
    }
    
    await storage.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tasks/:id/request-completion", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    if (task.taskerId !== req.userId) {
      return res.status(403).json({ error: "Only the assigned tasker can request completion" });
    }
    
    if (task.status !== 'assigned' && task.status !== 'in_progress') {
      return res.status(400).json({ error: "Task is not in a state that can be completed" });
    }
    
    const updated = await storage.updateTask(req.params.id, { status: 'in_progress' });
    
    const tasker = await storage.getUser(req.userId);
    await storage.createNotification({
      userId: task.clientId,
      type: 'task_update',
      title: 'طلب إتمام المهمة',
      message: `${tasker?.name || 'المنفذ'} يطلب تأكيد إتمام "${task.title}"`,
      icon: 'check_circle',
      color: 'success',
      actionUrl: `/task/${task.id}`,
    });
    
    res.json({ task: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bids routes
router.get("/api/tasks/:id/bids", async (req, res) => {
  try {
    const bids = await storage.getBidsForTask(req.params.id);
    res.json(bids);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tasks/:id/bids", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    const bid = await storage.createBid({
      taskId: req.params.id,
      taskerId: req.userId,
      amount: req.body.amount,
      message: req.body.message,
    });
    
    // Notify client about new bid
    const tasker = await storage.getUser(req.userId);
    await storage.createNotification({
      userId: task.clientId,
      type: 'bid_received',
      title: 'عرض جديد على مهمتك',
      message: `قدم ${tasker?.name || 'منفذ'} عرضًا بقيمة $${req.body.amount} على "${task.title}"`,
      icon: 'tag',
      color: 'accent',
      actionUrl: `/task/${task.id}`,
    });
    
    res.json(bid);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/bids/:id/accept", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const bid = await storage.getBid(req.params.id);
    if (!bid) return res.status(404).json({ error: "Bid not found" });
    
    const task = await storage.getTask(bid.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Not authorized" });
    
    const updatedBid = await storage.updateBid(req.params.id, { status: "accepted" });
    const updatedTask = await storage.updateTask(bid.taskId, { status: "assigned", taskerId: bid.taskerId });
    
    res.json({ bid: updatedBid, task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Platform fee configuration: 5% for platform, 95% for tasker
// The platform fee is retained as the difference between client payment and tasker payout
// Client pays: totalAmount (100%)
// Tasker receives: taskerPayout (95%)
// Platform retains: platformFee (5%) - tracked in transactions for audit purposes
const PLATFORM_FEE_PERCENTAGE = 0.05;
const PLATFORM_ACCOUNT_ID = "platform"; // Virtual account for fee tracking

router.post("/api/tasks/:id/complete", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    if (task.clientId !== req.userId && task.taskerId !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    if (task.status !== "assigned" && task.status !== "in_progress") {
      return res.status(400).json({ error: "Task cannot be completed in current status" });
    }
    
    if (!task.taskerId) {
      return res.status(400).json({ error: "Task has no assigned tasker" });
    }
    
    const acceptedBid = await storage.getAcceptedBidForTask(task.id);
    if (!acceptedBid) {
      return res.status(400).json({ error: "No accepted bid found for task" });
    }
    
    const totalAmount = parseFloat(acceptedBid.amount);
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
    const taskerPayout = totalAmount - platformFee;
    
    const updatedTask = await storage.updateTask(task.id, { status: "completed" });
    
    const client = await storage.getUser(task.clientId);
    if (!client) {
      return res.status(400).json({ error: "Client not found" });
    }
    
    const clientBalance = parseFloat(client.balance || "0");
    if (clientBalance < totalAmount) {
      return res.status(400).json({ error: "Insufficient client balance" });
    }
    
    await storage.createTransaction({
      userId: task.taskerId,
      taskId: task.id,
      title: `أرباح: ${task.title}`,
      amount: taskerPayout.toFixed(2),
      type: "credit",
      status: "completed",
      icon: "account_balance_wallet",
    });
    
    await storage.createTransaction({
      userId: task.clientId,
      taskId: task.id,
      title: `دفع: ${task.title}`,
      amount: totalAmount.toFixed(2),
      type: "debit",
      status: "completed",
      icon: "payment",
    });
    
    try {
      await storage.createTransaction({
        userId: PLATFORM_ACCOUNT_ID,
        taskId: task.id,
        title: `رسوم المنصة: ${task.title}`,
        amount: platformFee.toFixed(2),
        type: "credit",
        status: "completed",
        icon: "percent",
      });
    } catch {
    }
    
    await storage.updateUser(task.clientId, {
      balance: (clientBalance - totalAmount).toFixed(2)
    });
    
    const tasker = await storage.getUser(task.taskerId);
    if (tasker) {
      const newBalance = parseFloat(tasker.balance || "0") + taskerPayout;
      await storage.updateUser(task.taskerId, { 
        balance: newBalance.toFixed(2),
        completedTasks: (tasker.completedTasks || 0) + 1
      });
    }
    
    res.json({ 
      task: updatedTask, 
      payment: {
        total: totalAmount,
        platformFee,
        taskerPayout,
        feePercentage: PLATFORM_FEE_PERCENTAGE * 100
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Messages routes
router.get("/api/tasks/:id/messages", async (req, res) => {
  try {
    const messages = await storage.getMessagesForTask(req.params.id);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tasks/:id/messages", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    const receiverId = task.clientId === req.userId ? task.taskerId : task.clientId;
    if (!receiverId) return res.status(400).json({ error: "No receiver for message" });
    
    const message = await storage.createMessage({
      taskId: req.params.id,
      senderId: req.userId,
      receiverId,
      content: req.body.content,
    });
    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions routes
router.get("/api/transactions", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const transactions = await storage.getTransactionsForUser(req.userId);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications routes
router.get("/api/notifications", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const notifications = await storage.getNotificationsForUser(req.userId);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const notification = await storage.markNotificationAsRead(req.params.id);
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/notifications/read-all", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const notifications = await storage.getNotificationsForUser(req.userId);
    for (const notif of notifications) {
      if (!notif.read) {
        await storage.markNotificationAsRead(notif.id);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save/unsave task routes
router.post("/api/tasks/:id/save", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const saved = await storage.saveTask(req.userId, req.params.id);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/api/tasks/:id/save", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    await storage.unsaveTask(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Conversations routes
router.get("/api/conversations", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    res.json([]); // Placeholder for conversations list
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Professional Roles routes
router.get("/api/professional-roles", async (req, res) => {
  try {
    const roles = await storage.getProfessionalRoles();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/professional-roles/:slug", async (req, res) => {
  try {
    const role = await storage.getProfessionalRoleBySlug(req.params.slug);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Professional Roles routes
router.get("/api/users/:userId/professional-roles", async (req, res) => {
  try {
    const roles = await storage.getUserProfessionalRoles(req.params.userId);
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/users/:userId/professional-roles", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Only admins can assign professional roles (admin-verified badges)
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Only administrators can assign professional roles" });
    }
    
    const assigned = await storage.assignProfessionalRole({
      userId: req.params.userId,
      roleId: req.body.roleId,
      verifiedBy: req.userId,
    });
    res.json(assigned);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/api/users/:userId/professional-roles/:roleId", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Only admins can remove professional roles
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Only administrators can remove professional roles" });
    }
    
    await storage.removeProfessionalRole(req.params.userId, req.params.roleId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tasker Availability routes
router.get("/api/users/:userId/availability", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const availability = await storage.getTaskerAvailability(
      req.params.userId,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/availability", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const availability = await storage.setTaskerAvailability({
      userId: req.userId,
      date: req.body.date,
      status: req.body.status,
      note: req.body.note,
    });
    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/api/availability/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Verify ownership
    const availability = await storage.getTaskerAvailabilityById(req.params.id);
    if (!availability) return res.status(404).json({ error: "Availability not found" });
    if (availability.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to modify this availability" });
    }
    
    const updated = await storage.updateTaskerAvailability(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/api/availability/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Verify ownership
    const availability = await storage.getTaskerAvailabilityById(req.params.id);
    if (!availability) return res.status(404).json({ error: "Availability not found" });
    if (availability.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to delete this availability" });
    }
    
    await storage.deleteTaskerAvailability(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Photos (Portfolio) routes
router.get("/api/users/:userId/photos", async (req, res) => {
  try {
    const photos = await storage.getUserPhotos(req.params.userId);
    res.json(photos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/photos", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const photo = await storage.addUserPhoto({
      userId: req.userId,
      url: req.body.url,
      caption: req.body.caption,
    });
    res.json(photo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/api/photos/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Verify ownership
    const photo = await storage.getUserPhotoById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to modify this photo" });
    }
    
    const updated = await storage.updateUserPhoto(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/api/photos/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Verify ownership
    const photo = await storage.getUserPhotoById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to delete this photo" });
    }
    
    await storage.deleteUserPhoto(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/photos/reorder", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    // Verify ownership of all photos being reordered
    const { photoIds } = req.body;
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: "photoIds array required" });
    }
    
    for (const photoId of photoIds) {
      const photo = await storage.getUserPhotoById(photoId);
      if (!photo) return res.status(404).json({ error: `Photo ${photoId} not found` });
      if (photo.userId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to reorder these photos" });
      }
    }
    
    await storage.reorderUserPhotos(req.userId, photoIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user with extended details (roles, availability, photos)
router.get("/api/users/:userId", async (req, res) => {
  try {
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const [professionalRoles, availability, photos] = await Promise.all([
      storage.getUserProfessionalRoles(req.params.userId),
      storage.getTaskerAvailability(req.params.userId),
      storage.getUserPhotos(req.params.userId),
    ]);
    
    res.json({
      ...sanitizeUser(user),
      professionalRoles,
      availability,
      photos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task (client only - soft delete by setting status to cancelled)
router.delete("/api/tasks/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Not authorized" });
    
    if (task.status !== 'open') {
      return res.status(400).json({ error: "Can only delete open tasks" });
    }
    
    await storage.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search taskers with professional roles
router.get("/api/taskers/search", async (req, res) => {
  try {
    const { category, verified, search } = req.query;
    const taskers = await storage.searchTaskers({
      category: category as string,
      verified: verified === 'true',
      search: search as string,
    });
    
    const taskersWithRoles = await Promise.all(
      taskers.map(async (tasker) => {
        const professionalRoles = await storage.getUserProfessionalRoles(tasker.id);
        return {
          ...sanitizeUser(tasker),
          professionalRoles,
        };
      })
    );
    
    res.json(taskersWithRoles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tasker marks task as completed - triggers payment request to client
router.post("/api/tasks/:id/request-completion", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.taskerId !== req.userId) return res.status(403).json({ error: "Only assigned tasker can complete" });
    
    if (task.status !== 'assigned' && task.status !== 'in_progress') {
      return res.status(400).json({ error: "Task is not in progress" });
    }
    
    const acceptedBid = await storage.getAcceptedBidForTask(task.id);
    if (!acceptedBid) {
      return res.status(400).json({ error: "No accepted bid found" });
    }
    
    // Notify client that tasker has completed and payment is required
    await storage.createNotification({
      userId: task.clientId,
      type: 'payment_request',
      title: 'تم إنجاز المهمة',
      message: `أكمل المنفذ المهمة "${task.title}". يرجى الدفع لإتمام المعاملة.`,
      icon: 'check-circle',
      color: 'success',
      actionUrl: `/task/${task.id}/payment`,
    });
    
    res.json({ 
      success: true,
      taskId: task.id,
      amount: acceptedBid.amount,
      message: 'Completion request sent to client'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe payment intent for task completion
router.post("/api/payments/create-intent", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: "taskId required" });
    
    const task = await storage.getTask(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Only client can pay" });
    
    const acceptedBid = await storage.getAcceptedBidForTask(task.id);
    if (!acceptedBid) {
      return res.status(400).json({ error: "No accepted bid found" });
    }
    
    const amount = Math.round(parseFloat(acceptedBid.amount) * 100); // Convert to cents
    
    const { getUncachableStripeClient } = await import('./stripeClient');
    const stripe = await getUncachableStripeClient();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        taskId: task.id,
        clientId: task.clientId,
        taskerId: task.taskerId || '',
        bidId: acceptedBid.id,
      },
    });
    
    const { getStripePublishableKey } = await import('./stripeClient');
    const publishableKey = await getStripePublishableKey();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey,
      amount: parseFloat(acceptedBid.amount),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment and complete task
router.post("/api/payments/confirm", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const { taskId, paymentIntentId } = req.body;
    if (!taskId || !paymentIntentId) {
      return res.status(400).json({ error: "taskId and paymentIntentId required" });
    }
    
    const task = await storage.getTask(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Only client can confirm" });
    
    const { getUncachableStripeClient } = await import('./stripeClient');
    const stripe = await getUncachableStripeClient();
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: "Payment not successful" });
    }
    
    const acceptedBid = await storage.getAcceptedBidForTask(task.id);
    if (!acceptedBid) {
      return res.status(400).json({ error: "No accepted bid found" });
    }
    
    const totalAmount = parseFloat(acceptedBid.amount);
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
    const taskerPayout = totalAmount - platformFee;
    
    // Update task status
    await storage.updateTask(task.id, { status: "completed" });
    
    // Credit tasker
    if (task.taskerId) {
      const tasker = await storage.getUser(task.taskerId);
      if (tasker) {
        const newBalance = parseFloat(tasker.balance || "0") + taskerPayout;
        await storage.updateUser(task.taskerId, { 
          balance: newBalance.toFixed(2),
          completedTasks: (tasker.completedTasks || 0) + 1
        });
        
        // Create transaction for tasker
        await storage.createTransaction({
          userId: task.taskerId,
          taskId: task.id,
          title: `أرباح: ${task.title}`,
          amount: taskerPayout.toFixed(2),
          type: "credit",
          status: "completed",
          icon: "account_balance_wallet",
        });
        
        // Notify tasker
        await storage.createNotification({
          userId: task.taskerId,
          type: 'task_completed',
          title: 'تم إتمام الدفع',
          message: `تم استلام ${taskerPayout.toFixed(2)} ريال مقابل "${task.title}"`,
          icon: 'check-circle',
          color: 'success',
          actionUrl: `/task/${task.id}`,
        });
      }
    }
    
    // Create transaction for client
    await storage.createTransaction({
      userId: task.clientId,
      taskId: task.id,
      title: `دفع: ${task.title}`,
      amount: totalAmount.toFixed(2),
      type: "debit",
      status: "completed",
      icon: "payment",
    });
    
    res.json({ 
      success: true,
      payment: {
        total: totalAmount,
        platformFee,
        taskerPayout,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Direct Service Requests =====

// Create a direct service request
router.post("/api/direct-requests", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const { taskerId, category, title, description, scheduledDate, scheduledTime, location, latitude, longitude, budget } = req.body;
    
    if (!taskerId || !category || !title || !description || !scheduledDate || !scheduledTime || !location || !budget) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Verify tasker exists
    const tasker = await storage.getUser(taskerId);
    if (!tasker || tasker.role !== 'tasker') {
      return res.status(400).json({ error: "Invalid tasker" });
    }
    
    const request = await storage.createDirectServiceRequest({
      clientId: req.userId,
      taskerId,
      category,
      title,
      description,
      scheduledDate,
      scheduledTime,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      budget: budget.toString(),
    });
    
    // Notify the tasker about the new service request
    const client = await storage.getUser(req.userId);
    await storage.createNotification({
      userId: taskerId,
      type: 'direct_request',
      title: 'طلب خدمة مباشر',
      message: `${client?.name || 'عميل'} يطلب خدمتك: ${title}`,
      icon: 'user-check',
      color: 'primary',
      actionUrl: `/direct-requests`,
    });
    
    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get direct requests for current user (client or tasker)
router.get("/api/direct-requests", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const user = await storage.getUser(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    let requests;
    if (user.role === 'tasker') {
      requests = await storage.getDirectServiceRequestsForTasker(req.userId);
    } else {
      requests = await storage.getDirectServiceRequestsForClient(req.userId);
    }
    
    // Enrich with user details
    const enrichedRequests = await Promise.all(requests.map(async (r) => {
      const client = await storage.getUser(r.clientId);
      const tasker = await storage.getUser(r.taskerId);
      return {
        ...r,
        client: client ? sanitizeUser(client) : null,
        tasker: tasker ? sanitizeUser(tasker) : null,
      };
    }));
    
    res.json(enrichedRequests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single direct request
router.get("/api/direct-requests/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const request = await storage.getDirectServiceRequest(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    
    // Only client or tasker can view
    if (request.clientId !== req.userId && request.taskerId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const client = await storage.getUser(request.clientId);
    const tasker = await storage.getUser(request.taskerId);
    
    res.json({
      ...request,
      client: client ? sanitizeUser(client) : null,
      tasker: tasker ? sanitizeUser(tasker) : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a direct request (tasker only)
router.post("/api/direct-requests/:id/accept", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const request = await storage.getDirectServiceRequest(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    
    if (request.taskerId !== req.userId) {
      return res.status(403).json({ error: "Only the assigned tasker can accept" });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: "Request is no longer pending" });
    }
    
    // Create a task from this direct request
    const task = await storage.createTask({
      clientId: request.clientId,
      title: request.title,
      description: request.description,
      category: request.category,
      location: request.location,
      latitude: request.latitude,
      longitude: request.longitude,
      budget: request.budget,
      date: request.scheduledDate,
      time: request.scheduledTime,
    });
    
    // Update task with assigned tasker and status
    await storage.updateTask(task.id, { 
      taskerId: request.taskerId,
      status: 'assigned',
    });
    
    // Create a bid for consistency
    const bid = await storage.createBid({
      taskId: task.id,
      taskerId: request.taskerId,
      amount: request.budget,
      message: `طلب خدمة مباشر - موعد: ${request.scheduledDate} ${request.scheduledTime}`,
    });
    
    // Accept the bid
    await storage.updateBid(bid.id, { status: 'accepted' });
    
    // Update the direct request
    const updatedRequest = await storage.updateDirectServiceRequest(request.id, {
      status: 'accepted',
      linkedTaskId: task.id,
    });
    
    // Notify client
    const tasker = await storage.getUser(request.taskerId);
    await storage.createNotification({
      userId: request.clientId,
      type: 'direct_request_accepted',
      title: 'تم قبول طلبك',
      message: `${tasker?.name || 'المنفذ'} قبل طلب خدمتك: ${request.title}`,
      icon: 'check-circle',
      color: 'success',
      actionUrl: `/task/${task.id}`,
    });
    
    res.json({
      ...updatedRequest,
      task,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject a direct request (tasker only)
router.post("/api/direct-requests/:id/reject", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const request = await storage.getDirectServiceRequest(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    
    if (request.taskerId !== req.userId) {
      return res.status(403).json({ error: "Only the assigned tasker can reject" });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: "Request is no longer pending" });
    }
    
    const updatedRequest = await storage.updateDirectServiceRequest(request.id, {
      status: 'rejected',
    });
    
    // Notify client
    const tasker = await storage.getUser(request.taskerId);
    await storage.createNotification({
      userId: request.clientId,
      type: 'direct_request_rejected',
      title: 'تم رفض طلبك',
      message: `${tasker?.name || 'المنفذ'} رفض طلب خدمتك: ${request.title}`,
      icon: 'x-circle',
      color: 'error',
      actionUrl: `/direct-requests`,
    });
    
    res.json(updatedRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel a direct request (client only)
router.post("/api/direct-requests/:id/cancel", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const request = await storage.getDirectServiceRequest(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    
    if (request.clientId !== req.userId) {
      return res.status(403).json({ error: "Only the client can cancel" });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: "Request is no longer pending" });
    }
    
    const updatedRequest = await storage.updateDirectServiceRequest(request.id, {
      status: 'cancelled',
    });
    
    // Notify tasker
    const client = await storage.getUser(request.clientId);
    await storage.createNotification({
      userId: request.taskerId,
      type: 'system',
      title: 'تم إلغاء الطلب',
      message: `${client?.name || 'العميل'} ألغى طلب الخدمة: ${request.title}`,
      icon: 'x-circle',
      color: 'warning',
      actionUrl: `/direct-requests`,
    });
    
    res.json(updatedRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN ROUTES =============

// Middleware to check if user is admin
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Get all users (admin only)
router.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users.map(u => sanitizeUser(u)));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending certificate verifications (admin only)
router.get("/api/admin/pending-verifications", requireAdmin, async (req, res) => {
  try {
    const pending = await storage.getPendingVerifications();
    res.json(pending.map(u => sanitizeUser(u)));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve tasker verification (admin only)
router.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const updated = await storage.updateUser(req.params.id, {
      verificationStatus: 'approved',
    } as any);
    
    // Notify tasker
    await storage.createNotification({
      userId: user.id,
      type: 'system',
      title: 'تم اعتماد حسابك',
      message: 'تهانينا! تم التحقق من شهادتك واعتماد حسابك كمنفذ متخصص',
      icon: 'badge-check',
      color: 'success',
      actionUrl: '/profile',
    });
    
    res.json(sanitizeUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject tasker verification (admin only)
router.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const updated = await storage.updateUser(req.params.id, {
      verificationStatus: 'rejected',
    } as any);
    
    // Notify tasker
    await storage.createNotification({
      userId: user.id,
      type: 'system',
      title: 'تم رفض طلب التحقق',
      message: reason || 'للأسف، لم يتم قبول الشهادة المقدمة. يرجى التواصل مع الدعم لمزيد من المعلومات',
      icon: 'alert-circle',
      color: 'error',
      actionUrl: '/verify',
    });
    
    res.json(sanitizeUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard stats
router.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const allUsers = await storage.getAllUsers();
    const allTasks = await storage.getTasks({});
    const pendingVerifications = await storage.getPendingVerifications();
    
    const stats = {
      totalUsers: allUsers.length,
      totalClients: allUsers.filter(u => u.role === 'client').length,
      totalTaskers: allUsers.filter(u => u.role === 'tasker').length,
      verifiedTaskers: allUsers.filter(u => u.role === 'tasker' && u.verificationStatus === 'approved').length,
      pendingVerifications: pendingVerifications.length,
      totalTasks: allTasks.length,
      openTasks: allTasks.filter(t => t.status === 'open').length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      assignedTasks: allTasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length,
    };
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const updated = await storage.updateUser(req.params.id, req.body);
    res.json(sanitizeUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= REVIEWS ROUTES =============

// Create a review for a completed task
router.post("/api/reviews", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    
    const { taskId, rating, comment } = req.body;
    
    if (!taskId || !rating) {
      return res.status(400).json({ error: "Task ID and rating are required" });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    
    const task = await storage.getTask(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    // Only client can review the tasker
    if (task.clientId !== req.userId) {
      return res.status(403).json({ error: "Only the client can review the tasker" });
    }
    
    // Task must be completed
    if (task.status !== 'completed') {
      return res.status(400).json({ error: "Task must be completed before reviewing" });
    }
    
    if (!task.taskerId) {
      return res.status(400).json({ error: "Task has no assigned tasker" });
    }
    
    // Check if review already exists
    const existingReview = await storage.getReviewForTask(taskId);
    if (existingReview) {
      return res.status(400).json({ error: "Review already exists for this task" });
    }
    
    const review = await storage.createReview({
      taskId,
      reviewerId: req.userId,
      revieweeId: task.taskerId,
      rating,
      comment: comment || null,
    });
    
    // Update tasker's average rating
    const { rating: avgRating, count } = await storage.calculateUserRating(task.taskerId);
    await storage.updateUser(task.taskerId, { rating: avgRating });
    
    // Notify tasker
    const client = await storage.getUser(req.userId);
    await storage.createNotification({
      userId: task.taskerId,
      type: 'review',
      title: 'تقييم جديد',
      message: `${client?.name || 'العميل'} قيّمك ${rating} نجوم`,
      icon: 'star',
      color: 'warning',
      actionUrl: `/profile`,
    });
    
    res.json({ review, newRating: avgRating, totalReviews: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a user
router.get("/api/users/:id/reviews", async (req, res) => {
  try {
    const reviews = await storage.getReviewsForUser(req.params.id);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a task has been reviewed
router.get("/api/tasks/:id/review", async (req, res) => {
  try {
    const review = await storage.getReviewForTask(req.params.id);
    res.json({ hasReview: !!review, review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
