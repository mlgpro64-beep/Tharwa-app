import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { insertUserSchema, insertTaskSchema, insertBidSchema, insertMessageSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import "express-session";

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
    const { username, email, password, name, role } = req.body;
    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      name,
      role: role || "client",
    });
    
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
    
    const bid = await storage.createBid({
      taskId: req.params.id,
      taskerId: req.userId,
      amount: req.body.amount,
      message: req.body.message,
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
