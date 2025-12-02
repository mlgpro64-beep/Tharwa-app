import { db } from "./db";
import { 
  users, tasks, bids, transactions, messages, notifications, savedTasks,
  professionalRoles, userProfessionalRoles, taskerAvailability, userPhotos,
  insertUserSchema, insertTaskSchema, insertBidSchema, insertTransactionSchema,
  insertMessageSchema, insertNotificationSchema
} from "@shared/schema";
import { eq, and, or, desc, like, sql, asc } from "drizzle-orm";
import type { 
  User, Task, Bid, Transaction, Message, Notification, SavedTask,
  ProfessionalRole, UserProfessionalRole, TaskerAvailability, UserPhoto,
  InsertUser, InsertTask, InsertBid, InsertTransaction, InsertMessage, InsertNotification,
  InsertProfessionalRole, InsertUserProfessionalRole, InsertTaskerAvailability, InsertUserPhoto
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser> & { balance?: string; completedTasks?: number; rating?: string }): Promise<User>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(filters?: { clientId?: string; status?: string; category?: string }): Promise<Task[]>;
  getTasksCreatedToday(userId: string): Promise<number>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task>;
  
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
  
  async updateUser(id: string, data: Partial<InsertUser> & { balance?: string; completedTasks?: number; rating?: string }) {
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
};
