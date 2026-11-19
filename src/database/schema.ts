import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  serial,
  unique,
  pgView,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

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

//test comment table for visibility check
export const publicComments = pgView('public_comments', {
  id: uuid('id').notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  isPublic: boolean('is_public').notNull(),
  adminReply: text('admin_reply'),
  userId: uuid('user_id').notNull(),
  rating: integer('rating'),
  createdAt: timestamp('created_at').notNull(),
}).as(sql`SELECT * FROM comments WHERE is_public = true`);

//package reviews table
export const packageReviews = pgTable('package_reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  packageId: text('package_id').notNull(),
  packageName: text('package_name').notNull(),
  type: text('type').notNull().default('PACKAGE'),

  userSnapshot: jsonb('user_snapshot')
    .$type<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      country: string;
      avatarUrl: string | null;
      isVip: boolean;
      isVerified: boolean;
      hasAccess: boolean;
    }>()
    .notNull(),

  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  rating: integer('rating').notNull(),
  experience: text('experience').notNull(),
  imageUrls: jsonb('image_urls').default([]),
  adminReply: text('admin_reply'),
  adminReplyAt: timestamp('admin_reply_at', { mode: 'string' }),
  isPublic: boolean('is_public').notNull().default(true),
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
  meals?: Record<string, string[] | string>;
  accommodation?: Record<string, string[] | string>;
}

// ── Industry-Standard Group Pricing & Options Types ──
export interface GroupPricingTier {
  minPax: number;
  maxPax: number;
  pricePerPerson: number;
  label?: string;
}

export interface PassengerCategoryPricing {
  couplePricingType?: 'auto_tier' | 'fixed';
  coupleFixedPrice?: number;
  childRateType: 'percentage' | 'fixed';
  childRateValue: number;
  infantPrice: number;
}

export interface PackageOptionItem {
  id: string;
  name: Record<string, string>;
  price: number;
  calculationType: 'per_person' | 'per_room' | 'per_booking';
  description?: Record<string, string>;
}

export interface PricingConfig {
  tiers: GroupPricingTier[];
  passengerPricing: PassengerCategoryPricing;
  options: PackageOptionItem[];
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
  titleEmphasis: jsonb('title_emphasis')
    .$type<Record<string, string>>()
    .notNull(),
  leadTitle: jsonb('lead_title').$type<Record<string, string>>().notNull(),
  leadDescription: jsonb('lead_description')
    .$type<Record<string, string>>()
    .notNull(),
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
  activityDetails: jsonb('activity_details')
    .$type<ActivityDetail[]>()
    .notNull(),

  // Multilingual Itinerary
  itinerary: jsonb('itinerary').$type<ItineraryItem[]>().notNull(),

  // Unified Dynamic Group Pricing & Custom Add-ons Configuration
  pricingConfig: jsonb('pricing_config').$type<PricingConfig>(),

  isLive: boolean('is_live').default(true).notNull(),

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
  isLive: boolean('is_live').default(true).notNull(),
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
  bestTimeToVisit: jsonb('best_time_to_visit')
    .$type<Record<string, string>>()
    .notNull(),
  climate: jsonb('climate').$type<Record<string, string>>().notNull(),
  primaryLanguage: jsonb('primary_language')
    .$type<Record<string, string>>()
    .notNull(),
  localCurrency: jsonb('local_currency')
    .$type<Record<string, string>>()
    .notNull(),

