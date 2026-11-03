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
    country: string,
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

// 1. Clean type interfaces defined outside to keep the table clean and error-free
export interface PackageDestination {
  id: string;
  title: Record<string, string>;
  slug: string;
  summary: Record<string, string>;
  heroImage: string | null;
  coordinates: { lat: number; lng: number };
}

export interface ActivityDetail {
  title: Record<string, string>;
  description: Record<string, string>;
}

export interface ItineraryItem {
  day: number;
  title: Record<string, string>;
  travelTime: Record<string, string>;
  locations: Record<string, string[]>;
  route: Record<string, string[]>;
  details: Record<string, string[]>;
  scenicStops?: Record<string, string[]>;
  activities?: Record<string, string[]>;
  meals: Record<string, string>;
  accommodation: Record<string, string>;
}

export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),

  // Multilingual Metadata Fields
  type: text('type').notNull(),
  category: jsonb('category').$type<Record<string, string>>().notNull(),
  origin: jsonb('origin').$type<Record<string, string>>().notNull(),
  duration: jsonb('duration').$type<Record<string, string>>().notNull(),
  badge: text('badge'),

  // Multilingual JSONB Text Fields
  title: jsonb('title').$type<Record<string, string>>().notNull(),
  titleEmphasis: jsonb('title_emphasis').$type<Record<string, string>>().notNull(),
  leadTitle: jsonb('lead_title').$type<Record<string, string>>().notNull(),
  leadDescription: jsonb('lead_description').$type<Record<string, string>>().notNull(),
  description: jsonb('description').$type<Record<string, string>>().notNull(),

  // Multilingual JSONB Arrays
  highlights: jsonb('highlights').$type<Record<string, string[]>>().notNull(),
  includes: jsonb('includes').$type<Record<string, string[]>>().notNull(),
  excludes: jsonb('excludes').$type<Record<string, string[]>>().notNull(),

  // Shared Fields
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0'),
  provider: text('provider').notNull(),
  gallery: text('gallery').array().notNull(),
  likes: integer('likes').default(0).notNull(),

  // Multilingual JSONB Destinations Reference Data
  destinations: jsonb('destinations').$type<PackageDestination[]>().notNull(),

  // Multilingual Activity Details
  activityDetails: jsonb('activity_details').$type<ActivityDetail[]>().notNull(),

  // Multilingual Itinerary
  itinerary: jsonb('itinerary').$type<ItineraryItem[]>().notNull(),

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
  slug: text('slug').notNull().unique(),

  // Translatable fields stored as localized JSONB objects
  title: jsonb('title').$type<Record<string, string>>().notNull(),
  summary: jsonb('summary').$type<Record<string, string>>().notNull(),
  blog: jsonb('blog').$type<Record<string, string>>().notNull(),
  readTime: jsonb('read_time').$type<Record<string, string>>().notNull(),
  category: jsonb('category').$type<Record<string, string>>().notNull(),

  // Shared metadata across all languages
  author: text('author').notNull(),
  images: text('images').array().notNull(),
  likes: integer('likes').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});



//destination table
export const destinations = pgTable('destinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),

  // Translatable fields stored as localized JSONB objects
  title: jsonb('title').$type<Record<string, string>>().notNull(),
  summary: jsonb('summary').$type<Record<string, string>>().notNull(),
  description: jsonb('description').$type<Record<string, string>>().notNull(),
  province: jsonb('province').$type<Record<string, string>>().notNull(),
  highlights: jsonb('highlights').$type<Record<string, string[]>>().notNull(),
  bestTimeToVisit: jsonb('best_time_to_visit').$type<Record<string, string>>().notNull(),
  climate: jsonb('climate').$type<Record<string, string>>().notNull(),
  primaryLanguage: jsonb('primary_language').$type<Record<string, string>>().notNull(),
  localCurrency: jsonb('local_currency').$type<Record<string, string>>().notNull(),

  // Shared metadata across all languages
  images: text('images').array().notNull(),
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


//service notes
export const serviceNotes = pgTable("service_notes", {
  id: serial("id").primaryKey(),
  serviceType: varchar("service_type").notNull(),
  vehicleType: varchar("vehicle_type").notNull(),
  startingPrice: varchar("starting_price").notNull(),
  vehicleCapacity: varchar("vehicle_capacity").notNull(),
  luggages: varchar("luggages").notNull(),

  // New pricing columns
  withDriverPrice: varchar("with_driver_price").notNull(),
  withGuidePrice: varchar("with_guide_price").notNull(),
  withDriverAndGuidePrice: varchar("with_driver_and_guide_price").notNull(),

  // Dynamic multilingual notes
  notes: jsonb("notes").notNull().default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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