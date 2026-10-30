import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, jsonb, uniqueIndex, serial, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  country: varchar('country', { length: 100 }).notNull(),
  // 1. Made nullable for social login users who do not have passwords
  passwordHash: text('password_hash'),

  // 2. New columns to track social sign-ups directly in the same table
  provider: varchar('provider', { length: 50 }),
  providerId: varchar('provider_id', { length: 255 }),

  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  isVip: boolean('is_vip').notNull().default(false),
  hasAccess: boolean('has_access').notNull().default(true),

  terms: boolean('terms').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

//comments
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



//package reviews table
export const packageReviews = pgTable('package_reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  packageId: text('package_id').notNull(),
  packageName: text('package_name').notNull(),
  type: text('type').notNull().default('PACKAGE'),

  userSnapshot: jsonb('user_snapshot').$type<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    isVip: boolean;
    isVerified: boolean;
    hasAccess: boolean;
  }>().notNull(),

  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  rating: integer('rating').notNull(),
  experience: text('experience').notNull(),
  imageUrls: jsonb('image_urls').default([]),
  adminReply: text('admin_reply'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});



//--------------------------------------------------------
//package table
export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  origin: text('origin').notNull(),
  duration: text('duration').notNull(),
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

  destinations: jsonb('destinations').$type<
    {
      id: string;
      title: string;
      slug: string;
      summary: string;
      heroImage: string | null;
      coordinates: { lat: number; lng: number };
    }[]
  >().notNull(),

  activityDetails: jsonb('activity_details').$type<
    { title: string; description: string }[]
  >().notNull(),

  itinerary: jsonb('itinerary').$type<
    {
      day: number;
      title: string;
      travelTime: string;
      locations: string[];
      route: string[];
      details: string[];
      scenicStops?: string[];
      activities?: string[];
      meals: string;
      accommodation: string;
    }[]
  >().notNull(),

  likes: integer('likes').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//----------------------------------------------------------
//package like table
export const packageLikes = pgTable(
  'package_likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // References the 'id' column from your users table
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    // References the 'id' column from your packages table
    packageId: uuid('package_id')
      .references(() => packages.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    // Enforces uniqueness: A single user can only like a specific package once
    userPackageUnique: unique().on(t.userId, t.packageId),
  }),
);


//-----------------------------------------------------------
//blog table
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
  serviceCategory: text('service_category').notNull(),
  transferServiceType: text('transfer_service_type'),
  // Shared fields
  vehicleType: text('vehicle_type').notNull(),
  tourPackageType: text('tour_package_type'),
  pickupLocation: text('pickup_location').notNull(),
  dropOffLocation: text('drop_off_location'),
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
  tourDuration: text('tour_duration'),
  description: text('description'),
  // Contact Info (Shared across all)
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number').notNull(),
  specialRequests: text('special_requests'),
  // Admin status tracking
  status: text('status').default('pending').notNull(),
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
  tourInterest: text('tour_interest'),
  status: text('status').default('Pending Review').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

//faq table
export const faqs = pgTable('faqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: text('category').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

//availability table
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  apiClosedDates: text('api_closed_dates').array().notNull().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//package booking table ( for adim panel )
export const packageBookings = pgTable('package_bookings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  packageId: text('package_id').notNull(),
  packageName: text('package_name').notNull(),
  journeyDate: text('journey_date').notNull(),
  travelers: jsonb('travelers').notNull(),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  email: text('email').notNull(),
  country: text('country').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
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