  // Shared metadata across all languages
  images: text('images').array().notNull(),
  coordinates: jsonb('coordinates')
    .$type<{ lat: number; lng: number }>()
    .notNull(),
  isLive: boolean('is_live').default(true).notNull(),
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
  preferences: jsonb('preferences')
    .$type<{
      strictlyNecessary: boolean;
      performance: boolean;
      functional: boolean;
      targetingAndMarketing: boolean;
    }>()
    .notNull(),
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
  language: text('language').default('English').notNull(),
  journeyDate: text('journey_date').notNull(),
  pickupTime: text('pickup_time').notNull(),
  // Travelers breakdown stored as JSONB for clean querying and flexibility
  travelers: jsonb('travelers')
    .$type<{
      adults: number;
      couples: number;
      children: number;
      infants: number;
    }>()
    .notNull(),
  // Custom & Chauffeur specific fields
  tourDuration: text('tour_duration'),
  description: text('description'),
  // Pricing information
  startingPrice: text('starting_price'),
  selectedPrice: text('selected_price'),
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
export const serviceNotes = pgTable('service_notes', {
  id: serial('id').primaryKey(),
  serviceType: varchar('service_type').notNull(),
  vehicleType: varchar('vehicle_type').notNull(),
  startingPrice: varchar('starting_price').notNull(),
  vehicleCapacity: varchar('vehicle_capacity').notNull(),
  luggages: varchar('luggages').notNull(),

  // Tier pricing columns (mandatory for chauffeur/custom, optional/null for transfer)
  withDriverPrice: varchar('with_driver_price'),
  withGuidePrice: varchar('with_guide_price'),
  withDriverAndGuidePrice: varchar('with_driver_and_guide_price'),

  // Dynamic multilingual notes
  notes: jsonb('notes').notNull().default({}),

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
  category: jsonb('category').$type<Record<string, string>>().notNull(),
  question: jsonb('question').$type<Record<string, string>>().notNull(),
  answer: jsonb('answer').$type<Record<string, string>>().notNull(),
  isLive: boolean('is_live').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface AvailabilityDateDetail {
  tourType?: string;
  tourTypes?: string[];
  color?: string;
  colors?: string[];
  hex?: string;
  hexes?: string[];
  note?: string;
  notes?: Record<string, string>;
}

export interface AvailabilityDateDetailItem extends AvailabilityDateDetail {
  date: string;
}

//availability table
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  apiClosedDates: text('api_closed_dates').array().notNull().default([]),
  dateDetails: jsonb('date_details')
    .$type<Record<string, AvailabilityDateDetail>>()
    .notNull()
    .default({}),
  closedDateDetails: jsonb('closed_date_details')
    .$type<AvailabilityDateDetailItem[]>()
    .notNull()
    .default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//service pricing table (charter, custom, transfer)
export const servicePricing = pgTable('service_pricing', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceType: varchar('service_type', { length: 50 }).notNull().unique(), // 'charter' | 'custom' | 'transfer'
  titleBase: jsonb('title_base').$type<Record<string, string>>().notNull(),
  titleAccent: jsonb('title_accent').$type<Record<string, string>>().notNull(),
  subtitleStrong: jsonb('subtitle_strong')
    .$type<Record<string, string>>()
    .notNull(),
  subtitle: jsonb('subtitle').$type<Record<string, string>>().notNull(),
  popularBadge: jsonb('popular_badge')
    .$type<Record<string, string>>()
    .notNull(),
  popularTitle: jsonb('popular_title')
    .$type<Record<string, string>>()
    .notNull(),
  popularDesc: jsonb('popular_desc').$type<Record<string, string>>().notNull(),
  notes: jsonb('notes').$type<Record<string, string[]>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Legal Documents Types & Table ──────────────────────────
export interface LegalSubItem {
  id: string;
  title?: Record<string, string>;
  body?: Record<string, string>;
  icon?: string;
}

export interface LegalSectionItem {
  id: string;
  heading: Record<string, string>;
  sectionIcon?: string;
  type: string;
  content?: Record<string, string>;
  subItems?: LegalSubItem[];
  expanded?: boolean;
}

// legal documents table (terms, privacy, cookie policy, etc.)
export const legalDocs = pgTable('legal_docs', {
  id: text('id').primaryKey(), // e.g. 'terms', 'privacy', 'cookie-policy'
  title: jsonb('title').$type<Record<string, string>>().notNull(),
  eyebrow: jsonb('eyebrow').$type<Record<string, string>>(),
  accent: text('accent').default('emerald'),
  lastUpdated: text('last_updated').notNull(),
  sections: jsonb('sections').$type<LegalSectionItem[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Package Booking Types ──
export interface BookingTravelers {
  adults: number;
  couples: number;
  children: number;
  infants: number;
}

export interface BookingSelectedOption {
  id: string;
  name?: string | Record<string, string>;
  nameLocalized?: Record<string, string>;
  price?: number;
  unitPrice?: number;
  calculationType?: 'per_person' | 'per_room' | 'per_booking' | string;
  count?: number;
  quantity?: number;
  total?: number;
  subtotal?: number;
  selected?: boolean;
  [key: string]: any;
}

export interface BookingPricingSummary {
  baseCurrency?: string;
  displayCurrency?: string;
  appliedTier?: {
    label?: string;
    minPax?: number;
    maxPax?: number;
    pricePerPerson?: number;
  } | null;
  unitPrice?: number;
  baseTotal?: number;
  optionsTotal?: number;
  grandTotal?: number;
  breakdown?: any;
  [key: string]: any;
}

// package booking table (for admin panel, client checkout, and payment gateway readiness)
export const packageBookings = pgTable('package_bookings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bookingReference: text('booking_reference').$defaultFn(
    () =>
      'IK-' +
      Date.now().toString().slice(-4) +
      Math.random().toString(36).substring(2, 6).toUpperCase(),
  ),

  // Package details
  packageId: text('package_id').notNull(),
  packageSlug: text('package_slug'),
  packageName: text('package_name').notNull(),
  packageType: text('package_type'),
  type: text('type').notNull(), // "oneday" | "multiday"

  // Schedule & Travelers
  journeyDate: text('journey_date').notNull(),
  travelers: jsonb('travelers').$type<BookingTravelers>().notNull(),
  totalPax: integer('total_pax').default(1),

  // Options & Pricing Breakdown
  selectedOptions: jsonb('selected_options')
    .$type<BookingSelectedOption[]>()
    .default([]),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).default('0'),
  optionsTotal: numeric('options_total', { precision: 12, scale: 2 }).default(
    '0',
  ),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default(
    '0',
  ),
  currency: text('currency').default('USD'),
  locale: text('locale').default('en'),
  pricingSummary: jsonb('pricing_summary')
    .$type<BookingPricingSummary>()
    .default({}),

  // Server-side audit & anti-tampering verification
  verifiedAmount: numeric('verified_amount', { precision: 12, scale: 2 }),
  isPriceTampered: boolean('is_price_tampered').default(false),

  // Customer contact details
  userId: text('user_id'),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  email: text('email').notNull(),
  country: text('country').notNull(),

  // Lifecycle & Payment Gateway Readiness
  status: text('status').notNull().default('pending'), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: text('payment_method'), // 'pay_on_arrival' | 'stripe' | 'card' etc.
  paymentTransactionId: text('payment_transaction_id'),

  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

//forget password table
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
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

// ── Enterprise Admin Security Engine Tables ──────────────────────────
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('ADMIN').notNull(), // 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS_MANAGER'
  avatarUrl: text('avatar_url'),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').default(false).notNull(),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => adminUsers.id, {
    onDelete: 'set null',
  }),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  auditLogs: many(adminAuditLogs),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminSessions.adminId],
    references: [adminUsers.id],
  }),
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminAuditLogs.adminId],
    references: [adminUsers.id],
  }),
}));
