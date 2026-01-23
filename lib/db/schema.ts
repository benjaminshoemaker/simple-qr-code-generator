import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Users
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  passwordHash: varchar("password_hash", { length: 255 }), // null if OAuth-only
  name: varchar("name", { length: 255 }),
  image: varchar("image", { length: 500 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  subscriptions: many(subscriptions),
  qrCodes: many(qrCodes),
  folders: many(folders),
  tags: many(tags),
  accounts: many(accounts),
  sessions: many(sessions),
}));

// ============================================================================
// Subscriptions
// ============================================================================

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", {
    length: 255,
  }).notNull(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 50 }).notNull(), // 'pro' | 'business'
  status: varchar("status", { length: 50 }).notNull(), // 'active' | 'canceled' | 'past_due'
  currentPeriodStart: timestamp("current_period_start", {
    mode: "date",
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// QR Codes
// ============================================================================

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
    destinationUrl: varchar("destination_url", { length: 2000 }).notNull(),
    name: varchar("name", { length: 255 }),
    folderId: uuid("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    scanCount: integer("scan_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("short_code_idx").on(table.shortCode),
    index("qr_user_id_idx").on(table.userId),
  ]
);

export const qrCodesRelations = relations(qrCodes, ({ one, many }) => ({
  user: one(users, {
    fields: [qrCodes.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [qrCodes.folderId],
    references: [folders.id],
  }),
  scanEvents: many(scanEvents),
  qrCodeTags: many(qrCodeTags),
}));

// ============================================================================
// Folders
// ============================================================================

export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  qrCodes: many(qrCodes),
}));

// ============================================================================
// Tags
// ============================================================================

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  qrCodeTags: many(qrCodeTags),
}));

// QR Code <-> Tag junction table
export const qrCodeTags = pgTable(
  "qr_code_tags",
  {
    qrCodeId: uuid("qr_code_id")
      .references(() => qrCodes.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.qrCodeId, table.tagId] })]
);

export const qrCodeTagsRelations = relations(qrCodeTags, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [qrCodeTags.qrCodeId],
    references: [qrCodes.id],
  }),
  tag: one(tags, {
    fields: [qrCodeTags.tagId],
    references: [tags.id],
  }),
}));

// ============================================================================
// Scan Events
// ============================================================================

export const scanEvents = pgTable(
  "scan_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    qrCodeId: uuid("qr_code_id")
      .references(() => qrCodes.id, { onDelete: "cascade" })
      .notNull(),
    scannedAt: timestamp("scanned_at", { mode: "date" }).defaultNow().notNull(),
    country: varchar("country", { length: 2 }), // ISO 3166-1 alpha-2
    ipHash: varchar("ip_hash", { length: 64 }), // SHA-256 for deduplication
  },
  (table) => [
    index("scan_qr_code_id_idx").on(table.qrCodeId),
    index("scan_scanned_at_idx").on(table.scannedAt),
  ]
);

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [scanEvents.qrCodeId],
    references: [qrCodes.id],
  }),
}));

// ============================================================================
// NextAuth.js Tables (required by @auth/drizzle-adapter)
// ============================================================================

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);
