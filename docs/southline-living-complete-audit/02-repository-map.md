# Repository Map

## Top-level structure

- [app](app): Next.js route tree for public pages, contractor/admin pages, and real-estate surfaces.
- [components](components): shared UI components for Southline, contractor dashboards, admin tooling, and real-estate modules.
- [lib](lib): core domain logic, store selection, auth, entitlements, schemas, content libraries, and service helpers.
- [drizzle](drizzle): SQL migrations and schema history.
- [tests](tests): targeted regression and feature tests for Southline, contractor modules, entitlements, and real-estate phases.
- [docs](docs): product and implementation documentation, including the real-estate phase documents.

## Public entry points

- [app/page.tsx](app/page.tsx): Southline homepage.
- [app/snaplink/page.tsx](app/snaplink/page.tsx): SnapLink marketing page.
- [app/book/page.tsx](app/book/page.tsx): booking experience entry point.
- [app/homes/page.tsx](app/homes/page.tsx): property marketplace listing page.
- [app/contractor-admin/page.tsx](app/contractor-admin/page.tsx): operator console.
- [app/southline/admin/page.tsx](app/southline/admin/page.tsx): Southline CMS.
- [app/real-estate/page.tsx](app/real-estate/page.tsx): real-estate dashboard landing page.

## Core platform modules

### Marketplace and public content
- [app/page.tsx](app/page.tsx)
- [components/southline/BookingFlow.tsx](components/southline/BookingFlow.tsx)
- [components/southline/FeaturedProfessionals.tsx](components/southline/FeaturedProfessionals.tsx)
- [components/southline/LocalDiscovery.tsx](components/southline/LocalDiscovery.tsx)
- [components/southline/FeaturedHomes.tsx](components/southline/FeaturedHomes.tsx)

### Contractor and professional domain
- [app/contractor-admin/[username]/page.tsx](app/contractor-admin/[username]/page.tsx)
- [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx)
- [app/api/contractor/leads/route.ts](app/api/contractor/leads/route.ts)
- [app/api/contractor/entitlements/route.ts](app/api/contractor/entitlements/route.ts)
- [app/api/contractor/campaigns/route.ts](app/api/contractor/campaigns/route.ts)
- [app/api/contractor/flipbook/campaigns/route.ts](app/api/contractor/flipbook/campaigns/route.ts)
- [app/api/contractor/invoices/route.ts](app/api/contractor/invoices/route.ts)
- [app/api/contractor/expenses/route.ts](app/api/contractor/expenses/route.ts)

### Real-estate domain
- [app/real-estate](app/real-estate)
- [app/api/real-estate/transactions/route.ts](app/api/real-estate/transactions/route.ts)
- [app/api/real-estate/properties/route.ts](app/api/real-estate/properties/route.ts)
- [app/api/real-estate/communications/route.ts](app/api/real-estate/communications/route.ts)
- [app/api/real-estate/marketplace/route.ts](app/api/real-estate/marketplace/route.ts)
- [lib/real-estate](lib/real-estate)

### Shared platform infrastructure
- [lib/auth.ts](lib/auth.ts)
- [lib/entitlements.ts](lib/entitlements.ts)
- [lib/store.ts](lib/store.ts)
- [lib/southline-store.ts](lib/southline-store.ts)
- [lib/db/schema.ts](lib/db/schema.ts)
