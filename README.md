# OfferKart

**Discover Local Deals & Offers** - A modern full-stack platform connecting local businesses with customers through dynamic offer posters and campaigns.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Features](#features)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [API Documentation](#api-documentation)
- [Data Models](#data-models)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Performance](#performance)
- [Security](#security)
- [Contributing](#contributing)

---

## Overview

OfferKart is a comprehensive B2C marketplace platform that enables local shops and businesses to:

- Create and manage promotional offers
- Design eye-catching posters using a powerful visual designer
- Publish campaigns across multiple branches
- Reach local customers with targeted deals
- Leverage AI-powered tools for marketing content generation

### Core User Flows

1. **Customer Flow**: Browse offers → Filter by location/category → View offer details → Discover shops
2. **Merchant Flow**: Register shop → Manage branches → Create offers → Upload posters → Classify products → Publish campaigns → Track performance
3. **Designer Flow**: Select template → Customize layout → Add products → Apply branding → Export poster

---

## Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with App Router | 16.1.6 |
| **TypeScript** | Type safety | 5.x |
| **React** | UI library | 19.2.3 |
| **Tailwind CSS** | Utility-first CSS | 4.x |
| **Radix UI** | Unstyled accessible components | Latest |
| **TanStack Query** | Server state management | 5.90.19 |
| **NextAuth.js** | Authentication | 4.24.13 |
| **react-hook-form** | Form handling | 7.71.21 |
| **Zod** | Schema validation | 3.25.76 |
| **Shadcn/ui** | Component library | Custom build |
| **Sonner** | Toast notifications | 2.0.7 |
| **Lucide React** | Icon library | 0.562.0 |
| **html2canvas** | Poster generation | 1.4.1 |

### Backend & External Services

| Service | Purpose |
|---------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **NextAuth.js** | Session management & JWT |
| **Upstream API** | Backend proxy (`https://offersnearu.vercel.app/api`) |
| **S3/Cloud Storage** | Poster image hosting |
| **OpenRouter** | AI text generation (taglines, palettes) |
| **HuggingFace** | Vision AI for product extraction |
| **Tesseract.js** | OCR preprocessing |

---

## Project Structure

```
offerKart/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API route handlers
│   │   │   ├── ai/            # AI endpoints (text & vision)
│   │   │   ├── auth/          # NextAuth handler
│   │   │   ├── backend/       # Backend proxy
│   │   │   ├── chat/          # Chat AI endpoint
│   │   │   ├── health/        # Health check
│   │   │   └── revalidate/    # ISR revalidation
│   │   ├── login/             # Login page
│   │   ├── forgot-password/   # Password reset
│   │   ├── offer/             # Single offer view
│   │   ├── offers/            # Offers listing
│   │   ├── products/          # Products listing
│   │   ├── shop-manager/      # Merchant dashboard
│   │   │   ├── create-offer/  # Offer creation flow
│   │   │   ├── edit-offer/    # Offer editing
│   │   │   ├── poster-designer/ # Visual poster editor
│   │   │   ├── shop-settings/  # Shop management
│   │   │   ├── add-shop/       # Add new shop
│   │   │   └── [shopId]/       # Shop-specific routes
│   │   ├── shop-registration/ # Shop signup
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── providers.tsx      # Context providers
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   │   ├── home/              # Homepage sections
│   │   ├── layout/            # Layout components
│   │   ├── offer/             # Offer-specific components
│   │   ├── offers/            # Offers listing components
│   │   ├── products/          # Product components
│   │   ├── shop-manager/      # Merchant dashboard components
│   │   ├── shop-registration/ # Registration components
│   │   ├── shared/            # Shared UI components
│   │   └── ui/                # Shadcn/ui primitives
│   ├── hooks/                 # Custom React hooks
│   │   ├── useApi.ts          # Data fetching hooks
│   │   ├── use-toast.ts       # Toast management
│   │   └── use-mobile.ts      # Mobile detection
│   ├── lib/                   # Core utilities & libraries
│   │   ├── ai/               # AI integration
│   │   │   ├── posterAI.ts   # Tagline & palette generation
│   │   │   └── prompts.ts    # AI prompt templates
│   │   ├── api/              # API client layer
│   │   │   ├── backendClient.ts  # Centralized fetch wrapper
│   │   │   ├── endpoints.ts      # API endpoint constants
│   │   │   ├── schemas.ts        # Zod validation schemas
│   │   │   ├── shop.ts           # Shop API functions
│   │   │   ├── branch.ts         # Branch API functions
│   │   │   ├── offers.ts         # Offers API functions
│   │   │   ├── products.ts       # Products API functions
│   │   │   ├── s3.ts             # Image upload API
│   │   │   └── mockData.ts       # Development data
│   │   ├── types/            # TypeScript definitions
│   │   │   ├── api.ts        # Generic API types
│   │   │   ├── auth.ts       # Auth types
│   │   │   ├── branch.ts     # Branch types
│   │   │   ├── offer.ts      # Offer types
│   │   │   ├── product.ts    # Product types
│   │   │   └── shop.ts       # Shop types
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── config.ts         # App configuration
│   │   ├── designPresets.ts  # Design system tokens
│   │   ├── posterTemplates.ts # Poster template definitions
│   │   ├── posterTemplateSchema.ts # Template type definitions
│   │   ├── templateToCanvas.ts # Template → Canvas converter
│   │   ├── security.ts       # Payload sanitization
│   │   ├── storage.ts        # LocalStorage abstraction
│   │   ├── utils.ts          # Utility functions
│   │   ├── categories.ts     # Category mappings
│   │   ├── logger.ts         # Structured logging
│   │   ├── openrouter.ts     # OpenRouter AI client
│   │   └── huggingface.ts    # HuggingFace AI client
│   ├── assets/               # Static assets
│   │   └── offers/           # Offer category images
│   ├── public/               # Public static files
│   │   ├── images/           # Images & templates
│   │   └── ...               # Static assets
│   └── types/                # Global type declarations
│       └── next-auth.d.ts    # NextAuth type augmentation
├── .env.local               # Local environment (gitignored)
├── .gitignore               # Git ignore rules
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies & scripts
└── README.md                # This documentation
```

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js React Application (Hydrated)                  │ │
│  │  • App Router Pages                                   │ │
│  │  • Client Components (useState, useEffect)            │ │
│  │  • Server Components (data fetching)                  │ │
│  │  • TanStack Query for caching                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server (Vercel/Node)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (src/app/api/)                            │ │
│  │  • Authentication (NextAuth)                          │ │
│  │  • Backend Proxy (/api/backend/[...path])             │ │
│  │  • AI Services (/api/ai, /api/ai/vision)             │ │
│  │  • Chat (/api/chat)                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│         ↕                                     ↕            │
│  ┌─────────────┐                   ┌──────────────────┐    │
│  │  Upstream   │  Business API     │  External AI     │    │
│  │  Backend    │◄────────────────►│  Services        │    │
│  │  (Supabase/ │   (REST/JSON)    │  • OpenRouter    │    │
│  │   Custom)   │                  │  • HuggingFace   │    │
│  └─────────────┘                  └──────────────────┘    │
│         ↕                                                      │
│  ┌─────────────┐                                                │
│  │   S3/Cloud  │  Image & File Storage                          │
│  │   Storage   │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

#### **Backend Proxying Pattern**

All business API calls go through `backendClient.ts`, which:
- Uses server-direct fetch on Next.js server (direct to upstream API)
- Uses client-side proxy on browser (`/api/backend/[...path]`)
- Automatically injects JWT tokens from NextAuth session
- Adds `shopId` header for multi-tenant isolation
- Sanitizes payloads to prevent XSS
- Handles 401 redirects globally

```typescript
// Client-side example
backend.post<Offer>("/business/offer", offerPayload)
  .then(res => { /* ... */ });

// Server-side (direct)
// Request goes to: https://offersnearu.vercel.app/api/business/offer
// With Authorization: Bearer <token>
```

#### **Template-Driven Design System**

Poster templates are JSON-driven configuration objects (`TemplateConfig`) that define:
- Canvas dimensions & background
- Header/footer layout with positioning
- Item grid (columns, rows, spacing, styling)
- Font families & text styles
- Decorative elements

See `src/lib/posterTemplateSchema.ts` for full type definition.

#### **State Management Strategy**

| State | Storage | Usage |
|-------|---------|-------|
| Server State | TanStack Query + ISR | Offers, products, shops, branches |
| UI State | React `useState` | Modals, tabs, form inputs |
| Draft Data | `localStorage` (`storage.ts`) | Offer drafts, poster stacks |
| Auth State | NextAuth Session | User data, tokens |
| Global UI | Context (`Providers.tsx`) | Theme, toasts |

---

## Features

### Customer-Facing

#### 1. **Smart Homepage**
- Featured shops carousel with infinite scroll
- Curated offers grid with filtering
- Category-based browsing
- Location-based sorting (distance)
- Responsive design (mobile-first)

#### 2. **Advanced Offer Discovery**
- Keyword search
- Filter by category, location, discount
- Sort by popularity, date, distance
- Pagination (8 per page)
- Real-time updates via ISR

#### 3. **Offer Details**
- Full poster display
- Shop information & branch locations
- Valid date countdown
- Contact details
- Similar offers carousel

### Merchant Dashboard

#### 4. **Shop Management**
- Register new shop
- Add/update shop details
- Upload logo & branding
- Manage multiple branches

#### 5. **Offer Lifecycle**
- Create new offers (batch upload)
- Classify poster products with AI assistance
- Edit existing campaigns
- Activate/pause offers
- Delete campaigns
- Preview before publishing

#### 6. **Product Catalog**
- View all products
- Edit product details
- Delete products
- Category organization

#### 7. **Visual Poster Designer**
- Drag-and-drop canvas
- 10+ pre-built templates
- Customizable backgrounds, colors, fonts
- Product card generation
- Text & shape elements
- Undo/redo history
- Export as image (via html2canvas)
- Save custom posters

#### 8. **AI Studio**
- Generate marketing taglines
- Extract products from poster images (OCR + vision)
- Suggest color palettes
- Auto-categorization

---

## Pages & Routes

### Public Routes

| Route | Component | Type | Description |
|-------|-----------|------|-------------|
| `/` | `page.tsx` | Server | Homepage with featured offers |
| `/offers` | `offers/page.tsx` | Hybrid | Browse all offers with filters |
| `/offer/[id]` | `offer/[id]/page.tsx` | Server | Single offer detail |
| `/products` | `products/page.tsx` | Hybrid | Browse all products |
| `/login` | `login/page.tsx` | Client | Authentication |
| `/forgot-password` | `forgot-password/page.tsx` | Client | Password reset request |
| `/shop-registration` | `shop-registration/page.tsx` | Client | Shop signup |

### Merchant Routes (Protected)

| Route | Component | Description |
|-------|-----------|-------------|
| `/shop-manager` | `page.tsx` | Main dashboard |
| `/shop-manager/create-offer` | `page.tsx` | Upload & classify posters |
| `/shop-manager/create-offer/editor` | `editor/page.tsx` | Mark products on poster |
| `/shop-manager/edit-offer/[id]` | `[id]/page.tsx` | Edit existing offer |
| `/shop-manager/poster-designer` | `poster-designer/page.tsx` | Visual designer |
| `/shop-manager/shop-settings` | `shop-settings/page.tsx` | Shop profile |
| `/shop-manager/add-shop` | `add-shop/page.tsx` | Register new shop |
| `/shop-manager/[shopId]/branches` | `[shopId]/branches/page.tsx` | Branch listing |
| `/shop-manager/[shopId]/add-branch` | `[shopId]/add-branch/page.tsx` | Add branch |

### API Routes

```
/api/health                 GET    - Health check
/api/auth/[...nextauth]     POST   - NextAuth handler
/api/backend/[...path]      ALL    - Backend proxy
/api/ai                     POST   - AI text generation
/api/ai/vision              POST   - Vision AI (OCR & extraction)
/api/chat                   POST   - Chat AI assistant
/api/revalidate             POST   - ISR cache revalidation
```

---

## Components

### Component Organization

All components follow the **Compound Component** and **Headless UI** patterns where applicable.

#### **Shared Components** (`src/components/shared/`)

Reusable UI building blocks:

| Component | Purpose | Props |
|-----------|---------|-------|
| `PremiumCard` | Styled card container | `variant`, `padding`, `className` |
| `PremiumButton` | Branded button | `variant`, `size`, `icon` |
| `PremiumInput` | Styled input | `label`, `icon`, `error` |
| `PremiumDatePicker` | Date range picker | `label`, `date`, `setDate` |
| `AppModal` | Generic modal | `open`, `onOpenChange`, `title` |
| `ImagePreviewModal` | Image lightbox | `src`, `isOpen`, `onClose` |
| `SearchableSelect` | Single-select dropdown | `options`, `value`, `onChange` |
| `MultiSearchableSelect` | Multi-select dropdown | `options`, `selectedValues`, `onChange` |
| `StatusToggleButton` | Active/pause toggle | `status`, `onChange` |
| `FileUpload` | Drag & drop upload | `onUpload`, `accept`, `multiple` |
| `Breadcrumbs` | Navigation breadcrumb | `items` |
| `Typography` | Styled text (Heading, Text, Subheading) | `as`, `className`, `children` |

#### **Homepage Components** (`src/components/home/`)

| Component | Purpose |
|-----------|---------|
| `FeaturedCarousel` | Horizontal scroll of featured shops |
| `FeaturedOffers` | Spotlight offers grid |
| `OfferGrid` | Main offers display with lazy loading |
| `FilterPanel` | Search & filter controls |
| `ShopRegistrationSection` | CTA for shop owners |

#### **Shop Manager Components** (`src/components/shop-manager/`)

| Component | Purpose |
|-----------|---------|
| `PosterCardStack` | Poster upload & classification UI |
| `PosterDesigner` | Advanced visual canvas editor |
| `PosterTemplateSelector` | Template gallery modal |
| `TemplateThumbnail` | Dynamic template preview |
| `PosterPreviewPanel` | Poster carousel with marking controls |
| `HotspotEditor` | Visual product marking on poster |
| `CreateOfferForm` | Offer metadata form |
| `AddShopForm` | Shop registration form |
| `AddBranchForm` | Branch creation form |
| `ShopSettingsForm` | Shop profile update |
| `BranchListPage` | Branch management table |
| `MarkedPoster` | Marked poster display |
| `PosterOrderGrid` | Poster ordering interface |

#### **Product & Offer Components**

| Component | Purpose |
|-----------|---------|
| `OfferCard` | Single offer display card |
| `OffersClient` | Offers page client logic |
| `OfferDetailClient` | Offer detail page logic |
| `ProductCard` | Single product display |
| `ProductGrid` | Product listing grid |
| `ProductsClient` | Products page client |

#### **Layout Components** (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `Header` | Main site header |
| `ConditionalHeader` | Header that hides on merchant pages |

---

## API Documentation

### Backend Proxy (`/api/backend/[...path]`)

Proxy routes forward requests to the upstream API with authentication automatically attached.

**Base URL**: `https://offersnearu.vercel.app/api`

**Authentication**: Required for most routes (except public paths like login/register)

**Headers Automatically Added**:
- `Authorization: Bearer <jwt_token>`
- `shopId: <current_shop_id>`

**Public Paths** (no auth required):
- `business/auth/login`
- `business/auth/register`

#### Example Usage

```typescript
// Client-side code
import { backend } from '@/lib/api/backendClient';

const response = await backend.post<Shop>('/business/shop/my-shops');
if (response.success) {
    console.log(response.data);
}
```

### API Endpoints Reference

#### Authentication (`/business/auth/`)

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| `POST` | `/register` | `RegisterShopRequest` | `LoginResponse` | Register new shop |
| `POST` | `/login` | `LoginShopRequest` | `LoginResponse` | Authenticate user |

**LoginResponse**:
```typescript
{
  status: "success";
  data: {
    id: string;
    full_name: string;
    email: string;
    business_name: string;
    token: string;
  };
}
```

#### Shops (`/business/shop/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/my-shops` | Required | Get all shops for current user |
| `GET` | `/:id` | Required | Get single shop details |
| `POST` | `/` | Required | Create new shop |
| `PUT` | `/:id` | Required | Update shop |
| `DELETE` | `/:id` | Required | Delete shop |

#### Branches (`/business/shop/:shopId/branches`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all branches for shop |
| `GET` | `/:id` | Get single branch |
| `POST` | `/` | Create branch |
| `PUT` | `/:id` | Update branch |
| `DELETE` | `/:id` | Delete branch |

#### Offers (`/business/offer/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get all offers (merchant's) |
| `GET` | `/:id` | Get single offer |
| `POST` | `/` | Create new offer (batch) |
| `PUT` | `/:id` | Update offer |
| `DELETE` | `/:id` | Delete offer |
| `PATCH` | `/inactivate/:id` | Toggle active/paused |

**Offer Payload** (`OfferPayload`):
```typescript
{
  batchId: string;
  title: string;
  description?: string;
  validFrom: string; // YYYY-MM-DD
  validTo: string;   // YYYY-MM-DD
  branchIds: number[];
  branchNames: string[];
  branchCity?: string;
  status: "active" | "paused";
  isActive: boolean;
  createdAt: string;
  posters: Poster[];
}
```

**Poster**:
```typescript
{
  id: string;
  posterSrc: string; // S3 URL
  type: "just_post" | "marked_poster" | "unclassified";
  markedItems?: MarkedItem[];
}
```

#### User Offers (`/user/offer/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Public offers feed |
| `GET` | `/featured` | Featured offers |
| `GET` | `/paginated?page=X&limit=Y` | Paginated results |

#### Images (`/business/image/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload image to S3 |
| `GET` | `/` | List uploaded images |
| `DELETE` | `/` | Delete image (JSON body: `{ url: string }`) |

### AI Endpoints

#### `/api/ai` - Text Generation

Generates marketing content using OpenRouter with fallback to HuggingFace.

**Request**:
```json
{
  "type": "taglines" | "palette",
  "productName": "Product Name",
  "category": "Electronics",
  "tone": "exciting",
  "imageUrl": "https://..." // for palette
}
```

**Response**:
```json
{
  "content": "Generated text content"
}
```

#### `/api/ai/vision` - Vision Processing

Extracts structured product data from poster images.

**Request**:
```json
{
  "text": "Optional OCR pre-extracted text",
  "image": "base64 or URL",
  "role": "product_extraction"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "productName": "...",
    "offerPrice": "...",
    "oldPrice": "...",
    "description": "..."
  },
  "model": "model-name"
}
```

**Available Roles**:
- `product_extraction` - Extract product details from image

#### `/api/chat` - Chat Assistant

Interactive chat with AI assistant for customer support.

**Request**:
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

**Response**:
```json
{
  "content": "AI response",
  "model": "..."
}
```

**Rate Limiting**: 10 requests/minute per IP (in-memory, use Redis in production)

---

## Data Models

### Core Domain Types

#### **Shop** (`src/lib/types/shop.ts`)

```typescript
interface Shop {
  id: number;
  user_id: string;
  shop_name: string;
  logo_url: string | null;
  email: string | null;
  phone: string;
  latitude: number | string;
  longitude: number | string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### **Branch** (`src/lib/types/branch.ts`)

```typescript
interface Branch {
  id: number;
  shop_id: number;
  branch_name: string;
  email: string | null;
  phone: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  city: string;
  pincode: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### **Offer** (`src/lib/types/offer.ts`)

```typescript
interface Offer {
  // Core
  offerId?: number;
  title?: string;
  description?: string;
  status?: "active" | "paused" | "expired";
  isActive: boolean;
  
  // Timing
  validFrom?: string;
  validTo?: string;
  createdAt?: string;
  lastEdited?: string;
  
  // Classification
  branchIds?: (number | string)[];
  branchNames?: string[];
  branchCity?: string;
  
  // Media
  posters?: Poster[];
  
  // Metadata
  batchId?: string;
  isFeatured?: boolean;
  distanceKm?: number | null;
  daysLeft?: number | null;
  shopLogo?: string | null;
  branches?: { id: number; branchName: string }[];
}

interface Poster {
  id?: string;
  posterSrc: string;
  type: "just_post" | "marked_poster" | "unclassified";
  order?: number;
  markedItems?: MarkedItem[];
}

interface MarkedItem {
  id: string;
  x: number;         // Position on poster (0-100 %)
  y: number;
  width: number;
  height: number;
  name: string;
  description: string;
  productImage: string;
  currency: string;
  oldPrice: number;
  offerPrice: number;
  subcategoryId?: number;
  mainCategory?: string;
  subcategories?: string[];
}
```

#### **Product** (`src/lib/types/product.ts`)

```typescript
interface Product {
  id: number | string;
  name: string;
  shopName: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory?: string[];
  rating: number;
  reviews?: number;
  discount?: string;
  description?: string;
  specifications?: { label: string; value: string }[];
  images?: string[];
}
```

### API Response Pattern

All API endpoints return a consistent structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

---

## Development Setup

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** or **npm** (pnpm recommended)
- **Git**

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd offerKart

# Install dependencies (using pnpm)
pnpm install

# Or using npm
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables) section).

### Development Server

```bash
# Start dev server
pnpm dev

# Open browser
# http://localhost:3000
```

### Linting & Type Checking

```bash
# Run ESLint
pnpm lint

# TypeScript check (via tsc --noEmit)
npx tsc --noEmit
```

### Build & Production Preview

```bash
# Build the app
pnpm build

# Start production server
pnpm start

# Preview production build locally
pnpm preview
```

---

## Environment Variables

### Required Variables

```env
# NextAuth
NEXTAUTH_SECRET="your-secret-here"  # At least 32 chars
NEXTAUTH_URL="http://localhost:3000"  # Omit in development

# Upstream Backend API
UPSTREAM_API_BASE_URL="https://offersnearu.vercel.app/api"
# OR publicly exposed via NEXT_PUBLIC_ prefix for client-side proxy
NEXT_PUBLIC_UPSTREAM_API_BASE_URL="https://offersnearu.vercel.app/api"

# Backend Proxy Prefix (client-side relative path)
BACKEND_PROXY_PREFIX="/api/backend"
NEXT_PUBLIC_BACKEND_PROXY_PREFIX="/api/backend"

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Optional Variables

```env
# AI Services
OPENROUTER_API_KEY="sk-or-v1-..."        # Required for AI taglines/palettes
HF_ACCESS_TOKEN="hf_..."                  # HuggingFace token (optional, fallback)

# reCAPTCHA (if implementing)
RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."

# ISR Revalidation (used by /api/revalidate)
REVALIDATION_SECRET="your-revalidation-secret"

# Analytics
GOOGLE_ANALYTICS_ID="G-..."

# S3/Storage (if using direct upload)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."
```

### Local Development Setup

1. Copy the example env file (if provided):
   ```bash
   cp .env.example .env.local
   ```

2. Fill in required values. For quick local testing:
   ```env
   NEXTAUTH_SECRET="dev-secret-that-is-at-least-32-characters-long"
   UPSTREAM_API_BASE_URL="https://offersnearu.vercel.app/api"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

3. The app uses **fallback defaults** for some config values to prevent crashes in development mode.

---

## Key Libraries & Utilities

### `backendClient.ts` - Centralized API Client

Abstracts all HTTP calls with:
- Environment-aware URL resolution
- Token injection from NextAuth session
- Payload sanitization (XSS prevention)
- Global 401 handling
- JSON validation with Zod
- Request/response logging

Usage:
```typescript
import { backend } from '@/lib/api/backendClient';

// GET
const res = await backend.get<User>('/business/shop/my-shops');

// POST with body
const res = await backend.post<Offer>('/business/offer', offerPayload);

// With Zod schema validation
const res = await backend.get<Shop[]>(
  '/business/shop/my-shops',
  {}, 
  z.array(ShopSchema)
);
```

### `storage.ts` - LocalStorage Abstraction

Type-safe localStorage wrapper with:
- JSON serialization/deserialization
- Automatic error handling
- Expiry support (if needed)

```typescript
import { storage } from '@/lib/storage';

// Set item
await storage.setItem('offerDrafts', drafts);

// Get item
const drafts = await storage.getItem<Draft[]>('offerDrafts');

// Remove item
storage.removeItem('key');
```

Stored keys used in app:
- `markedPosters` - Published offers
- `currentEditingPoster` - Current draft
- `offerDrafts` - Saved drafts
- `poster_stack_resume` - Resumable poster stack

### `posterTemplates.ts` - Template Registry

JSON-driven poster template definitions:
- 15+ pre-built templates across categories: retail, food, tech, fashion, general
- Each template defines canvas config, fonts, colors, grid layout
- Used by `TemplateThumbnail` for preview rendering
- Loaded into canvas via `templateToCanvas.ts`

### `designPresets.ts` - Design Tokens

Contains:
- Premium gradient palettes (18 curated)
- Aspect ratio presets (A4, Instagram, Story, Banner)
- Google Fonts list
- Abstract background models
- Pattern definitions

---

## Performance Optimizations

### ISR (Incremental Static Regeneration)

| Page | Revalidate Interval |
|------|---------------------|
| Homepage (`/`) | 300s (5 min) |
| Offers listing (`/offers`) | 300s |
| Offer detail (`/offer/[id]`) | On-demand via revalidate tag |
| Products (`/products`) | 300s |

**Manual Revalidation Trigger**:
```bash
curl -X POST \
  "https://your-domain.com/api/revalidate?secret=${REVALIDATION_SECRET}&path=/offers"
```

### Image Optimization

- **Next.js Image component** (`next/image`) for automatic optimization
- **S3 upload + compression** via `browser-image-compression` (max 1MB, 1920px)
- **WebP fallbacks** where supported
- **Lazy loading** default for images below the fold

### Caching Strategy

TanStack Query default config (`providers.tsx`):
```typescript
{
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,      // 10 minutes cache
  refetchOnWindowFocus: true,
  retry: 1,
}
```

### Code Splitting

- **Dynamic imports** used for heavy components (e.g., `PosterDesigner`)
- **Route-based splitting** via App Router automatically
- **Component-level suspense** boundaries

---

## Security

### Authentication Flow

1. User submits credentials → `POST /business/auth/login`
2. Backend validates → returns `{ user, token }`
3. NextAuth stores in encrypted HTTP-only cookie
4. Token stored in JWT & session (via callbacks in `auth.ts`)
5. `backendClient` automatically sends `Authorization: Bearer <token>`

### Payload Sanitization

All POST/PUT/PATCH requests are sanitized before sending to backend via `sanitizePayload()`:
- Strips HTML tags from strings
- Removes script elements recursively
- Prevents XSS in user-generated content

### Authorization

- **Shop-scoped access**: All API calls include `shopId` header
- Backend verifies shop ownership before mutations
- Session-based JWT expiration (configurable)

### Rate Limiting

Applied on AI endpoints (`/api/ai`, `/api/ai/vision`, `/api/chat`):
- 10 requests per minute per IP
- In-memory storage (replace with Redis in production)

### CSRF Protection

NextAuth's built-in CSRF token validation:
- Origin & referer checking in auth route
- Vercel preview deployment allowances

### Data Protection

- **S3 URLs** signed (time-limited) if using private buckets
- **No sensitive data** logged (structured logger redacts PII)
- **HTTPS enforced** in production

---

## Testing

> **Note**: Test suite not included yet. Recommended setup:

### Suggested Test Stack

- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright or Cypress
- **API Testing**: Supertest for route handlers

### Running Tests (一旦实现)

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Key Areas to Test

- [ ] Authentication flow (login/logout)
- [ ] Offer creation & publishing
- [ ] Poster classification
- [ ] Template rendering accuracy
- [ ] AI fallback behavior
- [ ] Branch CRUD operations
- [ ] Image upload & compression
- [ ] Multi-shop session isolation

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables
4. Deploy

**Automatic optimizations**:
- Edge caching for ISR pages
- Image optimization
- SSL/TLS
- Global CDN

### Docker (Alternative)

```dockerfile
# Dockerfile (example)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Environment in Production

1. **Set strong `NEXTAUTH_SECRET`** (min 32 chars)
2. **Disable dev-only features** (set `NODE_ENV=production`)
3. **Configure CORS** if using custom domain
4. **Enable Redis** for rate limiting & sessions (optional)
5. **Set up revalidation secret** for ISR purging

---

## Contributing

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** with Next.js config
- **Prettier** (if configured)
- **Conventional commits** recommended (`feat:`, `fix:`, `docs:`)

### Branch Strategy

```
main          → Production
develop       → Integration
feature/*     → New features
bugfix/*      → Bug fixes
hotfix/*      → Urgent production fixes
```

### Development Workflow

1. **Fork & clone**
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Make changes** with clear commit messages
4. **Run lint & type check**: `pnpm lint && pnpm typecheck`
5. **Test locally** (manual or automated)
6. **Push & open PR** with description

### PR Checklist

- [ ] Code follows existing patterns
- [ ] No console.log statements left
- [ ] Types added for new APIs
- [ ] ESLint passes
- [ ] TypeScript compiles
- [ ] Responsive design tested
- [ ] Accessibility (a11y) considered

---

## Common Issues & Troubleshooting

### "Invalid session token" on login

**Solution**: Ensure `NEXTAUTH_SECRET` is set and consistent across deployments. Reset if needed.

### AI features show "Setup Required"

**Solution**: Add `OPENROUTER_API_KEY` to `.env.local`. Get key from [OpenRouter.ai](https://openrouter.ai).

### Images not uploading

**Solution**: Check CORS on S3 bucket allows your domain. Verify `UPSTREAM_API_BASE_URL` is reachable.

### ISR not updating

**Solution**: Trigger revalidation via `/api/revalidate` or redeploy. Check `REVALIDATION_SECRET` matches.

### LocalStorage quota exceeded

**Solution**: Clear drafts in Shop Manager → Drafts section. `localStorage` limited to ~5MB.

---

## License

[Add your license here, e.g., MIT License]

---

## Support

For questions or issues:
- **GitHub Issues**: Report bugs & feature requests
- **Documentation**: See inline JSDoc comments in complex files
- **Architecture Diagram**: See `ARCHITECTURE.md` if separate

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
