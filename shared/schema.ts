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
export const professionalCategoryEnum = pgEnum("professional_category", [
  "beauty_fashion", 
  "teaching_education", 
  "art", 
  "construction", 
  "special"
]);
export const availabilityStatusEnum = pgEnum("availability_status", ["available", "busy"]);
export const taskerTypeEnum = pgEnum("tasker_type", ["general", "specialized"]);
export const taskerVerificationStatusEnum = pgEnum("tasker_verification_status", ["pending", "approved", "rejected"]);

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
  taskerType: taskerTypeEnum("tasker_type"),
  verificationStatus: taskerVerificationStatusEnum("verification_status"),
  certificateUrl: text("certificate_url"),
  specializationCategory: text("specialization_category"),
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

// Professional roles lookup table
export const professionalRoles = pgTable("professional_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: professionalCategoryEnum("category").notNull(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  colorHex: text("color_hex").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User professional roles (join table - verified professionals)
export const userProfessionalRoles = pgTable("user_professional_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  roleId: varchar("role_id").notNull().references(() => professionalRoles.id),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasker availability calendar
export const taskerAvailability = pgTable("tasker_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  status: availabilityStatusEnum("status").notNull().default("busy"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User portfolio photos
export const userPhotos = pgTable("user_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").notNull().default(0),
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
  professionalRoles: many(userProfessionalRoles),
  availability: many(taskerAvailability),
  photos: many(userPhotos),
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

export const professionalRolesRelations = relations(professionalRoles, ({ many }) => ({
  users: many(userProfessionalRoles),
}));

export const userProfessionalRolesRelations = relations(userProfessionalRoles, ({ one }) => ({
  user: one(users, {
    fields: [userProfessionalRoles.userId],
    references: [users.id],
  }),
  role: one(professionalRoles, {
    fields: [userProfessionalRoles.roleId],
    references: [professionalRoles.id],
  }),
  verifier: one(users, {
    fields: [userProfessionalRoles.verifiedBy],
    references: [users.id],
  }),
}));

export const taskerAvailabilityRelations = relations(taskerAvailability, ({ one }) => ({
  user: one(users, {
    fields: [taskerAvailability.userId],
    references: [users.id],
  }),
}));

export const userPhotosRelations = relations(userPhotos, ({ one }) => ({
  user: one(users, {
    fields: [userPhotos.userId],
    references: [users.id],
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

export const insertProfessionalRoleSchema = createInsertSchema(professionalRoles).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfessionalRoleSchema = createInsertSchema(userProfessionalRoles).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertTaskerAvailabilitySchema = createInsertSchema(taskerAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertUserPhotoSchema = createInsertSchema(userPhotos).omit({
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

export type InsertProfessionalRole = z.infer<typeof insertProfessionalRoleSchema>;
export type ProfessionalRole = typeof professionalRoles.$inferSelect;

export type InsertUserProfessionalRole = z.infer<typeof insertUserProfessionalRoleSchema>;
export type UserProfessionalRole = typeof userProfessionalRoles.$inferSelect;

export type InsertTaskerAvailability = z.infer<typeof insertTaskerAvailabilitySchema>;
export type TaskerAvailability = typeof taskerAvailability.$inferSelect;

export type InsertUserPhoto = z.infer<typeof insertUserPhotoSchema>;
export type UserPhoto = typeof userPhotos.$inferSelect;

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

// Task categories with subcategories for task posting
export const TASK_CATEGORIES_WITH_SUBS = {
  beauty_fashion: {
    id: "beauty_fashion",
    nameEn: "Beauty & Fashion",
    nameAr: "الجمال والموضة",
    colorHex: "#EC4899",
    icon: "sparkles",
    subcategories: [
      { id: "model", nameEn: "Model", nameAr: "مودل" },
      { id: "makeup_artist", nameEn: "Makeup Artist", nameAr: "ميكب ارتست" },
      { id: "hair_stylist", nameEn: "Hair Stylist", nameAr: "مصففة الشعر" },
      { id: "clothing_designer", nameEn: "Clothing Designer", nameAr: "تصميم الملابس" },
    ],
  },
  teaching_education: {
    id: "teaching_education",
    nameEn: "Teaching & Education",
    nameAr: "التدريس والتعليم",
    colorHex: "#22C55E",
    icon: "graduation-cap",
    subcategories: [
      { id: "private_tutor", nameEn: "Private Tutor", nameAr: "مدرس خصوصي" },
      { id: "translator", nameEn: "Language Translator", nameAr: "ترجمة لغات" },
      { id: "sign_language", nameEn: "Sign Language", nameAr: "لغة الإشارة" },
    ],
  },
  art: {
    id: "art",
    nameEn: "Art",
    nameAr: "الفن",
    colorHex: "#3B82F6",
    icon: "palette",
    subcategories: [
      { id: "drawing", nameEn: "Drawing", nameAr: "الرسم" },
      { id: "painting", nameEn: "Painting", nameAr: "الطلاء" },
      { id: "photography", nameEn: "Photography", nameAr: "التصوير" },
      { id: "digital_art", nameEn: "Digital Art", nameAr: "الفن الرقمي" },
    ],
  },
  construction: {
    id: "construction",
    nameEn: "Construction",
    nameAr: "عمال المقاولات",
    colorHex: "#EF4444",
    icon: "hard-hat",
    subcategories: [
      { id: "carpenter", nameEn: "Carpenter", nameAr: "النجار" },
      { id: "blacksmith", nameEn: "Blacksmith", nameAr: "الحداد" },
      { id: "electrician", nameEn: "Electrician", nameAr: "الكهربائي" },
      { id: "plumber", nameEn: "Plumber", nameAr: "السباك" },
    ],
  },
  special: {
    id: "special",
    nameEn: "Special Services",
    nameAr: "فئة خاصة",
    colorHex: "#EAB308",
    icon: "star",
    subcategories: [
      { id: "package_delivery", nameEn: "Package Delivery", nameAr: "توصيل الطرود واستلامها" },
      { id: "furniture_moving", nameEn: "Furniture Moving", nameAr: "نقل العفش" },
      { id: "car_washing", nameEn: "Car Washing", nameAr: "غسيل السيارات" },
      { id: "home_barber", nameEn: "Home Barber", nameAr: "حلاق منزلي" },
    ],
  },
  other: {
    id: "other",
    nameEn: "Other",
    nameAr: "أخرى",
    colorHex: "#6B7280",
    icon: "more-horizontal",
    subcategories: [],
  },
} as const;

export type TaskCategoryId = keyof typeof TASK_CATEGORIES_WITH_SUBS;

// All valid task categories (subcategory IDs + "other")
export const TASK_CATEGORIES = [
  "model",
  "makeup_artist",
  "hair_stylist",
  "clothing_designer",
  "private_tutor",
  "translator",
  "sign_language",
  "drawing",
  "painting",
  "photography",
  "digital_art",
  "carpenter",
  "blacksmith",
  "electrician",
  "plumber",
  "package_delivery",
  "furniture_moving",
  "car_washing",
  "home_barber",
  "other",
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];

export const getCategoryInfo = (categoryId: string): { mainCategory: TaskCategoryId; subcategory?: typeof TASK_CATEGORIES_WITH_SUBS[TaskCategoryId]['subcategories'][number] } | null => {
  if (categoryId === 'other') {
    return { mainCategory: 'other' };
  }
  
  for (const [mainId, cat] of Object.entries(TASK_CATEGORIES_WITH_SUBS)) {
    const sub = cat.subcategories.find(s => s.id === categoryId);
    if (sub) {
      return { mainCategory: mainId as TaskCategoryId, subcategory: sub };
    }
  }
  
  return null;
};

// Professional categories with colors (for professional badges)
export const PROFESSIONAL_CATEGORIES = {
  beauty_fashion: {
    id: "beauty_fashion",
    nameEn: "Beauty & Fashion",
    nameAr: "الجمال والموضة",
    colorHex: "#EC4899",
    roles: [
      { slug: "model", nameEn: "Model", nameAr: "مودل" },
      { slug: "makeup_artist", nameEn: "Makeup Artist", nameAr: "ميكب ارتست" },
      { slug: "hair_stylist", nameEn: "Hair Stylist", nameAr: "مصففة الشعر" },
      { slug: "clothing_designer", nameEn: "Clothing Designer", nameAr: "تصميم الملابس" },
    ],
  },
  teaching_education: {
    id: "teaching_education",
    nameEn: "Teaching & Education",
    nameAr: "التدريس والتعليم",
    colorHex: "#22C55E",
    roles: [
      { slug: "private_tutor", nameEn: "Private Tutor", nameAr: "مدرس خصوصي" },
      { slug: "translator", nameEn: "Language Translator", nameAr: "ترجمة لغات" },
      { slug: "sign_language", nameEn: "Sign Language", nameAr: "لغة الإشارة" },
    ],
  },
  art: {
    id: "art",
    nameEn: "Art",
    nameAr: "الفن",
    colorHex: "#3B82F6",
    roles: [
      { slug: "drawing", nameEn: "Drawing", nameAr: "الرسم" },
      { slug: "painting", nameEn: "Painting", nameAr: "الطلاء" },
      { slug: "photography", nameEn: "Photography", nameAr: "التصوير" },
      { slug: "digital_art", nameEn: "Digital Art", nameAr: "الفن الرقمي" },
    ],
  },
  construction: {
    id: "construction",
    nameEn: "Construction",
    nameAr: "عمال المقاولات",
    colorHex: "#EF4444",
    roles: [
      { slug: "carpenter", nameEn: "Carpenter", nameAr: "النجار" },
      { slug: "blacksmith", nameEn: "Blacksmith", nameAr: "الحداد" },
      { slug: "electrician", nameEn: "Electrician", nameAr: "الكهربائي" },
      { slug: "plumber", nameEn: "Plumber", nameAr: "السباك" },
    ],
  },
  special: {
    id: "special",
    nameEn: "Special Services",
    nameAr: "فئة خاصة",
    colorHex: "#EAB308",
    roles: [
      { slug: "package_delivery", nameEn: "Package Delivery", nameAr: "توصيل الطرود واستلامها" },
      { slug: "furniture_moving", nameEn: "Furniture Moving", nameAr: "نقل العفش" },
      { slug: "car_washing", nameEn: "Car Washing", nameAr: "غسيل السيارات" },
      { slug: "home_barber", nameEn: "Home Barber", nameAr: "حلاق منزلي" },
    ],
  },
} as const;

export type ProfessionalCategoryId = keyof typeof PROFESSIONAL_CATEGORIES;

// Extended types for user with professional roles
export type UserWithProfessionalRoles = User & {
  professionalRoles?: (UserProfessionalRole & { role: ProfessionalRole })[];
  availability?: TaskerAvailability[];
  photos?: UserPhoto[];
};
