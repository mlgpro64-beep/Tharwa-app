import { db } from "./db";
import { 
  users, tasks, bids, transactions, messages, notifications, savedTasks,
  insertUserSchema, insertTaskSchema, insertBidSchema, insertTransactionSchema,
  insertMessageSchema, insertNotificationSchema
} from "@shared/schema";
import { eq, and, or, desc, like } from "drizzle-orm";
import type { 
  User, Task, Bid, Transaction, Message, Notification, SavedTask,
  InsertUser, InsertTask, InsertBid, InsertTransaction, InsertMessage, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(filters?: { clientId?: string; status?: string; category?: string }): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task>;
  
  // Bids
  getBid(id: string): Promise<Bid | undefined>;
  getBidsForTask(taskId: string): Promise<Bid[]>;
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
  
  async createUser(data: InsertUser) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },
  
  async updateUser(id: string, data: Partial<InsertUser>) {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  },
  
  // Tasks
  async getTask(id: string) {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  },
  
  async getTasks(filters?: { clientId?: string; status?: string; category?: string }) {
    const conditions = [];
    if (filters?.clientId) {
      conditions.push(eq(tasks.clientId, filters.clientId));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as any));
    }
    if (filters?.category) {
      conditions.push(eq(tasks.category, filters.category));
    }
    
    if (conditions.length > 0) {
      return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
    }
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  },
  
  async createTask(data: InsertTask) {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  },
  
  async updateTask(id: string, data: Partial<Task>) {
    const result = await db.update(tasks).set(data as any).where(eq(tasks.id, id)).returning();
    return result[0];
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
    const result = await db.select().from(messages).where(eq(messages.taskId, taskId)).orderBy(desc(messages.createdAt));
    return result;
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
};
