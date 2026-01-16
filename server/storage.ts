import { db } from "./db";
import { 
  users, tasks, bids, transactions, messages, notifications, savedTasks,
  professionalRoles, userProfessionalRoles, taskerAvailability, userPhotos,
  directServiceRequests, otpCodes, reviews, pushSubscriptions, payments,
  insertUserSchema, insertTaskSchema, insertBidSchema, insertTransactionSchema,
  insertMessageSchema, insertNotificationSchema, insertPaymentSchema
} from "@shared/schema";
import { eq, and, or, desc, like, ilike, sql, asc, lt, gt, avg, count, inArray } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import type { 
  User, Task, Bid, Transaction, Message, Notification, SavedTask,
  ProfessionalRole, UserProfessionalRole, TaskerAvailability, UserPhoto,
  DirectServiceRequest, InsertDirectServiceRequest, OtpCode, InsertOtpCode,
  Review, InsertReview, PushSubscription, InsertPushSubscription, Payment, InsertPayment,
  InsertUser, InsertTask, InsertBid, InsertTransaction, InsertMessage, InsertNotification,
  InsertProfessionalRole, InsertUserProfessionalRole, InsertTaskerAvailability, InsertUserPhoto
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser> & { balance?: string; completedTasks?: number; rating?: string }): Promise<User>;
  searchTaskers(filters?: { category?: string; verified?: boolean; search?: string; interactedOnly?: boolean; currentUserId?: string }): Promise<User[]>;
  getTaskersByCategory(category: string): Promise<User[]>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(filters?: { clientId?: string; taskerId?: string; status?: string; category?: string }): Promise<Task[]>;
  getTasksCreatedToday(userId: string): Promise<number>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Bids
  getBid(id: string): Promise<Bid | undefined>;
  getBidsForTask(taskId: string): Promise<Bid[]>;
  getAcceptedBidForTask(taskId: string): Promise<Bid | undefined>;
  createBid(data: InsertBid): Promise<Bid>;
  updateBid(id: string, data: Partial<Bid>): Promise<Bid>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesForTask(taskId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsForUser(userId: string): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  
  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  
  // Saved Tasks
  getSavedTasksForUser(userId: string): Promise<SavedTask[]>;
  saveTask(userId: string, taskId: string): Promise<SavedTask>;
  unsaveTask(userId: string, taskId: string): Promise<void>;
  
  // Professional Roles
  getProfessionalRoles(): Promise<ProfessionalRole[]>;
  getProfessionalRole(id: string): Promise<ProfessionalRole | undefined>;
  getProfessionalRoleBySlug(slug: string): Promise<ProfessionalRole | undefined>;
  
  // User Professional Roles
  getUserProfessionalRoles(userId: string): Promise<(UserProfessionalRole & { role: ProfessionalRole })[]>;
  assignProfessionalRole(data: InsertUserProfessionalRole): Promise<UserProfessionalRole>;
  removeProfessionalRole(userId: string, roleId: string): Promise<void>;
  
  // Tasker Availability
  getTaskerAvailability(userId: string, startDate?: string, endDate?: string): Promise<TaskerAvailability[]>;
  getTaskerAvailabilityById(id: string): Promise<TaskerAvailability | undefined>;
  setTaskerAvailability(data: InsertTaskerAvailability): Promise<TaskerAvailability>;
  updateTaskerAvailability(id: string, data: Partial<InsertTaskerAvailability>): Promise<TaskerAvailability>;
  deleteTaskerAvailability(id: string): Promise<void>;
  
  // User Photos (Portfolio)
  getUserPhotos(userId: string): Promise<UserPhoto[]>;
  getUserPhotoById(id: string): Promise<UserPhoto | undefined>;
  addUserPhoto(data: InsertUserPhoto): Promise<UserPhoto>;
  updateUserPhoto(id: string, data: Partial<InsertUserPhoto>): Promise<UserPhoto>;
  deleteUserPhoto(id: string): Promise<void>;
  reorderUserPhotos(userId: string, photoIds: string[]): Promise<void>;
  
  // Direct Service Requests
  getDirectServiceRequest(id: string): Promise<DirectServiceRequest | undefined>;
  getDirectServiceRequestsForClient(clientId: string): Promise<DirectServiceRequest[]>;
  getDirectServiceRequestsForTasker(taskerId: string): Promise<DirectServiceRequest[]>;
  createDirectServiceRequest(data: InsertDirectServiceRequest): Promise<DirectServiceRequest>;
  updateDirectServiceRequest(id: string, data: Partial<DirectServiceRequest>): Promise<DirectServiceRequest>;
  
  // OTP Codes
  createOtpCode(data: InsertOtpCode): Promise<OtpCode>;
  getValidOtpCode(email: string, code: string, type: string): Promise<OtpCode | undefined>;
  getPendingOtpByEmail(email: string, type: string): Promise<OtpCode | undefined>;
  markOtpAsVerified(id: string): Promise<OtpCode>;
  incrementOtpAttempts(id: string): Promise<OtpCode>;
  deleteExpiredOtpCodes(): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getPendingVerifications(): Promise<User[]>;
  
  // Reviews
  createReview(data: InsertReview): Promise<Review>;
  getReviewsForUser(userId: string): Promise<Review[]>;
  getReviewForTask(taskId: string): Promise<Review | undefined>;
  calculateUserRating(userId: string): Promise<{ rating: string; count: number }>;
  
  // Push Subscriptions
  savePushSubscription(data: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(userId: string): Promise<void>;
  getPushSubscription(userId: string): Promise<PushSubscription | undefined>;
  
  // Payments (Paylink)
  createPayment(data: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByPaylinkInvoiceId(invoiceId: string): Promise<Payment | undefined>;
  getPaymentsForUser(userId: string): Promise<Payment[]>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment>;
}

export const storage: IStorage = {
  // Users
  async getUser(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  },
  
  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  },
  
  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  },
  
  async getUserByPhone(phone: string) {
    // Normalize phone number for lookup
    const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    // Try multiple formats: with/without country code, with/without leading zero
    const phoneVariants = [
      normalizedPhone,
      normalizedPhone.replace(/^\+/, ''),
      normalizedPhone.replace(/^966/, '0'),
      normalizedPhone.replace(/^\+966/, '0'),
      `+${normalizedPhone}`,
      `+966${normalizedPhone.replace(/^0/, '')}`,
    ];
    
    for (const variant of phoneVariants) {
      const result = await db.select().from(users).where(eq(users.phone, variant)).limit(1);
      if (result[0]) return result[0];
    }
    return undefined;
  },
  
  async createUser(data: InsertUser) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },
  
  async updateUser(id: string, data: Partial<InsertUser> & { balance?: string; completedTasks?: number; rating?: string }) {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  },

  async searchTaskers(filters?: { category?: string; verified?: boolean; search?: string; interactedOnly?: boolean; currentUserId?: string }) {
    const conditions = [eq(users.role, 'tasker')];
    
    if (filters?.verified) {
      conditions.push(eq(users.verificationStatus, 'approved'));
    }
    
    if (filters?.search) {
      // Use ILIKE for case-insensitive search in PostgreSQL (searches name, bio, AND username)
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(users.name, searchPattern),
          ilike(users.bio, searchPattern),
          ilike(users.username, searchPattern)
        ) as any
      );
    }
    
    // Filter by interacted users only if requested
    let interactedUserIds: string[] = [];
    if (filters?.interactedOnly && filters?.currentUserId) {
      // Get users the current user has interacted with:
      // 1. Users they've messaged (from messages table)
      // 2. Users they've sent direct service requests to
      // 3. Users they've worked with on tasks (as client or tasker)
      
      // Get users the current user has interacted with:
      // 1. Users they've messaged (from messages table)
      // 2. Users they've sent direct service requests to
      // 3. Users they've worked with on tasks (as client or tasker)
      
      const [sentMessages, receivedMessages, directRequests, clientTasks, taskerTasks] = await Promise.all([
        // Messages sent by current user
        db.select({ userId: messages.receiverId })
          .from(messages)
          .where(eq(messages.senderId, filters.currentUserId)),
        
        // Messages received by current user
        db.select({ userId: messages.senderId })
          .from(messages)
          .where(eq(messages.receiverId, filters.currentUserId)),
        
        // Direct service requests: get taskers the client has requested from
        db.select({ userId: directServiceRequests.taskerId })
          .from(directServiceRequests)
          .where(eq(directServiceRequests.clientId, filters.currentUserId)),
        
        // Tasks where current user is client - get taskers
        db.select({ userId: tasks.taskerId })
          .from(tasks)
          .where(and(
            eq(tasks.clientId, filters.currentUserId),
            sql`${tasks.taskerId} IS NOT NULL`
          )),
        
        // Tasks where current user is tasker - get clients
        db.select({ userId: tasks.clientId })
          .from(tasks)
          .where(eq(tasks.taskerId, filters.currentUserId))
      ]);
      
      // Combine all interaction user IDs
      const allInteractedIds = new Set<string>();
      sentMessages.forEach((m: { userId: string | null }) => m.userId && allInteractedIds.add(m.userId));
      receivedMessages.forEach((m: { userId: string | null }) => m.userId && allInteractedIds.add(m.userId));
      directRequests.forEach((d: { userId: string | null }) => d.userId && allInteractedIds.add(d.userId));
      clientTasks.forEach((t: { userId: string | null }) => t.userId && allInteractedIds.add(t.userId));
      taskerTasks.forEach((t: { userId: string | null }) => t.userId && allInteractedIds.add(t.userId));
      
      interactedUserIds = Array.from(allInteractedIds);
      
      if (interactedUserIds.length === 0) {
        // No interactions found, return empty result
        return [];
      }
    }
    
    let query = db.select().from(users).where(and(...conditions));
    
    if (filters?.category) {
      const taskersWithRole = await db
        .select({ userId: userProfessionalRoles.userId })
        .from(userProfessionalRoles)
        .innerJoin(professionalRoles, eq(userProfessionalRoles.roleId, professionalRoles.id))
        .where(eq(professionalRoles.slug, filters.category));
      
      const userIds = taskersWithRole.map(t => t.userId);
      if (userIds.length > 0) {
        let finalUserIds = userIds;
        
        // Apply interacted filter if requested
        if (filters?.interactedOnly && interactedUserIds.length > 0) {
          finalUserIds = userIds.filter(id => interactedUserIds.includes(id));
          if (finalUserIds.length === 0) {
            return [];
          }
        }
        
        const result = await db.select().from(users)
          .where(and(...conditions, sql`${users.id} IN (${sql.join(finalUserIds.map(id => sql`${id}`), sql`, `)})`))
          .orderBy(desc(users.rating), desc(users.completedTasks));
        return result;
      }
      return [];
    }
    
    // Apply interacted filter if requested (without category)
    if (filters?.interactedOnly && interactedUserIds.length > 0) {
      conditions.push(sql`${users.id} IN (${sql.join(interactedUserIds.map(id => sql`${id}`), sql`, `)})` as any);
    }
    
    const result = await db.select().from(users).where(and(...conditions)).orderBy(desc(users.rating), desc(users.completedTasks));
    return result;
  },

  async getTaskersByCategory(category: string) {
    const taskersWithRole = await db
      .select({ userId: userProfessionalRoles.userId })
      .from(userProfessionalRoles)
      .innerJoin(professionalRoles, eq(userProfessionalRoles.roleId, professionalRoles.id))
      .where(eq(professionalRoles.slug, category));
    
    const userIds = taskersWithRole.map(t => t.userId);
    
    if (userIds.length === 0) {
      return db.select().from(users)
        .where(and(eq(users.role, 'tasker'), eq(users.verificationStatus, 'approved')))
        .orderBy(desc(users.rating));
    }
    
    return db.select().from(users)
      .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(users.rating));
  },
  
  // Tasks
  async getTask(id: string) {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  },
  
  async getTasks(filters?: { clientId?: string; taskerId?: string; status?: string; category?: string }) {
    try {
      const conditions = [];
      if (filters?.clientId) {
        conditions.push(eq(tasks.clientId, filters.clientId));
      }
      if (filters?.taskerId) {
        conditions.push(eq(tasks.taskerId, filters.taskerId));
      }
      if (filters?.status) {
        conditions.push(eq(tasks.status, filters.status as any));
      }
      if (filters?.category) {
        conditions.push(eq(tasks.category, filters.category));
      }
      
      let query = db.select().from(tasks);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const result = await query.orderBy(desc(tasks.createdAt));
      
      // Ensure result is always an array
      return Array.isArray(result) ? result : [];
    } catch (error: any) {
      console.error('[Storage] Error in getTasks:', error);
      console.error('[Storage] Filters:', filters);
      console.error('[Storage] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  async getTasksCreatedToday(userId: string): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.clientId, userId),
          sql`${tasks.createdAt} >= ${todayStart.toISOString()}`
        )
      );
    return Number(result[0]?.count || 0);
  },
  
  async createTask(data: InsertTask) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storage.ts:375',message:'createTask - START',data:{dataKeys:Object.keys(data),hasTitle:!!data.title,hasDescription:!!data.description,hasCategory:!!data.category,hasBudget:!!data.budget,hasLocation:!!data.location,hasDate:!!data.date,hasTime:!!data.time,hasClientId:!!data.clientId,budgetType:typeof data.budget,budgetValue:data.budget,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'}})}).catch(()=>{});
    // #endregion
    try {
      // Validate required fields
      if (!data.title || !data.description || !data.category || !data.budget || !data.location || !data.date || !data.time || !data.clientId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storage.ts:378',message:'createTask - Validation failed',data:{hasTitle:!!data.title,hasDescription:!!data.description,hasCategory:!!data.category,hasBudget:!!data.budget,hasLocation:!!data.location,hasDate:!!data.date,hasTime:!!data.time,hasClientId:!!data.clientId,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'}})}).catch(()=>{});
        // #endregion
        throw new Error('Missing required fields for task creation');
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storage.ts:382',message:'createTask - Before db.insert',data:{dataKeys:Object.keys(data),budgetValue:data.budget,budgetType:typeof data.budget,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'}})}).catch(()=>{});
      // #endregion
      const result = await db.insert(tasks).values(data).returning();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storage.ts:383',message:'createTask - After db.insert',data:{hasResult:!!result,resultLength:result?.length,resultId:result?.[0]?.id,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'}})}).catch(()=>{});
      // #endregion
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create task - no result returned');
      }
      
      return result[0];
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storage.ts:389',message:'createTask - ERROR',data:{errorMessage:error?.message,errorCode:error?.code,errorDetail:error?.detail,errorHint:error?.hint,errorConstraint:error?.constraint,errorTable:error?.table,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'}})}).catch(()=>{});
      // #endregion
      console.error('[Storage] Error in createTask:', error);
      console.error('[Storage] Task data:', data);
      console.error('[Storage] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      throw error; // Re-throw to be handled by route
    }
  },
  
  async updateTask(id: string, data: Partial<Task>) {
    // #region agent log
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    try { fs.appendFileSync(logPath, JSON.stringify({location:'storage.ts:360',message:'Update task - before',data:{taskId:id,updateData:data,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}})+'\n'); } catch {}
    // #endregion
    const result = await db.update(tasks).set(data as any).where(eq(tasks.id, id)).returning();
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'storage.ts:365',message:'Update task - after',data:{taskId:id,updatedTaskId:result[0]?.id,updatedTaskStatus:result[0]?.status,updatedTaskTaskerId:result[0]?.taskerId,updatedTaskClientId:result[0]?.clientId,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}})+'\n'); } catch {}
    // #endregion
    return result[0];
  },

  async deleteTask(id: string) {
    await db.update(tasks).set({ status: 'cancelled' }).where(eq(tasks.id, id));
  },
  
  // Bids
  async getBid(id: string) {
    const result = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
    return result[0];
  },
  
  async getBidsForTask(taskId: string) {
    const result = await db.select().from(bids).where(eq(bids.taskId, taskId)).orderBy(desc(bids.createdAt));
    return result;
  },
  
  async getAcceptedBidForTask(taskId: string) {
    const result = await db.select().from(bids).where(
      and(eq(bids.taskId, taskId), eq(bids.status, "accepted"))
    ).limit(1);
    return result[0];
  },
  
  async createBid(data: InsertBid) {
    const result = await db.insert(bids).values(data).returning();
    return result[0];
  },
  
  async updateBid(id: string, data: Partial<Bid>) {
    const result = await db.update(bids).set(data as any).where(eq(bids.id, id)).returning();
    return result[0];
  },
  
  // Messages
  async getMessage(id: string) {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  },
  
  async getMessagesForTask(taskId: string) {
    // Get all messages for the task
    const messagesList = await db
      .select()
      .from(messages)
      .where(eq(messages.taskId, taskId))
      .orderBy(asc(messages.createdAt));
    
    if (messagesList.length === 0) {
      return [];
    }
    
    // Get all unique user IDs (senders and receivers)
    const userIds = new Set<string>();
    messagesList.forEach(msg => {
      if (msg.senderId) userIds.add(msg.senderId);
      if (msg.receiverId) userIds.add(msg.receiverId);
    });
    
    // Fetch all users in one query
    const userIdsArray = Array.from(userIds);
    const usersList = userIdsArray.length > 0 
      ? await db.select().from(users).where(inArray(users.id, userIdsArray))
      : [];
    
    // Create a map for quick user lookup
    const usersMap = new Map<string, User>();
    usersList.forEach(user => usersMap.set(user.id, user));
    
    // Combine messages with user data
    return messagesList.map(msg => ({
      ...msg,
      sender: usersMap.get(msg.senderId),
      receiver: usersMap.get(msg.receiverId),
    }));
  },
  
  async createMessage(data: InsertMessage) {
    const result = await db.insert(messages).values(data).returning();
    return result[0];
  },
  
  async markMessageAsRead(id: string) {
    const result = await db.update(messages).set({ read: true }).where(eq(messages.id, id)).returning();
    return result[0];
  },
  
  // Transactions
  async getTransaction(id: string) {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  },
  
  async getTransactionsForUser(userId: string) {
    const result = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
    return result;
  },
  
  async createTransaction(data: InsertTransaction) {
    const result = await db.insert(transactions).values(data).returning();
    return result[0];
  },
  
  // Notifications
  async getNotification(id: string) {
    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return result[0];
  },
  
  async getNotificationsForUser(userId: string) {
    const result = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    return result;
  },
  
  async createNotification(data: InsertNotification) {
    const result = await db.insert(notifications).values(data).returning();
    return result[0];
  },
  
  async markNotificationAsRead(id: string) {
    const result = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return result[0];
  },
  
  // Saved Tasks
  async getSavedTasksForUser(userId: string) {
    const result = await db.select().from(savedTasks).where(eq(savedTasks.userId, userId)).orderBy(desc(savedTasks.createdAt));
    return result;
  },
  
  async saveTask(userId: string, taskId: string) {
    const result = await db.insert(savedTasks).values({ userId, taskId }).returning();
    return result[0];
  },
  
  async unsaveTask(userId: string, taskId: string) {
    await db.delete(savedTasks).where(and(eq(savedTasks.userId, userId), eq(savedTasks.taskId, taskId)));
  },
  
  // Professional Roles
  async getProfessionalRoles() {
    return db.select().from(professionalRoles).orderBy(professionalRoles.category, professionalRoles.nameEn);
  },
  
  async getProfessionalRole(id: string) {
    const result = await db.select().from(professionalRoles).where(eq(professionalRoles.id, id)).limit(1);
    return result[0];
  },
  
  async getProfessionalRoleBySlug(slug: string) {
    const result = await db.select().from(professionalRoles).where(eq(professionalRoles.slug, slug)).limit(1);
    return result[0];
  },
  
  // User Professional Roles
  async getUserProfessionalRoles(userId: string) {
    const result = await db
      .select()
      .from(userProfessionalRoles)
      .innerJoin(professionalRoles, eq(userProfessionalRoles.roleId, professionalRoles.id))
      .where(eq(userProfessionalRoles.userId, userId))
      .orderBy(professionalRoles.category);
    
    return result.map(r => ({
      ...r.user_professional_roles,
      role: r.professional_roles,
    }));
  },
  
  async assignProfessionalRole(data: InsertUserProfessionalRole) {
    const result = await db.insert(userProfessionalRoles).values(data).returning();
    return result[0];
  },
  
  async removeProfessionalRole(userId: string, roleId: string) {
    await db.delete(userProfessionalRoles).where(
      and(eq(userProfessionalRoles.userId, userId), eq(userProfessionalRoles.roleId, roleId))
    );
  },
  
  // Tasker Availability
  async getTaskerAvailability(userId: string, startDate?: string, endDate?: string) {
    const conditions = [eq(taskerAvailability.userId, userId)];
    
    if (startDate) {
      conditions.push(sql`${taskerAvailability.date} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${taskerAvailability.date} <= ${endDate}`);
    }
    
    return db.select().from(taskerAvailability).where(and(...conditions)).orderBy(taskerAvailability.date);
  },
  
  async getTaskerAvailabilityById(id: string) {
    const result = await db.select().from(taskerAvailability).where(eq(taskerAvailability.id, id)).limit(1);
    return result[0];
  },
  
  async setTaskerAvailability(data: InsertTaskerAvailability) {
    const existing = await db
      .select()
      .from(taskerAvailability)
      .where(and(eq(taskerAvailability.userId, data.userId), eq(taskerAvailability.date, data.date)))
      .limit(1);
    
    if (existing[0]) {
      const result = await db
        .update(taskerAvailability)
        .set({ status: data.status, note: data.note })
        .where(eq(taskerAvailability.id, existing[0].id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(taskerAvailability).values(data).returning();
    return result[0];
  },
  
  async updateTaskerAvailability(id: string, data: Partial<InsertTaskerAvailability>) {
    const result = await db.update(taskerAvailability).set(data).where(eq(taskerAvailability.id, id)).returning();
    return result[0];
  },
  
  async deleteTaskerAvailability(id: string) {
    await db.delete(taskerAvailability).where(eq(taskerAvailability.id, id));
  },
  
  // User Photos (Portfolio)
  async getUserPhotos(userId: string) {
    return db.select().from(userPhotos).where(eq(userPhotos.userId, userId)).orderBy(asc(userPhotos.displayOrder));
  },
  
  async getUserPhotoById(id: string) {
    const result = await db.select().from(userPhotos).where(eq(userPhotos.id, id)).limit(1);
    return result[0];
  },
  
  async addUserPhoto(data: InsertUserPhoto) {
    const existingPhotos = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${userPhotos.displayOrder}), -1)` })
      .from(userPhotos)
      .where(eq(userPhotos.userId, data.userId));
    
    const nextOrder = (existingPhotos[0]?.maxOrder ?? -1) + 1;
    
    const result = await db.insert(userPhotos).values({ ...data, displayOrder: nextOrder }).returning();
    return result[0];
  },
  
  async updateUserPhoto(id: string, data: Partial<InsertUserPhoto>) {
    const result = await db.update(userPhotos).set(data).where(eq(userPhotos.id, id)).returning();
    return result[0];
  },
  
  async deleteUserPhoto(id: string) {
    await db.delete(userPhotos).where(eq(userPhotos.id, id));
  },
  
  async reorderUserPhotos(userId: string, photoIds: string[]) {
    for (let i = 0; i < photoIds.length; i++) {
      await db
        .update(userPhotos)
        .set({ displayOrder: i })
        .where(and(eq(userPhotos.id, photoIds[i]), eq(userPhotos.userId, userId)));
    }
  },
  
  // Direct Service Requests
  async getDirectServiceRequest(id: string) {
    const result = await db.select().from(directServiceRequests).where(eq(directServiceRequests.id, id)).limit(1);
    return result[0];
  },
  
  async getDirectServiceRequestsForClient(clientId: string) {
    return db
      .select()
      .from(directServiceRequests)
      .where(eq(directServiceRequests.clientId, clientId))
      .orderBy(desc(directServiceRequests.createdAt));
  },
  
  async getDirectServiceRequestsForTasker(taskerId: string) {
    return db
      .select()
      .from(directServiceRequests)
      .where(eq(directServiceRequests.taskerId, taskerId))
      .orderBy(desc(directServiceRequests.createdAt));
  },
  
  async createDirectServiceRequest(data: InsertDirectServiceRequest) {
    const result = await db.insert(directServiceRequests).values(data).returning();
    return result[0];
  },
  
  async updateDirectServiceRequest(id: string, data: Partial<DirectServiceRequest>) {
    const result = await db.update(directServiceRequests).set(data).where(eq(directServiceRequests.id, id)).returning();
    return result[0];
  },
  
  // OTP Codes
  async createOtpCode(data: InsertOtpCode) {
    // Delete any existing OTP codes for this email and type
    await db.delete(otpCodes).where(
      and(eq(otpCodes.email, data.email), sql`${otpCodes.type} = ${data.type}`)
    );
    const result = await db.insert(otpCodes).values(data).returning();
    return result[0];
  },
  
  async getValidOtpCode(email: string, code: string, type: string) {
    const now = new Date();
    const result = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        sql`${otpCodes.type} = ${type}`,
        eq(otpCodes.verified, false),
        gt(otpCodes.expiresAt, now),
        lt(otpCodes.attempts, 5) // Max 5 attempts
      )
    ).limit(1);
    return result[0];
  },
  
  async getPendingOtpByEmail(email: string, type: string) {
    const now = new Date();
    const result = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.email, email),
        sql`${otpCodes.type} = ${type}`,
        eq(otpCodes.verified, false),
        gt(otpCodes.expiresAt, now),
        lt(otpCodes.attempts, 5)
      )
    ).limit(1);
    return result[0];
  },
  
  async markOtpAsVerified(id: string) {
    const result = await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, id)).returning();
    return result[0];
  },
  
  async incrementOtpAttempts(id: string) {
    const result = await db.update(otpCodes).set({ 
      attempts: sql`${otpCodes.attempts} + 1` 
    }).where(eq(otpCodes.id, id)).returning();
    return result[0];
  },
  
  async deleteExpiredOtpCodes() {
    const now = new Date();
    await db.delete(otpCodes).where(lt(otpCodes.expiresAt, now));
  },
  
  // Admin operations
  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },
  
  async getPendingVerifications() {
    return db.select().from(users).where(
      and(
        eq(users.role, 'tasker'),
        eq(users.taskerType, 'specialized'),
        eq(users.verificationStatus, 'pending')
      )
    ).orderBy(desc(users.createdAt));
  },
  
  // Reviews
  async createReview(data: InsertReview) {
    const result = await db.insert(reviews).values(data).returning();
    return result[0];
  },
  
  async getReviewsForUser(userId: string) {
    return db.select().from(reviews)
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
  },
  
  async getReviewForTask(taskId: string) {
    const result = await db.select().from(reviews)
      .where(eq(reviews.taskId, taskId))
      .limit(1);
    return result[0];
  },
  
  async calculateUserRating(userId: string) {
    const result = await db.select({
      avgRating: sql<string>`COALESCE(AVG(${reviews.rating})::numeric(3,2), 0)`,
      totalCount: sql<number>`COUNT(*)::int`
    })
      .from(reviews)
      .where(eq(reviews.revieweeId, userId));
    
    return {
      rating: result[0]?.avgRating || "0.00",
      count: result[0]?.totalCount || 0
    };
  },
  
  // Push Subscriptions
  async savePushSubscription(data: InsertPushSubscription) {
    // Upsert: delete existing subscription for this user and create new one
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, data.userId));
    const result = await db.insert(pushSubscriptions).values(data).returning();
    return result[0];
  },
  
  async deletePushSubscription(userId: string) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  },
  
  async getPushSubscription(userId: string) {
    const result = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .limit(1);
    return result[0];
  },
  
  // Payments (Paylink)
  async createPayment(data: InsertPayment) {
    const result = await db.insert(payments).values(data).returning();
    return result[0];
  },
  
  async getPayment(id: string) {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  },
  
  async getPaymentByPaylinkInvoiceId(invoiceId: string) {
    const result = await db.select().from(payments)
      .where(eq(payments.paylinkInvoiceId, invoiceId))
      .limit(1);
    return result[0];
  },
  
  async getPaymentsForUser(userId: string) {
    const result = await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
    return result;
  },
  
  async updatePayment(id: string, data: Partial<Payment>) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    const result = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  },
};
