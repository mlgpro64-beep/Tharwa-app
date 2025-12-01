import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["client", "tasker"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "assigned", "in_progress", "completed", "cancelled"]);
export const bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending"]);
export const notificationTypeEnum = pgEnum("notification_type", ["offer", "system", "chat", "task_update"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatar: text("avatar"),
  role: userRoleEnum("role").notNull().default("client"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0.00"),
  completedTasks: integer("completed_tasks").notNull().default(0),
  bio: text("bio"),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: taskStatusEnum("status").notNull().default("open"),
  clientId: varchar("client_id").notNull().references(() => users.id),
  taskerId: varchar("tasker_id").references(() => users.id),
  images: text("images").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bids/Offers table
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  taskerId: varchar("tasker_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  status: bidStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  taskId: varchar("task_id").references(() => tasks.id),
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("completed"),
  icon: text("icon").notNull().default("account_balance_wallet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Messages table for chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull().default("primary"),
  read: boolean("read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Saved tasks (favorites)
export const savedTasks = pgTable("saved_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  postedTasks: many(tasks, { relationName: "clientTasks" }),
  assignedTasks: many(tasks, { relationName: "taskerTasks" }),
  bids: many(bids),
  transactions: many(transactions),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  notifications: many(notifications),
  savedTasks: many(savedTasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(users, {
    fields: [tasks.clientId],
    references: [users.id],
    relationName: "clientTasks",
  }),
  tasker: one(users, {
    fields: [tasks.taskerId],
    references: [users.id],
    relationName: "taskerTasks",
  }),
  bids: many(bids),
  messages: many(messages),
  transactions: many(transactions),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  task: one(tasks, {
    fields: [bids.taskId],
    references: [tasks.id],
  }),
  tasker: one(users, {
    fields: [bids.taskerId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [transactions.taskId],
    references: [tasks.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  task: one(tasks, {
    fields: [messages.taskId],
    references: [tasks.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const savedTasksRelations = relations(savedTasks, ({ one }) => ({
  user: one(users, {
    fields: [savedTasks.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [savedTasks.taskId],
    references: [tasks.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  balance: true,
  rating: true,
  completedTasks: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  status: true,
  taskerId: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertSavedTaskSchema = createInsertSchema(savedTasks).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertSavedTask = z.infer<typeof insertSavedTaskSchema>;
export type SavedTask = typeof savedTasks.$inferSelect;

// Extended types for frontend
export type TaskWithDetails = Task & {
  client?: User;
  tasker?: User;
  bids?: Bid[];
  distance?: string;
};

export type BidWithTasker = Bid & {
  tasker?: User;
};

export type MessageWithUsers = Message & {
  sender?: User;
  receiver?: User;
};

export type ConversationPreview = {
  taskId: string;
  taskTitle: string;
  otherUser?: User;
  lastMessage?: Message;
  unreadCount: number;
};

// Task categories
export const TASK_CATEGORIES = [
  "Cleaning",
  "Moving",
  "Delivery",
  "Handyman",
  "Assembly",
  "Gardening",
  "Painting",
  "Errands",
  "Pet Care",
  "Tech Help",
  "Other",
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];
