# OfferKart - Next.js with ISR

> **Local Deals & Offers Discovery Platform** built with Next.js 15, TypeScript, and Incremental Static Regeneration (ISR)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3001](http://localhost:3001) to view the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (ISR: 5min)
│   └── offer/[id]/         # Dynamic offer pages (ISR: 10min)
├── components/
│   ├── layout/             # Layout components
│   ├── home/               # Home page components
│   ├── offer/              # Offer components
│   └── ui/                 # Shadcn UI components (49)
├── lib/                    # Utilities
└── assets/                 # Static assets
```

## ⚡ Features

- ✅ **ISR (Incremental Static Regeneration)**
  - Home page: 5-minute revalidation
  - Offer pages: 10-minute revalidation
- ✅ **SEO Optimized** - Dynamic metadata generation
- ✅ **Theme System** - Light/Dark mode with next-themes
- ✅ **Premium UI** - Custom design system with Tailwind CSS
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Responsive** - Mobile-first design
- ✅ **Accessible** - Radix UI components

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **UI Components:** Shadcn UI (Radix UI)
- **Icons:** Lucide React
- **State:** React Query
- **Forms:** React Hook Form + Zod
- **Theme:** next-themes

## 📦 Key Dependencies

```json
{
  "next": "16.1.4",
  "react": "18.3.1",
  "typescript": "5.8.3",
  "tailwindcss": "3.4.17",
  "@tanstack/react-query": "5.83.0",
  "next-themes": "0.3.0",
  "lucide-react": "0.462.0"
}
```

## 🎨 Design System

### Colors
- **Primary:** Orange (`hsl(24 85% 52%)`)
- **Secondary:** Light gray (`hsl(30 10% 92%)`)
- **Accent:** Amber (`hsl(38 92% 50%)`)

### Fonts
- **Sans:** Inter (body text)
- **Serif:** Playfair Display (headings)

### Custom Classes
- `.glass-card` - Glassmorphism effect
- `.gradient-futuristic` - Premium gradients
- `.card-futuristic` - Hover effects
- `.badge-futuristic` - Glowing badges

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.offerkart.com
REVALIDATION_SECRET=your-secret-key-here
NEXT_PUBLIC_SITE_URL=https://offerkart.com
```

### ISR Configuration

```typescript
// Home page - 5 minute revalidation
export const revalidate = 300;

// Offer pages - 10 minute revalidation
export const revalidate = 600;
export const dynamicParams = true;
```

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

### Other Platforms
- AWS Amplify
- Netlify
- Cloudflare Pages

All support Next.js ISR out of the box.

## 📈 Performance Targets

- **TTFB:** < 200ms (cached pages)
- **FCP:** < 1s
- **LCP:** < 2.5s
- **Lighthouse Performance:** 95+
- **Lighthouse SEO:** 100

## 🔗 Links

- [Implementation Plan](../../../.gemini/antigravity/brain/f3bdb24f-f176-49d3-983c-8be75f9d61f4/implementation_plan.md)
- [Walkthrough](../../../.gemini/antigravity/brain/f3bdb24f-f176-49d3-983c-8be75f9d61f4/walkthrough.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com/)

## 📄 License

Private - OfferKart

---

**Built with ❤️ using Next.js 15 + ISR**
