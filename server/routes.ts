import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { insertUserSchema, insertTaskSchema, insertBidSchema, insertMessageSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import "express-session";
import { sendOtpEmail } from "./email";
import { sendOtpSms, isValidSaudiPhone } from "./sms";
import { getVapidPublicKey, sendPushNotification } from "./push";
import { calculateLevel, calculateProgress, POINT_VALUES, getLevelInfo } from "./levels";
import crypto from "crypto";

// ============================================
// Rate Limiting System
// ============================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetTime - now
  };
}

// Rate limit middleware factory
function rateLimit(maxRequests: number, windowMs: number, keyFn: (req: Request) => string) {
  return (req: Request, res: Response, next: Function) => {
    // Disable rate limiting in development mode
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-RateLimit-Remaining', '999');
      res.setHeader('X-RateLimit-Reset', '0');
      return next();
    }

    const key = keyFn(req);
    const result = checkRateLimit(key, maxRequests, windowMs);

    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString());

    if (!result.allowed) {
      const waitSeconds = Math.ceil(result.resetIn / 1000);
      return res.status(429).json({
        error: `تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى بعد ${waitSeconds} ثانية`,
        retryAfter: waitSeconds
      });
    }

    next();
  };
}

// Rate limit configs
// In development, rate limiting is disabled
// In production: OTP = 3 requests per 5 minutes, Login = 5 requests per 15 minutes
const otpRateLimit = rateLimit(3, 5 * 60 * 1000, (req) => `otp:${req.body.phone || req.body.email || req.ip}`);
const loginRateLimit = rateLimit(5, 15 * 60 * 1000, (req) => `login:${req.body.phone || req.body.email || req.body.username || req.ip}`);

import bcrypt from "bcryptjs";

// Simple token store for Capacitor iOS auth (tokens map to user IDs)
const authTokens = new Map<string, { userId: string; expiresAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function createAuthToken(userId: string): string {
  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  authTokens.set(token, { userId, expiresAt });
  return token;
}

function validateAuthToken(token: string): string | null {
  const data = authTokens.get(token);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    authTokens.delete(token);
    return null;
  }
  return data.userId;
}

