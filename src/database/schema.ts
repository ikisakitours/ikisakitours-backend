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
  province: text('province').notNull(),
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

//cookie table
export const cookieConsents = pgTable('cookie_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<{
    strictlyNecessary: boolean;
    performance: boolean;
    functional: boolean;
    targetingAndMarketing: boolean;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//service table can be changed in the future
export const serviceRequests = pgTable('service_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Categorization: 'custom-made', 'private-chauffeur', or 'transfer'
  serviceCategory: text('service_category').notNull(), 
  // Specific to Transfers ('airport-pickup', 'hotel-and-city', 'airport-dropoff')
  transferServiceType: text('transfer_service_type'), 
  // Shared fields
  vehicleType: text('vehicle_type').notNull(), // 'sedans', 'vans', 'suvs'
  tourPackageType: text('tour_package_type'), // 'with-driver', 'with-guide' (Custom/Chauffeur)
  pickupLocation: text('pickup_location').notNull(),
  dropOffLocation: text('drop_off_location'), // Transfer only
  language: text('language').notNull(),
  journeyDate: text('journey_date').notNull(),
  pickupTime: text('pickup_time').notNull(),
  // Travelers breakdown stored as JSONB for clean querying and flexibility
  travelers: jsonb('travelers').$type<{
    adults: number;
    couples: number;
    children: number;
    infants: number;
  }>().notNull(),
  // Custom & Chauffeur specific fields
  tourDuration: text('tour_duration'), // '1day', '2day', etc.
  description: text('description'),
  // Contact Info (Shared across all)
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number').notNull(),
  specialRequests: text('special_requests'),
  // Admin status tracking
  status: text('status').default('pending').notNull(), // 'pending', 'confirmed', 'completed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//news letter
export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // Optional: nullable if non-logged-in users can also subscribe
  email: text('email').notNull().unique(),
  subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
  status: text('status').default('active').notNull(), // 'active', 'unsubscribed'
});

//contact table
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  inquiryType: text('inquiry_type').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('Pending Review').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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