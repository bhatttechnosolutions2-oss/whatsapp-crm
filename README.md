# Simple Business CRM & Client Portal (Phase 1 Foundation)

A production-ready, clean, fast, mobile-friendly multi-tenant CRM and Client Portal built with **Next.js (App Router)**, **TypeScript (Strict)**, **Tailwind CSS**, and **Supabase PostgreSQL & Auth**.

---

## 🚀 Key Features in Phase 1

1. **Multi-Tenant SaaS Hierarchy**: Platform → Organizations → Users → Business Data.
2. **Database-Level Isolation**: Row Level Security (RLS) policies on all tables (`organizations`, `profiles`, `organization_members`, `audit_logs`).
3. **Role-Based Foundation**: `ADMIN` role auto-assigned upon organization registration. Architecture ready for `SUPER_ADMIN`, `SALES`, `PROJECT_MANAGER`, `DEVELOPER`, `DESIGNER`, `QA`, `CLIENT`.
4. **Authentication & Session Security**:
   - `/login`, `/register`, `/forgot-password`, `/reset-password`
   - Next.js SSR middleware for route protection.
5. **Phase 1 Foundation Dashboard (`/app/dashboard`)**:
   - Greeting header with dynamic time of day.
   - Live Active Visitors badge (starts at 0).
   - 4 Clean Stat Cards (`Visitors Today`, `Leads Today`, `WhatsApp Leads`, `Total Leads`) with strict **Zero Fake Data** compliance.
   - Quick action shortcuts.
   - Performance and recent leads empty states.
6. **Mobile-First Responsive Design**:
   - Works smoothly across 320px, 375px, 390px, 430px, 768px, 1024px, 1280px, and 1440px.
   - Touch-friendly mobile bottom navigation bar and mobile drawer.
7. **Foundation Routes**:
   - `/app/dashboard`, `/app/leads`, `/app/clients`, `/app/projects`, `/app/analytics`, `/app/whatsapp`, `/app/ads`, `/app/payments`, `/app/profile`, `/app/settings`.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS (Custom design tokens, slate background `#F8FAFC`, rounded-2xl cards)
- **Icons**: Lucide React
- **Validation**: Zod
- **Database & Auth**: Supabase PostgreSQL with RLS & `@supabase/ssr`

---

## 🗄️ Database Setup & Migrations

Execute the SQL files located in `supabase/migrations/` in your Supabase SQL editor:

1. **`supabase/migrations/00001_initial_schema.sql`**:
   - Creates `organizations`, `profiles`, `organization_members`, and `audit_logs` tables.
   - Adds indexes, foreign key cascades, and `updated_at` triggers.
2. **`supabase/migrations/00002_rls_policies.sql`**:
   - Enables Row Level Security (RLS) on all tables.
   - Implements `is_org_member()`, `has_org_role()`, and `get_user_org_ids()` security definer functions.
   - Applies airtight tenant isolation policies.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and provide your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_NAME="Business CRM"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Typecheck
npm run typecheck

# Production build
npm run build

# Start dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