function removeAuthToken(token: string): void {
  authTokens.delete(token);
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

// Middleware to get current user (supports both session and token auth)
const getCurrentUser = async (req: Request, res: Response, next: Function) => {
  let userId = req.session?.userId;

  // Check for Bearer token (for Capacitor iOS)
  const authHeader = req.headers.authorization;
  if (!userId && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const tokenUserId = validateAuthToken(token);
    if (tokenUserId) {
      userId = tokenUserId;
    }
  }

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
    const { username, email, password, name, role, taskerType, certificateUrl, phone } = req.body;

    // Check if phone number is already registered (username = phone)
    const existingPhone = await storage.getUserByPhone(username);
    if (existingPhone) {
      return res.status(400).json({ error: "رقم الجوال مسجل مسبقاً" });
    }

    // Also check by username
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "رقم الجوال مسجل مسبقاً" });
    }

    // Check if email is already registered
    if (email) {
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "البريد الإلكتروني مسجل مسبقاً" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = {
      username,
      email,
      password: hashedPassword,
      name,
      phone: phone || username, // Store phone number
      role: role || "client",
    };

    if (role === 'tasker') {
      const validTaskerType = taskerType === 'specialized' ? 'specialized' : 'general';
      userData.taskerType = validTaskerType;
      userData.verificationStatus = 'pending';

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

    // Create auth token for Capacitor iOS
    const token = createAuthToken(user.id);

    req.session!.userId = user.id;
    res.json({ user: sanitizeUser(user), token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/auth/login", loginRateLimit, async (req, res) => {
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

    // Create auth token for Capacitor iOS
    const token = createAuthToken(user.id);

    req.session!.userId = user.id;
    res.json({ user: sanitizeUser(user), token });
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
router.post("/api/auth/send-otp", otpRateLimit, async (req, res) => {
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
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[OTP] Email sending failed, falling back to console: ${emailResult.error}`);
        console.log(`[OTP] Email: ${email}, Code: ${code}, Type: ${type}`);
      }
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
router.post("/api/auth/verify-otp", otpRateLimit, async (req, res) => {
  try {
    const { email, code, type = "registration" } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Development bypass: Accept any OTP code in dev mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    let otpRecord = null;

    if (isDevelopment) {
      // In development mode, bypass OTP verification
      const existingOtp = await storage.getPendingOtpByEmail(email, type);
      if (existingOtp) {
        otpRecord = existingOtp;
        await storage.markOtpAsVerified(otpRecord.id);
      } else {
        // Create a dummy verified OTP record for development
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await storage.createOtpCode({
          email,
          code,
          type,
          expiresAt,
          verified: true,
        } as any);
      }
      console.log(`[DEV] OTP bypassed for email: ${email}, type: ${type}`);
    } else {
      // Production: Verify OTP normally
      otpRecord = await storage.getValidOtpCode(email, code, type);

      if (!otpRecord) {
        // Check if there's any pending OTP for this email to increment attempts
        const existingOtp = await storage.getPendingOtpByEmail(email, type);
        if (existingOtp) {
          await storage.incrementOtpAttempts(existingOtp.id);
        }
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      await storage.markOtpAsVerified(otpRecord.id);
    }

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
router.post("/api/auth/login-with-otp", loginRateLimit, async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    // Development bypass: Accept any OTP code in dev mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    let otpRecord = null;

    if (isDevelopment) {
      // In development mode, bypass OTP verification
      console.log(`[DEV] OTP bypassed for login with email: ${email}`);
    } else {
      // Production: Verify OTP normally
      otpRecord = await storage.getValidOtpCode(email, otpCode, "login");

      if (!otpRecord) {
        // Check if there's any pending OTP for this email to increment attempts
        const existingOtp = await storage.getPendingOtpByEmail(email, "login");
        if (existingOtp) {
          await storage.incrementOtpAttempts(existingOtp.id);
        }
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Mark OTP as verified
      await storage.markOtpAsVerified(otpRecord.id);
    }

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No account found with this email" });
    }

    // Create auth token for Capacitor iOS
    const token = createAuthToken(user.id);

    // Create session
    req.session!.userId = user.id;

    res.json({
      success: true,
      user: sanitizeUser(user),
      token,
      message: "Logged in successfully"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send OTP via SMS (phone)
router.post("/api/auth/send-phone-otp", otpRateLimit, async (req, res) => {
  try {
    const { phone, type = "login" } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Validate Saudi phone number
    if (!isValidSaudiPhone(phone)) {
      return res.status(400).json({ error: "Please enter a valid Saudi phone number" });
    }

    // For login type, verify user exists with this phone
    if (type === "login") {
      const existingUser = await storage.getUserByPhone(phone);
      if (!existingUser) {
        return res.status(400).json({ error: "No account found with this phone number" });
      }
    }

    // For registration, check phone isn't already registered
    if (type === "registration") {
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with phone as identifier (using email field for compatibility)
    await storage.createOtpCode({
      email: phone, // Using email field to store phone for OTP lookup
      code,
      type: `phone_${type}`,
      expiresAt,
    });

    // Send SMS via Infobip
    const smsResult = await sendOtpSms(phone, code, type as any);

    if (!smsResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[OTP] SMS sending failed: ${smsResult.error}`);
        console.log(`[OTP] Phone: ${phone}, Code: ${code}, Type: ${type}`);
      }
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      // Include OTP in dev mode for testing if SMS fails
      ...(process.env.NODE_ENV !== 'production' && !smsResult.success && { devCode: code })
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify phone OTP (for registration)
router.post("/api/auth/verify-phone-otp", otpRateLimit, async (req, res) => {
  try {
    const { phone, otpCode } = req.body;

    if (!phone || !otpCode) {
      return res.status(400).json({ error: "Phone and OTP code are required" });
    }

    // Development bypass: Accept any OTP code in dev mode - return success immediately
    // Only require OTP verification if explicitly in production mode
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    const isProduction = nodeEnv === 'production';
    const isDevelopment = !isProduction; // Default to development if not explicitly production
    
    // Debug: Log environment info
    console.log(`[OTP Verify] NODE_ENV: "${process.env.NODE_ENV || 'undefined'}", isProduction: ${isProduction}, isDevelopment: ${isDevelopment}`);
    console.log(`[OTP Verify] Request - phone: ${phone}, code: ${otpCode}`);
    
    if (isDevelopment) {
      // In development mode, bypass OTP verification completely
      console.log(`[DEV] ✅ OTP BYPASSED - Accepting verification for phone: ${phone}`);
      
      // Try to mark any existing OTP as verified (optional, for cleanup)
      try {
        const existingOtp = await storage.getPendingOtpByEmail(phone, "phone_registration");
        if (existingOtp) {
          await storage.markOtpAsVerified(existingOtp.id);
          console.log(`[DEV] Marked existing OTP as verified`);
        }
      } catch (error: any) {
        // Ignore errors in dev mode - we're bypassing anyway
        console.log(`[DEV] Note: Could not mark OTP as verified (this is OK): ${error?.message || 'unknown error'}`);
      }
      
      return res.json({
        success: true,
        message: "Phone verified successfully (dev mode)"
      });
    }
    
    console.log(`[PROD] OTP verification required (production mode)`);

    // Production: Verify OTP normally
    const otpRecord = await storage.getValidOtpCode(phone, otpCode, "phone_registration");

    if (!otpRecord) {
      const existingOtp = await storage.getPendingOtpByEmail(phone, "phone_registration");
      if (existingOtp) {
        await storage.incrementOtpAttempts(existingOtp.id);
      }
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as verified
    await storage.markOtpAsVerified(otpRecord.id);

    res.json({
      success: true,
      message: "Phone verified successfully"
    });
  } catch (error: any) {
    console.error('[verify-phone-otp] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login with phone OTP
router.post("/api/auth/login-with-phone-otp", loginRateLimit, async (req, res) => {
  try {
    const { phone, otpCode } = req.body;

    if (!phone || !otpCode) {
      return res.status(400).json({ error: "Phone and OTP code are required" });
    }

    // Development bypass: Accept any OTP code in dev mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    let otpRecord = null;

    if (isDevelopment) {
      // In development mode, bypass OTP verification completely
      console.log(`[DEV] OTP bypassed for phone login: ${phone}`);
    } else {
      // Production: Verify OTP normally
      otpRecord = await storage.getValidOtpCode(phone, otpCode, "phone_login");

      if (!otpRecord) {
        const existingOtp = await storage.getPendingOtpByEmail(phone, "phone_login");
        if (existingOtp) {
          await storage.incrementOtpAttempts(existingOtp.id);
        }
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
    }

    // Get user by phone
    const user = await storage.getUserByPhone(phone);
    if (!user) {
      return res.status(400).json({ error: "No account found with this phone number" });
    }

    // Mark OTP as verified (only in production mode)
    if (otpRecord && !isDevelopment) {
      await storage.markOtpAsVerified(otpRecord.id);
    }

    // Create auth token for Capacitor iOS
    const token = createAuthToken(user.id);

    // Create session
    req.session!.userId = user.id;

    res.json({
      success: true,
      user: sanitizeUser(user),
      token,
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

    // Development bypass: Accept any OTP code in dev mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    let otpRecord = null;

    if (isDevelopment) {
      // In development mode, bypass OTP verification
      console.log(`[DEV] OTP bypassed for registration with email: ${email}`);
      // Create a dummy verified OTP record for development
      const existingOtp = await storage.getPendingOtpByEmail(email, "registration");
      if (existingOtp) {
        otpRecord = existingOtp;
        await storage.markOtpAsVerified(otpRecord.id);
      }
    } else {
      // Production: Verify OTP normally
      otpRecord = await storage.getValidOtpCode(email, otpCode, "registration");
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
      userData.verificationStatus = 'pending';

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

    // Create auth token for Capacitor iOS
    const token = createAuthToken(user.id);

    req.session!.userId = user.id;
    res.json({ user: sanitizeUser(user), token });
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

// Apply to become a tasker (for existing clients)
router.post("/api/users/apply-tasker", async (req, res) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { taskerType, certificateUrl } = req.body;

    if (!taskerType || !['general', 'specialized'].includes(taskerType)) {
      return res.status(400).json({ error: "Invalid tasker type" });
    }

    // For specialized taskers, require certificate
    if (taskerType === 'specialized' && !certificateUrl) {
      return res.status(400).json({ error: "Certificate required for specialized taskers" });
    }

    const updateData: any = {
      taskerType,
      verificationStatus: 'pending',
    };

    if (certificateUrl) {
      if (typeof certificateUrl === 'string' && certificateUrl.startsWith('data:image/')) {
        const base64Length = certificateUrl.length * 0.75;
        const maxSize = 5 * 1024 * 1024;
        if (base64Length <= maxSize) {
          updateData.certificateUrl = certificateUrl;
        }
      }
    }

    const updated = await storage.updateUser(req.userId, updateData);

    // Create notification - all taskers are pending until admin approval
    await storage.createNotification({
      userId: req.userId,
      type: 'system',
      title: 'تم استلام طلبك',
      message: taskerType === 'specialized'
        ? 'تم استلام طلبك للانضمام كمنفذ متخصص وسيتم مراجعته قريبًا'
        : 'تم استلام طلبك للانضمام كمنفذ وسيتم مراجعته قريبًا',
      icon: 'clock',
      color: 'warning',
      actionUrl: '/settings',
    });

    res.json({ user: sanitizeUser(updated) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Switch role between client and tasker
router.post("/api/users/switch-role", async (req, res) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { role } = req.body;

    if (!role || !['client', 'tasker'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // If switching to tasker, check that user is approved
    if (role === 'tasker') {
      if (!req.user.taskerType) {
        return res.status(403).json({ error: "You must apply to become a tasker first" });
      }
      if (req.user.verificationStatus !== 'approved') {
        return res.status(403).json({ error: "Your tasker application is still pending approval" });
      }
    }

    const updated = await storage.updateUser(req.userId, { role });
    res.json({ user: sanitizeUser(updated) });
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

    const user = await storage.getUser(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get tasks where user is client OR tasker
    let clientTasks: any[] = [];
    let taskerTasks: any[] = [];
    
    try {
      const results = await Promise.all([
        storage.getTasks({ clientId: req.userId }).catch(err => {
          console.error('[Get My Tasks] Error fetching client tasks:', err);
          return [];
        }),
        storage.getTasks({ taskerId: req.userId }).catch(err => {
          console.error('[Get My Tasks] Error fetching tasker tasks:', err);
          return [];
        }),
      ]);
      
      clientTasks = Array.isArray(results[0]) ? results[0] : [];
      taskerTasks = Array.isArray(results[1]) ? results[1] : [];
    } catch (queryError: any) {
      console.error('[Get My Tasks] Query error:', queryError);
      return res.status(500).json({ 
        error: "Failed to fetch tasks",
        message: "حدث خطأ أثناء جلب المهام. يرجى المحاولة مرة أخرى."
      });
    }

    // Combine and deduplicate by task ID
    const allTasks = [...(clientTasks || []), ...(taskerTasks || [])];
    // Filter out any invalid tasks and deduplicate by task ID
    const validTasks = allTasks.filter(task => task && task.id);
    const uniqueTasks = Array.from(
      new Map(validTasks.map(task => [task.id, task])).values()
    );
    
    // Verify that tasks with taskerId are included
    if (taskerTasks.length > 0) {
      const taskerTasksInResult = uniqueTasks.filter(t => t.taskerId === req.userId);
      if (taskerTasksInResult.length === 0) {
        console.warn('[WARNING] Tasks with taskerId found but not in result', { 
          taskerTasksCount: taskerTasks.length, 
          taskerTaskIds: taskerTasks.map(t => t?.id),
          uniqueTasksCount: uniqueTasks.length,
          uniqueTaskIds: uniqueTasks.map(t => t?.id)
        });
      }
    }
    
    // Log all task statuses for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] All tasks for user', {
        userId: req.userId,
        totalTasks: uniqueTasks.length,
        taskDetails: uniqueTasks.map(t => ({
          id: t?.id,
          title: t?.title,
          status: t?.status,
          taskerId: t?.taskerId,
          clientId: t?.clientId,
        }))
      });
    }

    res.json(uniqueTasks);
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
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Enrich task with client and tasker data (TaskWithDetails)
    const [client, tasker] = await Promise.all([
      task.clientId ? storage.getUser(task.clientId) : Promise.resolve(undefined),
      task.taskerId ? storage.getUser(task.taskerId) : Promise.resolve(undefined),
    ]);

    const enrichedTask = {
      ...task,
      client: client ? sanitizeUser(client) : undefined,
      tasker: tasker ? sanitizeUser(tasker) : undefined,
    };

    res.json(enrichedTask);
  } catch (error: any) {
    console.error('[Task Details] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Daily task limit for clients: 5 tasks per day
const DAILY_TASK_LIMIT = 5;

// Location validation - OPEN TO ALL REGIONS
// Previously restricted to Riyadh, now open globally
function isLocationInRiyadh(latitude?: number, longitude?: number): boolean {
  // Always return true - service is available in all regions
  return true;
}

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

    // Validate required fields
    const { title, description, budget, category } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        error: "Invalid title",
        message: "عنوان المهمة يجب أن يكون 3 أحرف على الأقل",
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        error: "Invalid description",
        message: "وصف المهمة يجب أن يكون 10 أحرف على الأقل",
      });
    }

    // Validate budget (must be positive number, min 10 SAR)
    const budgetNum = typeof budget === 'string' ? parseFloat(budget) : Number(budget);
    if (isNaN(budgetNum) || budgetNum < 10 || budgetNum > 100000) {
      return res.status(400).json({
        error: "Invalid budget",
        message: "الميزانية يجب أن تكون بين 10 و 100,000 ريال",
      });
    }

    if (!category || typeof category !== 'string') {
      return res.status(400).json({
        error: "Invalid category",
        message: "يجب اختيار تصنيف للمهمة",
      });
    }

    // Check daily task limit for clients (disabled in development)
    if (process.env.NODE_ENV !== 'development') {
      const todayCount = await storage.getTasksCreatedToday(String(req.userId));
      if (todayCount >= DAILY_TASK_LIMIT) {
        return res.status(429).json({
          error: "Daily task limit reached",
          message: "You can only post 5 tasks per day. Please try again tomorrow.",
          limit: DAILY_TASK_LIMIT,
          count: todayCount
        });
      }
    }

    // Validate location is within Riyadh
    const { latitude, longitude } = req.body;
    if (latitude !== undefined && longitude !== undefined) {
      const lat = typeof latitude === 'string' ? parseFloat(latitude) : Number(latitude);
      const lng = typeof longitude === 'string' ? parseFloat(longitude) : Number(longitude);

      // Validate they are valid numbers
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          error: "Invalid coordinates",
          message: "إحداثيات الموقع غير صحيحة",
        });
      }

      // Validate they are in valid ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          error: "Invalid coordinates",
          message: "إحداثيات الموقع غير صحيحة",
        });
      }

      // Location validation removed - service available in all regions
      // Coordinates are validated for range but not restricted to specific area
    }

    // Prepare task data with proper types
    const taskData: any = {
      title: title.trim(),
      description: description.trim(),
      category: category,
      budget: budgetNum.toString(), // Convert to string for decimal field
      location: req.body.location || '',
      date: req.body.date || '',
      time: req.body.time || '',
      clientId: req.userId,
      status: 'open',
    };

    // Add optional fields if provided
    if (latitude !== undefined && longitude !== undefined) {
      const lat = typeof latitude === 'string' ? parseFloat(latitude) : Number(latitude);
      const lng = typeof longitude === 'string' ? parseFloat(longitude) : Number(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        taskData.latitude = lat.toString();
        taskData.longitude = lng.toString();
      }
    }

    // Validate required fields are present
    if (!taskData.location || taskData.location.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid location",
        message: "يجب تحديد موقع المهمة",
      });
    }

    if (!taskData.date || taskData.date.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid date",
        message: "يجب تحديد تاريخ المهمة",
      });
    }

    if (!taskData.time || taskData.time.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid time",
        message: "يجب تحديد وقت المهمة",
      });
    }

    try {
      const task = await storage.createTask(taskData);

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
        // Log error but don't fail the request
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to send category notifications:', notifError);
        }
      }

      res.json(task);
    } catch (dbError: any) {
      console.error('[Create Task] Database error:', dbError);
      // Provide more helpful error messages
      if (dbError.message?.includes('violates') || dbError.message?.includes('constraint')) {
        return res.status(400).json({
          error: "Database constraint violation",
          message: "البيانات المرسلة غير صحيحة. يرجى التحقق من جميع الحقول.",
        });
      }
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('[Create Task] Error:', error);
    res.status(500).json({ 
      error: error.message || "حدث خطأ أثناء إنشاء المهمة",
      message: error.message || "حدث خطأ أثناء إنشاء المهمة. يرجى المحاولة مرة أخرى."
    });
  }
});

router.patch("/api/tasks/:id", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });

    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.clientId !== req.userId) return res.status(403).json({ error: "Not authorized" });

    // Validate location is within Riyadh if updating coordinates
    const { latitude, longitude } = req.body;
    if (latitude !== undefined && longitude !== undefined) {
      const lat = typeof latitude === 'string' ? parseFloat(latitude) : Number(latitude);
      const lng = typeof longitude === 'string' ? parseFloat(longitude) : Number(longitude);

      // Validate they are valid numbers
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          error: "Invalid coordinates",
          message: "إحداثيات الموقع غير صحيحة",
        });
      }

      // Validate they are in valid ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          error: "Invalid coordinates",
          message: "إحداثيات الموقع غير صحيحة",
        });
      }

      // Location validation removed - service available in all regions
      // Coordinates are validated for range but not restricted to specific area
    }

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
// Bids routes
router.get("/api/tasks/:id/bids", async (req, res) => {
  try {
    const bids = await storage.getBidsForTask(req.params.id);

    // Enrich with tasker details and filter out invalid bids
    const enrichedBids = await Promise.all(bids.map(async (bid) => {
      const tasker = await storage.getUser(bid.taskerId);
      return {
        ...bid,
        tasker: tasker ? sanitizeUser(tasker) : null,
      };
    }));

    // Filter out bids that don't have valid taskers (null or undefined)
    // Only return bids that have a valid tasker attached
    const validBids = enrichedBids.filter(bid => bid.tasker !== null && bid.tasker !== undefined);

    res.json(validBids);
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
    // Update task status to "in_progress" instead of "assigned" so it appears in IN PROGRESS tab
    const updatedTask = await storage.updateTask(bid.taskId, { status: "in_progress", taskerId: bid.taskerId });
    
    // Verify the task was updated correctly
    if (!updatedTask) {
      console.error('[ERROR] Task update returned undefined', { taskId: bid.taskId, bidTaskerId: bid.taskerId });
      return res.status(500).json({ error: "Failed to update task" });
    }
    
    if (updatedTask.taskerId !== bid.taskerId) {
      console.error('[ERROR] Task taskerId mismatch', { 
        taskId: bid.taskId, 
        expectedTaskerId: bid.taskerId, 
        actualTaskerId: updatedTask.taskerId 
      });
      return res.status(500).json({ error: "Task taskerId was not set correctly" });
    }
    
    // Verify the task can be retrieved by taskerId
    const verifyTasks = await storage.getTasks({ taskerId: bid.taskerId });
    const taskFound = verifyTasks.some(t => t.id === bid.taskId);
    if (!taskFound) {
      console.error('[ERROR] Task not found in tasker tasks after update', { 
        taskId: bid.taskId, 
        taskerId: bid.taskerId,
        verifyTasksCount: verifyTasks.length,
        verifyTaskIds: verifyTasks.map(t => t.id)
      });
    } else {
      console.log('[DEBUG] Task verified in tasker tasks', { taskId: bid.taskId, taskerId: bid.taskerId });
    }

    // Notify tasker that their bid was accepted and task is now active
    const client = await storage.getUser(req.userId);
    await storage.createNotification({
      userId: bid.taskerId,
      type: 'bid_received',
      title: 'تم قبول عرضك',
      message: `تم قبول عرضك على المهمة "${task.title}". يمكنك الآن البدء بالعمل.`,
      icon: 'check-circle',
      color: 'success',
      actionUrl: `/task/${task.id}`,
    });

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
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });

    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Verify user has access to this task (either client or tasker)
    if (task.clientId !== req.userId && task.taskerId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to view messages for this task" });
    }

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

    // Verify user has access to this task (either client or tasker)
    if (task.clientId !== req.userId && task.taskerId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to send messages for this task" });
    }

    const receiverId = task.clientId === req.userId ? task.taskerId : task.clientId;
    if (!receiverId) return res.status(400).json({ error: "No receiver for message" });

    const message = await storage.createMessage({
      taskId: req.params.id,
      senderId: req.userId,
      receiverId,
      content: req.body.content,
    });
    
    // Fetch message with sender and receiver data
    const [sender, receiver] = await Promise.all([
      storage.getUser(message.senderId),
      storage.getUser(message.receiverId),
    ]);
    
    res.json({
      ...message,
      sender,
      receiver,
    });
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

    // Update task status to in_progress (waiting for payment)
    await storage.updateTask(task.id, { status: "in_progress" });

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

// Send payment reminder from tasker to client
router.post("/api/tasks/:id/send-payment-reminder", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });

    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.taskerId !== req.userId) return res.status(403).json({ error: "Only assigned tasker can send reminder" });

    if (task.status !== 'in_progress') {
      return res.status(400).json({ error: "Task is not waiting for payment" });
    }

    const acceptedBid = await storage.getAcceptedBidForTask(task.id);
    const amount = acceptedBid ? acceptedBid.amount : task.budget;

    // Send notification to client
    await storage.createNotification({
      userId: task.clientId,
      type: 'payment_request',
      title: 'تذكير بالدفع',
      message: `يرجى إتمام دفع ${amount} ريال للمهمة "${task.title}"`,
      icon: 'bell',
      color: 'warning',
      actionUrl: `/task/${task.id}`,
    });

    res.json({
      success: true,
      message: 'Payment reminder sent to client'
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

// ============= PUSH NOTIFICATIONS =============

// Get VAPID public key
router.get("/api/push/vapid-key", (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// Subscribe to push notifications
router.post("/api/push/subscribe", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });

    const { endpoint, p256dh, auth, deviceType } = req.body;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    if (!deviceType || typeof deviceType !== 'string') {
      return res.status(400).json({ error: "Device type is required" });
    }

    // Validate device type
    const validDeviceTypes = ['web', 'ios', 'android'];
    if (!validDeviceTypes.includes(deviceType)) {
      return res.status(400).json({ error: "Invalid device type" });
    }

    // For web subscriptions, require valid p256dh and auth keys
    if (deviceType === 'web') {
      if (!p256dh || typeof p256dh !== 'string' || p256dh === '' || p256dh === 'native' || p256dh.length < 20) {
        return res.status(400).json({ error: "Valid p256dh key is required for web subscriptions" });
      }
      if (!auth || typeof auth !== 'string' || auth === '' || auth === 'native' || auth.length < 10) {
        return res.status(400).json({ error: "Valid auth key is required for web subscriptions" });
      }
      // Web push endpoints must be HTTPS URLs
      if (!endpoint.startsWith('https://')) {
        return res.status(400).json({ error: "Invalid web push endpoint" });
      }
    }

    // For native platforms (ios/android), endpoint should contain native prefix
    if ((deviceType === 'ios' || deviceType === 'android')) {
      // Native tokens can be plain tokens or prefixed - accept either
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Push] Native subscription: ${deviceType}, endpoint length: ${endpoint.length}`);
      }
    }

    // Save subscription to database
    await storage.savePushSubscription({
      userId: req.userId,
      endpoint,
      p256dh: deviceType === 'web' ? p256dh : 'native',
      auth: deviceType === 'web' ? auth : 'native',
      deviceType,
    });

    // Update user's push token for native apps
    if (deviceType === 'ios' || deviceType === 'android') {
      await storage.updateUser(req.userId, { pushToken: endpoint });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Push] Subscription saved for user ${req.userId}, type: ${deviceType}`);
    }
    res.json({ success: true });
  } catch (error: any) {
    // Always log errors, but use appropriate level
    if (process.env.NODE_ENV === 'development') {
      console.error('[Push] Subscribe error:', error);
    }
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from push notifications
router.post("/api/push/unsubscribe", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });

    await storage.deletePushSubscription(req.userId);
    await storage.updateUser(req.userId, { pushToken: null });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= LEVEL SYSTEM =============

