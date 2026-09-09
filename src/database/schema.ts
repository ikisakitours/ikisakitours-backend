import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  country: varchar('country', { length: 100 }).notNull(),
  passwordHash: text('password_hash').notNull(),

  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  isVip: boolean('is_vip').notNull().default(false),
  hasAccess: boolean('has_access').notNull().default(true),

  terms: boolean('terms').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  isPublic: boolean('is_public').notNull().default(true),
  adminReply: text('admin_reply'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating'),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  //new
  packageId: uuid('package_id').references(() => packages.id, {
    onDelete: 'cascade',
  }),
});

//new
export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(),
  titleEmphasis: text('title_emphasis').notNull(),
  title: text('title').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0'),
  provider: text('provider').notNull(),
  leadTitle: text('lead_title').notNull(),
  leadDescription: text('lead_description').notNull(),
  description: text('description').notNull(),

  gallery: text('gallery').array().notNull(),
  highlights: text('highlights').array().notNull(),
  includes: text('includes').array().notNull(),
  excludes: text('excludes').array().notNull(),

  activityDetails: jsonb('activity_details').$type<
    { title: string; description: string }[]
  >().notNull(),

  itinerary: jsonb('itinerary').$type<
    { day: number; title: string; description: string; images?: string[] }[]
  >().notNull(),

  destinations: jsonb('destinations').$type<
    { name: string; description?: string; images?: string[] }[]
  >().notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  comments: many(comments),
}));

//new
export const packagesRelations = relations(packages, ({ many }) => ({
  comments: many(comments),
}));


export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  // new
  package: one(packages, {
    fields: [comments.packageId],
    references: [packages.id],
  }),
}));