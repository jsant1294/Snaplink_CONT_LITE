# Module Inventory

## Public marketplace

| Module | Evidence | Status |
| --- | --- | --- |
| Homepage | [app/page.tsx](app/page.tsx) | Functional but incomplete |
| Marketplace discovery | [app/homes/page.tsx](app/homes/page.tsx) | Functional but incomplete |
| Service categories | [lib/services.ts](lib/services.ts) | Functional |
| Local discovery | [components/southline/LocalDiscovery.tsx](components/southline/LocalDiscovery.tsx) | Functional |
| Featured professionals | [components/southline/FeaturedProfessionals.tsx](components/southline/FeaturedProfessionals.tsx) | Functional |
| Professional profiles | [app/contractor-admin/[username]/page.tsx](app/contractor-admin/[username]/page.tsx) | Functional but incomplete |
| Contractor profiles | [app/contractor-admin/[username]/page.tsx](app/contractor-admin/[username]/page.tsx) | Functional |
| Agent profiles | [app/real-estate/agents/page.tsx](app/real-estate/agents/page.tsx) | Partially implemented |
| Property listings | [app/homes/page.tsx](app/homes/page.tsx) | Functional |
| Property pages | [app/homes/[slug]/page.tsx](app/homes/[slug]/page.tsx) | Functional |
| Search and filtering | [app/homes/page.tsx](app/homes/page.tsx) | Functional |
| Contact actions | [components/southline/BookingFlow.tsx](components/southline/BookingFlow.tsx) | Functional |
| Quote requests | [components/southline/BookingFlow.tsx](components/southline/BookingFlow.tsx) | Functional |
| Consultation requests | [app/book/page.tsx](app/book/page.tsx) | Functional |
| Booking entry points | [components/southline/EstimatorBookingSection.tsx](components/southline/EstimatorBookingSection.tsx) | Functional |
| Reviews | Not clearly evidenced as a working product feature | Placeholder / unclear |
| Testimonials | [components/southline/TestimonialsSection.tsx](components/southline/TestimonialsSection.tsx) | Functional but content-light |
| Trust signals | [app/snaplink/page.tsx](app/snaplink/page.tsx) | Functional |
| Recruitment | [components/southline/BecomeAProfessionalSection.tsx](components/southline/BecomeAProfessionalSection.tsx) | Functional |
| Homeowner content | [app/page.tsx](app/page.tsx) | Functional |

## Contractor and professional platform

| Module | Evidence | Status |
| --- | --- | --- |
| Contractor onboarding | [app/contractor-admin/page.tsx](app/contractor-admin/page.tsx) and [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx) | Functional but incomplete |
| Contractor workspace | [app/contractor-admin/[username]/page.tsx](app/contractor-admin/[username]/page.tsx) | Functional |
| Lead board | [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx) | Functional |
| Lead status management | [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx) | Functional |
| AI summaries | [app/api/contractor/ai-summary/route.ts](app/api/contractor/ai-summary/route.ts) | Functional |
| Payments | [app/api/contractor/payments/route.ts](app/api/contractor/payments/route.ts) | Functional |
| Services | [lib/services.ts](lib/services.ts) | Functional |
| Booking | [app/book/page.tsx](app/book/page.tsx) | Functional |
| Campaigns | [app/api/contractor/campaigns/route.ts](app/api/contractor/campaigns/route.ts) | Hidden behind entitlement |
| Flipbooks | [app/api/contractor/flipbook/campaigns/route.ts](app/api/contractor/flipbook/campaigns/route.ts) | Hidden behind entitlement |
| Mini campaigns | [app/api/contractor/campaigns/route.ts](app/api/contractor/campaigns/route.ts) | Hidden behind entitlement |
| Invoices | [app/api/contractor/invoices/route.ts](app/api/contractor/invoices/route.ts) | Hidden behind entitlement and environment dependency |
| Money | [app/api/contractor/expenses/route.ts](app/api/contractor/expenses/route.ts) | Hidden behind entitlement |
| Profile publishing | [app/contractor-admin/page.tsx](app/contractor-admin/page.tsx) | Functional |
| Module entitlements | [lib/entitlements.ts](lib/entitlements.ts) | Functional |
| Language switching | [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx) | Functional |
| Customer records | [app/api/contractor/leads/route.ts](app/api/contractor/leads/route.ts) | Functional |
| Analytics | [app/api/real-estate/analytics/summary/route.ts](app/api/real-estate/analytics/summary/route.ts) | Partially implemented |

## Southline CMS and operator tools

