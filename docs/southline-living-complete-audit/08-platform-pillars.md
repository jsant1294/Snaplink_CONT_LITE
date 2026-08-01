# Platform Pillars

## 1. Public discovery

This pillar is supported by the homepage, local discovery, featured professionals, featured homes, booking flows, and service-based content.

Evidence:
- [app/page.tsx](app/page.tsx)
- [components/southline/LocalDiscovery.tsx](components/southline/LocalDiscovery.tsx)
- [components/southline/FeaturedProfessionals.tsx](components/southline/FeaturedProfessionals.tsx)

## 2. Professional operations

This pillar is supported by contractor dashboards, lead management, AI summaries, payments, and module entitlements.

Evidence:
- [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx)
- [app/api/contractor/leads/route.ts](app/api/contractor/leads/route.ts)
- [app/api/contractor/entitlements/route.ts](app/api/contractor/entitlements/route.ts)

## 3. Content and CMS control

This pillar is supported by the Southline CMS and operator tooling for homepage management, FAQ, testimonials, SEO, and feature flags.

Evidence:
- [app/southline/admin/page.tsx](app/southline/admin/page.tsx)
- [components/southline/admin/HomepageEditor.tsx](components/southline/admin/HomepageEditor.tsx)
- [components/southline/admin/SeoEditor.tsx](components/southline/admin/SeoEditor.tsx)

## 4. Real-estate operations

This pillar is supported by a broad set of real-estate CRM and operations routes and schema objects.

Evidence:
- [app/real-estate](app/real-estate)
- [lib/db/schema.ts](lib/db/schema.ts)

## 5. Platform monetization

This pillar is supported by module entitlements and billing-related infrastructure, even if not all modules are fully open.

Evidence:
- [lib/entitlement-types.ts](lib/entitlement-types.ts)
- [app/api/contractor/invoices/route.ts](app/api/contractor/invoices/route.ts)
- [app/api/contractor/payments/route.ts](app/api/contractor/payments/route.ts)
