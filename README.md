# Ikisaki Tours — Enterprise Backend API Engine

![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45+-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-S3_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database_Pooler-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Serverless_Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-Private-lightgrey?style=for-the-badge)

The central RESTful backend engine powering **Ikisaki Tours** public client web applications and the administrative control dashboard. Engineered with NestJS, TypeScript, Drizzle ORM, and PostgreSQL, this system provides high availability, native multilingual content negotiation, enterprise-grade dynamic group pricing algorithms, and high-performance asset distribution.

---

## Table of Contents

- [Architectural Highlights](#architectural-highlights)
- [Technology Ecosystem](#technology-ecosystem)
- [System Architecture & Data Flow](#system-architecture--data-flow)
- [Directory Structure](#directory-structure)
- [Database Schema & Models](#database-schema--models)
- [Core Functional Modules](#core-functional-modules)
- [API Reference](#api-reference)
- [Security & Authentication](#security--authentication)
- [Environment Configuration](#environment-configuration)
- [Installation & Local Setup](#installation--local-setup)
- [Database Operations](#database-operations)
- [Deployment & Production](#deployment--production)
- [Automated Scheduled Tasks](#automated-scheduled-tasks)

---

## Architectural Highlights

- **Dual-Persona Content Resolution**: Every multilingual endpoint dynamically resolves text (e.g. English `en`, Japanese `ja`) when queried by public visitors (`?lang=ja`), while returning complete raw multilingual dictionary structures (`Record<string, any>`) to the Admin Dashboard for editing without loss of fidelity.
- **Unified Dynamic Group Pricing**: High-flexibility group tier pricing engine calculating per-person discounts, couple rates, percentage/fixed child discounts, and optional custom add-on pricing across bookings.
- **Native JSONB Storage**: Leverages PostgreSQL JSONB storage through Drizzle ORM for flexible structures like multi-day itineraries, dynamic accommodation lists, activity details, and localized metadata.
- **Enterprise Storage Delivery**: Integrated with Cloudflare R2 via the AWS S3 SDK for low-latency batch and single asset uploads with zero egress fees.
- **Resilient Serverless Architecture**: Built and deployed to Vercel Serverless with custom keep-alive cron jobs to prevent database connection pooler timeouts and Supabase auto-pausing.
- **Strict Validation & Deserialization**: Global `ValidationPipe` with custom transformer decorators that seamlessly unpack multipart `FormData` and standard JSON payloads.

---

## Technology Ecosystem

### Core Engine
- **Runtime**: Node.js (v18+ / v20+ Recommended)
- **Framework**: NestJS 11.x (Express HTTP Adapter)
- **Language**: TypeScript 5.7+
- **HTTP Pipeline**: RxJS 7.8+, Cookie-Parser, Multer

### Persistence & Storage
- **Database Engine**: PostgreSQL 16 (Hosted via Supabase)
- **ORM / Query Builder**: Drizzle ORM 0.45+
- **Database Driver**: `postgres` (Postgres.js)
- **Object Storage**: Cloudflare R2 (S3-Compatible Object Storage)
- **AWS SDK**: `@aws-sdk/client-s3`

### Authentication & Security
- **Auth Strategies**: Passport.js (`passport-jwt`, `passport-google-oauth20`, `passport-facebook`, `passport-instagram`)
- **Token Management**: NestJS JWT (`@nestjs/jwt`)
- **Password Hashing**: Bcrypt
- **Header Protection**: Custom Admin API Key (`x-admin-key`) Guard
- **Validation**: `class-validator`, `class-transformer`

### Communication & Infrastructure
- **Transactional Mailer**: Resend API Client (`resend`)
- **Serverless Platform**: Vercel Serverless Functions (`@vercel/node`)
- **Automated Crons**: Vercel Scheduled Cron Jobs

---

## System Architecture & Data Flow

```
[ Public Web Client ]        [ Admin Dashboard ]
          │                            │
   (?lang=en / ?lang=ja)         (x-admin-key)
          ▼                            ▼
  ┌──────────────────────────────────────────────┐
  │         Ikisaki Tours NestJS Backend         │
  │     (Global Prefix: /api | ValidationPipe)   │
  └───────┬──────────────────────────────┬───────┘
          │                              │
    (Drizzle ORM)                  (AWS S3 SDK)
          ▼                              ▼
  ┌───────────────────────┐      ┌─────────────────────────┐
  │ PostgreSQL (Supabase) │      │  Cloudflare R2 Bucket   │
  │  Multilingual JSONB   │      │   High-Speed Asset CDN  │
  └───────────────────────┘      └─────────────────────────┘
```

---

## Directory Structure

```
ikisakitours-backend/
├── src/
│   ├── addpackages/           # Tour packages, itinerary & pricing engine
│   │   ├── dto/               # Creation, update, response & validation DTOs
│   │   ├── addpackages.controller.ts
│   │   ├── addpackages.module.ts
│   │   └── addpackages.service.ts
│   ├── availability/          # Calendar blackout dates & booking availability
│   ├── blogs/                 # Multilingual blog publication & article engine
│   ├── comments/              # User comments & nested discussions
│   ├── contacts/              # Customer inquiries & lead capture
│   ├── cookies/               # GDPR/ePrivacy cookie consent tracker
│   ├── cron/                  # Automated keep-alive & maintenance endpoints
│   ├── database/              # Drizzle schema, DB connection & pool provider
│   │   ├── database.module.ts
│   │   ├── database.provider.ts
│   │   └── schema.ts          # Central PostgreSQL table declarations
│   ├── destinations/          # Destination guide & interactive map data
│   ├── email/                 # Email templates & Resend API dispatch
│   ├── faqs/                  # Categorized multilingual FAQ repository
│   ├── legaldocs/             # Dynamic Terms, Privacy & Policy manager
│   ├── newsletter/            # Subscriber lead management
│   ├── packagebooking/        # Reservation checkout & booking lifecycle
│   ├── servicepricing/        # Supplementary charters & transfer tariffs
│   ├── social-auth/           # OAuth2 social sign-in providers
│   ├── tours/                 # Core tour catalog management
│   ├── tourservice/           # Additional bespoke travel services
│   ├── uploads/               # Cloudflare R2 media upload service
│   ├── users/                 # User credentials, roles & profile management
│   ├── app.controller.ts
│   ├── app.module.ts          # Root application module wiring
│   ├── app.service.ts
│   └── main.ts                # Application bootstrap, CORS & middleware
├── drizzle/                   # Generated database migration files
├── drizzle.config.ts          # Drizzle Kit CLI configuration
├── nest-cli.json              # NestJS workspace configuration
├── package.json               # Dependencies and execution scripts
├── tsconfig.json              # TypeScript compiler configuration
└── vercel.json                # Vercel deployment & scheduled crons
```

---

## Database Schema & Models

The system uses PostgreSQL managed via **Drizzle ORM** with native `jsonb` indexing:

- **`packages`**: Complete tour definitions (one-day & multi-day), multilingual text fields (`title`, `description`, `highlights`, `includes`, `excludes`), dynamic structured `itinerary` (with array-based `meals` and `accommodation`), and industry-standard `pricing_config`.
- **`availability`**: Singleton calendar manager containing `api_closed_dates`, `date_details` (color-coding, tour type restrictions, localized notes), and `closed_date_details`.
- **`package_bookings`**: Confirmed customer reservations storing guest counts (adults, children, infants), selected package options, calculated totals, and reservation lifecycle statuses (`pending`, `confirmed`, `cancelled`, `completed`).
- **`destinations`**: Travel locations, regional summaries, geographic coordinates (`lat`, `lng`), and hero images.
- **`blogs` & `blog_likes`**: Travel guides, multi-paragraph markdown articles, tag arrays, and user like tracking.
- **`legal_docs`**: Versioned compliance documents (`terms`, `privacy`, `cookies`, `cancellation`) with translatable body content.
- **`service_pricing`**: Bespoke travel tiers (private charter, airport transfers, chauffeur services).
- **`contacts`**: Customer contact form submissions with auto-timestamping.
- **`cookie_consents`**: GDPR consent audit log tracking accepted cookie categories per user.
- **`newsletter_subscriptions`**: Email newsletter leads with opt-out tracking.
- **`faqs`**: Frequently asked questions grouped by categories with multilingual question/answer pairs.
- **`users`**: Administrative and customer accounts, hashed credentials, and OAuth profile identifiers.

---

## Core Functional Modules

### 1. Tour Packages & Dynamic Group Pricing
The `addpackages` module provides a comprehensive engine for travel packaging:
- **Group Tiers**: Define bulk pricing based on passenger count (e.g., 1–3 Pax at $150/pax, 4–8 Pax at $120/pax).
- **Passenger Categories**: Automated couple pricing calculations, child rates (percentage-based discount or fixed fee), and infant tariffs.
- **Custom Add-Ons**: Flexible options calculated per person, per room, or per booking.
- **Dynamic Itineraries**: Daily schedule items supporting multiple activities, routes, and dynamic string arrays for meals and accommodations.

### 2. Availability & Booking Calendar
The `availability` module enables real-time synchronization between the admin control panel and user-facing calendars:
- Blackout date management for specific tour types or all tours.
- Visual custom tagging with hex color assignments.
- Multilingual notes informing clients why dates are unavailable.

### 3. Legal Document Engine
The `legaldocs` module allows zero-downtime legal document updates:
- Admin panel manages raw bilingual texts (`en`, `ja`) with an admin key.
- Public visitors query clean, localized legal views (`/api/legaldocs/client?lang=en`).

### 4. Cloudflare R2 Asset Uploads
High-performance asset processing via the `uploads` module:
- Supports single file (`/api/uploads/single`) and batch uploads (`/api/uploads/batch`).
- Uploads directly to Cloudflare R2 bucket with organized folder prefixes and public CDN URLs.

---

## API Reference

All routes are mounted under the global prefix: `/api`.

### Packages & Tours (`/api/addpackages`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/addpackages` | Admin | Create package with multipart image upload & pricing config |
| `GET` | `/api/addpackages` | Public / Admin | List all packages (returns summary or localized list) |
| `GET` | `/api/addpackages/oneday` | Public | Paginated list of one-day tour summaries (`?page=1&limit=5&lang=en`) |
| `GET` | `/api/addpackages/multiday` | Public | Paginated list of multi-day tour summaries |
| `GET` | `/api/addpackages/:slug` | Public / Admin | Fetch package by slug (localized with `?lang=`, raw without) |
| `PATCH` | `/api/addpackages/:slug` | Admin | Update package text and pricing configuration |
| `DELETE` | `/api/addpackages/:slug` | Admin | Delete a tour package |
| `POST` | `/api/addpackages/:packageId/like` | User | Toggle like / unlike on a tour package |

### Availability Calendar (`/api/availability`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/availability` | Public / Admin | Fetch availability (raw for admin, localized with `?lang=`) |
| `GET` | `/api/availability/client` | Public | Explicit client availability endpoint with language filtering |
| `POST` | `/api/availability` | Admin | Update blackout dates, color tags, and notes |

### Destinations (`/api/destinations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/destinations/previews` | Public | Fetch lightweight destination cards for UI carousels |
| `GET` | `/api/destinations/map` | Public | Fetch destination coordinate markers for interactive maps |
| `GET` | `/api/destinations/slug/:slug`| Public | Fetch full destination detail by slug |
| `POST` | `/api/destinations` | Admin | Create new destination entry |
| `DELETE` | `/api/destinations/:id` | Admin | Remove destination entry |

### Bookings (`/api/package-bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/package-bookings` | Public | Submit a new tour reservation |
| `GET` | `/api/package-bookings` | Admin | Fetch all customer reservations |
| `PATCH` | `/api/package-bookings/:id/status`| Admin | Update booking state (`pending`, `confirmed`, etc.) |
| `DELETE` | `/api/package-bookings/:id` | Admin | Remove a booking record |

### Blogs & Articles (`/api/blogs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/blogs/previews` | Public | Fetch blog card previews with localized titles and summaries |
| `GET` | `/api/blogs/slug/:slug` | Public | Fetch full blog article by slug |
| `POST` | `/api/blogs` | Admin | Publish a new blog post |
| `PATCH` | `/api/blogs/:id` | Admin | Edit an existing blog post |
| `DELETE` | `/api/blogs/:id` | Admin | Remove a blog post |

### Legal Documents (`/api/legaldocs` & `/api/legal-docs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/legaldocs/client` | Public | Fetch all legal docs resolved to requested language |
| `GET` | `/api/legaldocs/client/:id`| Public | Fetch single legal doc (e.g. `terms`, `privacy`) by language |
| `GET` | `/api/legaldocs` | Admin | Fetch raw multilingual legal docs for editing |
| `GET` | `/api/legaldocs/:id` | Admin | Fetch raw multilingual legal doc by ID |
| `POST` | `/api/legaldocs` | Admin | Create or upsert legal doc |
| `PATCH` | `/api/legaldocs/:id` | Admin | Update legal doc contents |
| `DELETE` | `/api/legaldocs/:id` | Admin | Delete a legal doc |

### Media Uploads (`/api/uploads`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/uploads/single` | Admin | Upload a single image file to Cloudflare R2 |
| `POST` | `/api/uploads/batch` | Admin | Upload up to 10 images simultaneously with custom folder tag |

### General Inquiries & Services
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/contacts` | Public | Submit contact / inquiry form |
| `GET` | `/api/contacts` | Admin | Retrieve all inquiries |
| `POST` | `/api/cookies/consent` | Public | Save or update visitor cookie preference audit |
| `POST` | `/api/newsletter` | Public | Subscribe email to tour updates |
| `GET` | `/api/faqs` | Public | Retrieve categorized FAQs |
| `GET` | `/api/service-pricing/client/:type` | Public | Fetch transfer / charter tariffs |
| `GET` | `/api/cron/keep-alive` | System | Automated database ping to maintain pooler warmth |

---

## Security & Authentication

> [!IMPORTANT]
> The backend relies on multiple security boundaries to protect sensitive customer data and administrative mutations.

- **Admin API Key Guard**: Sensitive administrative routes require the `x-admin-key` HTTP header matching `process.env.ADMIN_API_KEY`.
- **Cross-Origin Resource Sharing (CORS)**: Dynamically verified in `src/main.ts`. Configured with origin pattern matching allowing local dev, the official production domain (`ikisakitours.com`), subdomains (`*.ikisakitours.com`), and Vercel preview environments (`*.vercel.app`).
- **Input Sanitization**: NestJS `ValidationPipe` runs with `whitelist: true`, automatically stripping unapproved body properties, and `transform: true` for strict type coercion.
- **Cookie Security**: HTTP-only cookie parsing with credential forwarding enabled.

---

## Environment Configuration

Create a `.env` file in the project root based on the following reference:

```env
# Server Port
PORT=4000
NODE_ENV=development

# Database Connections (Supabase Pooler & Direct)
DATABASE_URL="postgresql://<user>:<password>@<pooler-host>:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<direct-host>:5432/postgres?sslmode=require"

# Administrative Security
ADMIN_API_KEY="your-secure-admin-api-key"
JWT_SECRET="your-jwt-signing-secret"

# Cloudflare R2 Object Storage Credentials
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="ikisaki-tours-storage"
R2_PUBLIC_URL="https://your-public-r2-domain.r2.dev"

# Social Authentication (OAuth2)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Resend Transactional Email API
RESEND_API_KEY="re_your_resend_api_key"

# Client Web Application Origins
FRONTEND_URL="https://www.ikisakitours.com"
ADMINPANEL_URL="https://ikisakitours-admin-panel.vercel.app"

# Cron Verification Secret
CRON_SECRET="your-cron-secret-token"
```

---

## Installation & Local Setup

### Prerequisites
- Node.js (version `18.x` or `20.x` or higher)
- npm (version `9.x` or higher)
- A running PostgreSQL database instance (or Supabase project)

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/ikisakitours-backend.git
   cd ikisakitours-backend
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Open .env and fill in your database credentials and API keys
   ```

4. **Synchronize the database schema**:
   ```bash
   npx drizzle-kit push
   ```

5. **Start the local development server**:
   ```bash
   npm run start:dev
   ```

The API will boot and listen on `http://localhost:4000/api`.

---

## Database Operations

The project uses **Drizzle Kit** to inspect and synchronize schemas with PostgreSQL.

- **Push Schema Changes to DB**:
  ```bash
  npx drizzle-kit push
  ```
- **Generate SQL Migrations**:
  ```bash
  npx drizzle-kit generate
  ```
- **Open Drizzle Studio (Visual DB GUI)**:
  ```bash
  npx drizzle-kit studio
  ```

> [!TIP]
> If using Supabase Free Tier poolers, apply table schema adjustments directly through the Supabase SQL Editor if pooler timeouts occur during push commands.

---

## Deployment & Production

### Building for Production
Compile TypeScript into optimized JavaScript inside the `dist/` directory:

```bash
npm run build
```

Run the production server:

```bash
npm run start:prod
```

### Vercel Serverless Deployment
The repository includes pre-configured [vercel.json](file:///C:/Users/HP/Desktop/Asmith/ikisakitours-backend/vercel.json) settings utilizing `@vercel/node`.

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy to production:
   ```bash
   vercel --prod
   ```
3. Set environment variables in the **Vercel Dashboard** under **Project Settings > Environment Variables**.

---

## Automated Scheduled Tasks

Vercel Crons run automatically based on the schedule configured in `vercel.json`:

- **Path**: `/api/cron/keep-alive`
- **Schedule**: `0 0 */3 * *` (Every 3 days at midnight)
- **Purpose**: Pings the PostgreSQL database with `SELECT 1` to prevent Supabase Free Tier projects from entering inactivity pause.

---

## Quality & Testing

- **Lint Codebase**:
  ```bash
  npm run lint
  ```
- **Format Codebase**:
  ```bash
  npm run format
  ```
- **Run Unit Tests**:
  ```bash
  npm run test
  ```
- **Run End-to-End Tests**:
  ```bash
  npm run test:e2e
  ```

---

## License

This software and its source code are proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

Copyright (c) Ikisaki Tours. All Rights Reserved.