| Module | Evidence | Status |
| --- | --- | --- |
| Homepage editor | [components/southline/admin/HomepageEditor.tsx](components/southline/admin/HomepageEditor.tsx) | Functional |
| Hero editor | [components/southline/admin/HomepageEditor.tsx](components/southline/admin/HomepageEditor.tsx) | Functional |
| Featured professionals | [components/southline/admin/FeaturedProsPicker.tsx](components/southline/admin/FeaturedProsPicker.tsx) | Functional |
| Featured properties | [components/southline/admin/RealEstateBlockEditor.tsx](components/southline/admin/RealEstateBlockEditor.tsx) | Functional |
| Real-estate block | [components/southline/admin/RealEstateBlockEditor.tsx](components/southline/admin/RealEstateBlockEditor.tsx) | Functional |
| DIY content | [components/southline/admin/DiyEditor.tsx](components/southline/admin/DiyEditor.tsx) | Functional |
| FAQ | [components/southline/admin/FaqEditor.tsx](components/southline/admin/FaqEditor.tsx) | Functional |
| Testimonials | [components/southline/admin/TestimonialsEditor.tsx](components/southline/admin/TestimonialsEditor.tsx) | Functional |
| Footer/contact | [components/southline/admin/FooterEditor.tsx](components/southline/admin/FooterEditor.tsx), [components/southline/admin/ContactEditor.tsx](components/southline/admin/ContactEditor.tsx) | Functional |
| SEO | [components/southline/admin/SeoEditor.tsx](components/southline/admin/SeoEditor.tsx) | Functional |
| Feature flags | [components/southline/admin/FeatureFlagPanel.tsx](components/southline/admin/FeatureFlagPanel.tsx) | Functional |
| Agent profiles | [components/southline/admin/AgentProfilesPanel.tsx](components/southline/admin/AgentProfilesPanel.tsx) | Functional |
| Contractor profiles | [app/contractor-admin/page.tsx](app/contractor-admin/page.tsx) | Functional |
| Module enablement | [app/api/contractor/entitlements/route.ts](app/api/contractor/entitlements/route.ts) | Functional |
| Media management | [app/api/southline/upload/route.ts](app/api/southline/upload/route.ts) | Functional |
| Preview/draft/scheduling/versioning/rollback | Not clearly evidenced as a complete system | Missing / unclear |

## Real-estate

| Module | Evidence | Status |
| --- | --- | --- |
| Agents | [app/real-estate/agents/page.tsx](app/real-estate/agents/page.tsx) | Functional |
| Brokerages | [app/real-estate/brokerages/page.tsx](app/real-estate/brokerages/page.tsx) | Functional |
| Buyers | [app/real-estate/buyers/page.tsx](app/real-estate/buyers/page.tsx) | Functional |
| Sellers | [app/real-estate/sellers/page.tsx](app/real-estate/sellers/page.tsx) | Functional |
| Leads | [app/real-estate/leads/page.tsx](app/real-estate/leads/page.tsx) | Functional |
| Transactions | [app/real-estate/transactions/page.tsx](app/real-estate/transactions/page.tsx) | Functional |
| Properties | [app/real-estate/properties/page.tsx](app/real-estate/properties/page.tsx) | Functional |
| Showings | [app/real-estate/showings/page.tsx](app/real-estate/showings/page.tsx) | Functional |
| Open houses | [app/real-estate/open-houses/page.tsx](app/real-estate/open-houses/page.tsx) | Functional |
| Communications | [app/real-estate/communications/page.tsx](app/real-estate/communications/page.tsx) | Functional |
| Campaigns | [app/real-estate/campaigns/page.tsx](app/real-estate/campaigns/page.tsx) | Functional |
| Reminders/tasks/notes | [app/real-estate/tasks/page.tsx](app/real-estate/tasks/page.tsx) | Functional |
| Reports/analytics | [app/real-estate/analytics/page.tsx](app/real-estate/analytics/page.tsx) | Functional |
| Marketplace/MLS/IDX/OAuth | [app/api/real-estate/marketplace/route.ts](app/api/real-estate/marketplace/route.ts) and [docs/REAL_ESTATE_PHASE_10_MARKETPLACE.md](docs/REAL_ESTATE_PHASE_10_MARKETPLACE.md) | Partially implemented |
| White-label/billing | [docs/REAL_ESTATE_PHASE_11_OAUTH_BILLING.md](docs/REAL_ESTATE_PHASE_11_OAUTH_BILLING.md) | Partially implemented |
