import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  country: varchar('country', { length: 100 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  terms: boolean('terms').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NEW: Comments Table
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  isPublic: boolean('is_public').notNull().default(true),
  adminReply: text('admin_reply'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Foreign key reference to users
  rating: integer('rating'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NEW: Drizzle Relational Mappings (enables db.query.comments.findMany({ with: { user: true } }))
export const usersRelations = relations(users, ({ many }) => ({
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));