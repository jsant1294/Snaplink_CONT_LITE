# User Journeys

## Homeowner journey

### Path

Homepage → category/service → professional profile → inquiry/booking → lead delivery → professional response → estimate/appointment → payment → review

### Status

- Completed steps: homepage, service selection, booking flow, lead creation.
- Partial steps: professional response and review experience are not fully evidenced as a complete, branded workflow.
- Missing steps: payment and review are not clearly part of a complete end-to-end homeowner journey.
- Severity: Medium.

### Evidence

- [app/page.tsx](app/page.tsx)
- [components/southline/BookingFlow.tsx](components/southline/BookingFlow.tsx)
- [app/api/contractor/leads/route.ts](app/api/contractor/leads/route.ts)

## Contractor journey

### Path

Onboarding → profile creation → marketplace listing → lead received → lead managed → booking/job → invoice → payment → campaign → review

### Status

- Completed steps: profile access, lead intake, status management, and module entitlement controls are present.
- Partial steps: invoice/payment and campaign experiences are gated and not universally available.
- Missing steps: a polished review or retention loop is not clearly built out.
- Severity: Medium.

### Evidence

- [app/contractor-admin/page.tsx](app/contractor-admin/page.tsx)
- [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx)
- [app/api/contractor/entitlements/route.ts](app/api/contractor/entitlements/route.ts)

## Home buyer journey

### Path

Browse homes → property detail → agent profile → inquiry → showing request → lead assignment → showing → follow-up

### Status

- Completed steps: property browsing and property detail pages exist.
- Partial steps: showing requests and follow-up workflows are present in the real-estate schema and routes but are not clearly presented as a seamless buyer journey.
- Severity: Medium.

### Evidence

- [app/homes/page.tsx](app/homes/page.tsx)
- [app/homes/[slug]/page.tsx](app/homes/[slug]/page.tsx)
- [app/real-estate/transactions/page.tsx](app/real-estate/transactions/page.tsx)

## Real-estate agent journey

### Path

Profile → brokerage/office → leads → buyers and sellers → showings → transactions → tasks → analytics

### Status

- Completed steps: route and CRM structure are present.
- Partial steps: the experience is broad but not fully proven as a polished, ready-to-sell daily workflow.
- Severity: Medium.

### Evidence

- [app/real-estate/agents/page.tsx](app/real-estate/agents/page.tsx)
- [app/real-estate/transactions/page.tsx](app/real-estate/transactions/page.tsx)
- [app/real-estate/analytics/page.tsx](app/real-estate/analytics/page.tsx)

## Operator journey

### Path

Sign in → create profile → publish profile → enable modules → manage homepage → feature professionals → manage agents → monitor leads → manage entitlements → review activity

### Status

- Completed steps: operator console and CMS surfaces are clearly implemented.
- Partial steps: activity monitoring and full auditing are not fully described as a polished operational workflow.
- Severity: Low to Medium.

### Evidence

- [app/contractor-admin/page.tsx](app/contractor-admin/page.tsx)
- [app/southline/admin/page.tsx](app/southline/admin/page.tsx)
- [app/api/contractor/entitlements/route.ts](app/api/contractor/entitlements/route.ts)