// Get user level info
router.get("/api/users/:id/level", async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const progress = calculateProgress(user.experiencePoints || 0);

    res.json({
      level: user.taskerLevel || 'bronze',
      experiencePoints: user.experiencePoints || 0,
      ...progress,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ENHANCED REVIEWS =============

// Create review with detailed ratings
router.post("/api/tasks/:id/review-detailed", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });

    const taskId = req.params.id;
    const { rating, qualityRating, speedRating, communicationRating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const task = await storage.getTask(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.clientId !== req.userId) {
      return res.status(403).json({ error: "Only the client can review the tasker" });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ error: "Task must be completed before reviewing" });
    }

    if (!task.taskerId) {
      return res.status(400).json({ error: "Task has no assigned tasker" });
    }

    const existingReview = await storage.getReviewForTask(taskId);
    if (existingReview) {
      return res.status(400).json({ error: "Review already exists for this task" });
    }

    const review = await storage.createReview({
      taskId,
      reviewerId: req.userId,
      revieweeId: task.taskerId,
      rating,
      qualityRating: qualityRating || null,
      speedRating: speedRating || null,
      communicationRating: communicationRating || null,
      comment: comment || null,
    });

    // Update tasker's rating
    const { rating: avgRating, count } = await storage.calculateUserRating(task.taskerId);
    await storage.updateUser(task.taskerId, { rating: avgRating });

    // Award experience points based on rating
    const tasker = await storage.getUser(task.taskerId);
    if (tasker) {
      let pointsEarned = POINT_VALUES.taskCompleted;
      if (rating === 5) pointsEarned += POINT_VALUES.fiveStarRating;
      else if (rating === 4) pointsEarned += POINT_VALUES.fourStarRating;
      else if (rating === 3) pointsEarned += POINT_VALUES.threeStarRating;

      const newPoints = (tasker.experiencePoints || 0) + pointsEarned;
      const newLevel = calculateLevel(newPoints);

      await storage.updateUser(task.taskerId, {
        experiencePoints: newPoints,
        taskerLevel: newLevel,
      });

      // Notify tasker of level up if applicable
      if (newLevel !== tasker.taskerLevel) {
        const levelInfo = getLevelInfo(newLevel);
        await storage.createNotification({
          userId: task.taskerId,
          type: 'system',
          title: 'ترقية المستوى! 🎉',
          message: `مبروك! وصلت إلى المستوى ${levelInfo.nameAr}`,
          icon: 'trophy',
          color: 'success',
          actionUrl: '/profile',
        });
      }
    }

    // Notify tasker
    const client = await storage.getUser(req.userId);
    await storage.createNotification({
      userId: task.taskerId,
      type: 'review',
      title: 'تقييم جديد',
      message: `${client?.name || 'العميل'} قيّمك ${rating} نجوم`,
      icon: 'star',
      color: 'warning',
      actionUrl: '/profile',
    });

    res.json({ review, newRating: avgRating, totalReviews: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= PAYLINK PAYMENT INTEGRATION =============

// Paylink API URLs - Use test environment for development, production for live
const isDevelopment = process.env.NODE_ENV === 'development';
const PAYLINK_AUTH_URL = isDevelopment 
  ? 'https://restpilot.paylink.sa/api/auth'  // Test/Sandbox
  : 'https://restapi.paylink.sa/api/auth';    // Production
const PAYLINK_INVOICE_URL = isDevelopment
  ? 'https://restpilot.paylink.sa/api/addInvoice'  // Test/Sandbox
  : 'https://restapi.paylink.sa/api/addInvoice';    // Production

// Paylink test credentials (for development only)
const PAYLINK_TEST_APP_ID = 'APP_ID_1123453311';
const PAYLINK_TEST_SECRET_KEY = '0662abb5-13c7-38ab-cd12-236e58f43766';

// Authenticate with Paylink API
async function authenticatePaylink(): Promise<string> {
  // In development, ALWAYS use test credentials (Paylink sandbox)
  // In production, use environment variables
  const appId = isDevelopment ? PAYLINK_TEST_APP_ID : process.env.PAYLINK_APP_ID;
  const secretKey = isDevelopment ? PAYLINK_TEST_SECRET_KEY : process.env.PAYLINK_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('Paylink credentials not configured. Set PAYLINK_APP_ID and PAYLINK_SECRET_KEY environment variables.');
  }

  const response = await fetch(PAYLINK_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiId: appId,
      secretKey: secretKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Paylink auth error:', errorText);
    throw new Error(`Failed to authenticate with Paylink: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.id_token) {
    throw new Error('No id_token received from Paylink');
  }

  return data.id_token;
}

// Create payment link with Paylink
router.post("/api/payments/create-link", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { taskId, amount, clientPhone, clientName } = req.body;

    // Validate required fields
    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // Get task to verify it exists
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Verify user is the task owner
    if (task.clientId !== req.userId) {
      return res.status(403).json({ error: "Only the task owner can make payment" });
    }

    // Get user info
    const user = await storage.getUser(req.userId);
    const customerName = clientName || user?.name || 'Customer';
    const customerPhone = clientPhone || user?.phone || '0500000000';

    // Get base URL for callbacks
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?taskId=${taskId}`;
    const cancelUrl = `${baseUrl}/payment/failed?taskId=${taskId}`;

    // Step 1: Authenticate with Paylink
    console.log('Authenticating with Paylink...');
    const idToken = await authenticatePaylink();

    // Step 2: Create invoice
    console.log('Creating Paylink invoice...');
    const invoiceBody = {
      amount: amount,
      clientName: customerName,
      clientMobile: customerPhone,
      orderNumber: `Task-${taskId}`,
      callBackUrl: successUrl,
      cancelUrl: cancelUrl,
      products: [
        {
          title: task.title || 'Task Payment',
          price: amount,
          qty: 1,
        },
      ],
    };

    const invoiceResponse = await fetch(PAYLINK_INVOICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(invoiceBody),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error('Paylink invoice error:', errorText);
      return res.status(500).json({ error: 'Failed to create payment link' });
    }

    const invoiceData = await invoiceResponse.json();

    // Paylink returns the URL and transaction number
    const paymentUrl = invoiceData.url || invoiceData.gatewayOrderRequest?.url;
    const transactionNo = invoiceData.transactionNo || invoiceData.gatewayOrderRequest?.transactionNo;

    if (!paymentUrl || !transactionNo) {
      console.error('Invalid Paylink response:', invoiceData);
      return res.status(500).json({ error: 'Invalid response from Paylink' });
    }

    console.log('Payment link created successfully:', { transactionNo, paymentUrl });

    res.json({
      success: true,
      url: paymentUrl,
      transactionNo: transactionNo,
    });

  } catch (error: any) {
    console.error('Payment link creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment link' });
  }
});
