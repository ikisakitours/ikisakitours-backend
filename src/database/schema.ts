import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
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
  badge: text('badge'),
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

//blog part
export const blogs = pgTable('blogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary').notNull(),
  category: text('category').notNull(),
  readTime: text('read_time').notNull(),
  blog: text('blog').notNull(),
  author: text('author').notNull(),
  images: text('images').array().notNull(),
  likes: integer('likes').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//destination table
export const destinations = pgTable('destinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary').notNull(),
  description: text('description').notNull(),
  highlights: text('highlights').array().notNull(),
  images: text('images').array().notNull(),
  bestTimeToVisit: text('best_time_to_visit').notNull(),
  climate: text('climate').notNull(),
  primaryLanguage: text('primary_language').notNull(),
  localCurrency: text('local_currency').notNull(),
  coordinates: jsonb('coordinates').$type<{ lat: number; lng: number }>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// new changes ( like button )
export const blogLikes = pgTable(
  'blog_likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blogId: uuid('blog_id')
      .notNull()
      .references(() => blogs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // new changes ( like button )
      userBlogUniqueIdx: uniqueIndex('user_blog_unique_idx').on(
        table.blogId,
        table.userId,
      ),
    };
  },
);

export const usersRelations = relations(users, ({ many }) => ({
  comments: many(comments),
  // new changes ( like button )
  blogLikes: many(blogLikes),
}));

//new
export const packagesRelations = relations(packages, ({ many }) => ({
  comments: many(comments),
}));

//blog part
export const blogsRelations = relations(blogs, ({ many }) => ({
  // new changes ( like button )
  blogLikes: many(blogLikes),
}));

// new changes ( like button )
export const blogLikesRelations = relations(blogLikes, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogLikes.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [blogLikes.userId],
    references: [users.id],
  }),
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