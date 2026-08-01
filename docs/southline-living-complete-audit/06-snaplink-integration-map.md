# SnapLink Integration Map

## Overall classification

SnapLink is best understood as a shared platform layer for the Southline Living ecosystem rather than as a single isolated feature.

## Evidence of shared usage

- The public homepage uses SnapLink branding and messaging in [app/page.tsx](app/page.tsx).
- The dedicated SnapLink page exists at [app/snaplink/page.tsx](app/snaplink/page.tsx).
- Contractor/admin experiences use the SnapLink PIN and contractor identity model in [lib/auth.ts](lib/auth.ts) and [components/admin/Dashboard.tsx](components/admin/Dashboard.tsx).
- The entitlements system is shared across contractor modules in [lib/entitlements.ts](lib/entitlements.ts).

## Integration classification

| Connection | Classification | Evidence |
| --- | --- | --- |
| Platform identity | Fully shared | [app/page.tsx](app/page.tsx), [app/snaplink/page.tsx](app/snaplink/page.tsx) |
| Contractor workspace | Partially shared | [app/contractor-admin/[username]/page.tsx](app/contractor-admin/[username]/page.tsx) |
| Lead system | Partially shared | [app/api/contractor/leads/route.ts](app/api/contractor/leads/route.ts) |
| Entitlements | Fully shared | [lib/entitlements.ts](lib/entitlements.ts) |
| Booking | Partially shared | [components/southline/BookingFlow.tsx](components/southline/BookingFlow.tsx) |
| Invoices / billing | Linked / partially shared | [app/api/contractor/invoices/route.ts](app/api/contractor/invoices/route.ts) |
| Real-estate operations | Linked only | [app/real-estate](app/real-estate) |

## Direct answers

1. Is SnapLink truly the engine behind Southline Living? Partially yes. It is the shared product and platform identity, but the repository still shows some modules that are linked rather than fully unified.
2. Which modules are shared? Contractor profiles, leads, entitlements, CMS content, and the public Southline narrative are shared or at least centrally coordinated.
3. Which modules are duplicated? Some real-estate and contractor functions appear to be implemented in parallel domain layers rather than through one shared engine.
4. Which modules are only linked? Real-estate and billing features appear more as adjacent platform capabilities than fully unified modules.
5. Can a SnapLink profile appear in Southline Living automatically? The repository indicates profile-driven content and public contractor surfaces, so the intent is there, but the evidence is not enough to claim seamless automation across all cases.
6. Can a Southline Living lead enter SnapLink workflows? The booking flow creates a contractor lead through the shared lead API, so there is a clear path.
7. Are booking, invoices, payments, reviews, and analytics shared? Booking and payments are partly shared; invoices and analytics are present but more module-specific and gated.
8. Are subscriptions and entitlements shared? Yes, entitlements are clearly shared through the module system.
9. Are roles and identities shared? The PIN-based contractor/operator auth layer is shared, but it is still relatively lightweight rather than a full enterprise identity layer.
10. What technical work is still needed? The platform needs more seamless cross-module data flows, stronger role/tenant abstraction, and more complete product unification between Southline, contractor workspaces, and real-estate capabilities.
