# 04 — Inquiry & Lead Flow (Rentals)

> **Slice:** Big Pickle — Rentals & Getaways Takeover. **Status:** Analysis.

## 1. How inquiries work today (as-built, verified)

| Surface | Mechanism | Persisted where |
| --- | --- | --- |
| `/homes/[slug]` contact agent | `mailto:` link | nowhere (client email) |
| `/homes/[slug]` request showing | `mailto:` link | nowhere (client email) |
| `/book` consultation | `BookingFlow` POST `/api/contractor/leads` | contractor lead pipeline (`contractor_leads`) |
| `/planner` project form | POST `/api/contractor/leads` | contractor lead pipeline |
| Agent profile contact | agent-profiles events API (`contact_click`, `lead_submitted`, …) | `agent_profile_events` |
| Public property → CRM lead | **does not exist** | — |
| CRM leads/showings/calendar/appointments | internal-only (`/real-estate/*`, `real_estate_leads` etc.) | real-estate CRM |

Key finding: **no public property page writes a lead into the real-estate CRM.**
The `/homes/[slug]` detail page uses `mailto:` only, and `/book` funnels into
the contractor-lead pipeline instead of `real_estate_leads`.

## 2. Design for the `/rentals` slice

Keep the existing behavior — do not introduce a new persistence path in a
limited slice:

1. **Rental cards** on `/rentals` link to the existing `/homes/[slug]` detail
   page (see 03 §3.1), which already provides the agent's `mailto:` contact +
   showing request. That means rentals inherit the exact same (non-persisting)
   inquiry behavior as sale homes — consistent, and honest about current limits.
2. **No new API route** for rental inquiries in this slice.
3. Agent availability for a rental is shown by the detail page's
   `listing_agent_id` → `demoAgents` lookup, exactly as sale homes.

## 3. Gaps this slice documents but does not fix

- No server-side lead capture on any property detail page (sale or rental).
- No routing of public property inquiries into `real_estate_leads` (the CRM
  leads surface is internal-only).
- No distinction between "request to rent" and "schedule a showing".

## 4. Recommended next phase (deferred)

A future slice would add a property-inquiry endpoint that:

- Accepts `{ propertyId/slug, name, email, phone, message, intent }` from
  `/homes/[slug]` and `/rentals`.
- Creates a `real_estate_leads` row (`lead_type = "rental"` or `"buyer"`,
  `source = "property_page"`) assigned to the listing agent.
- Optionally mirrors into the contractor-lead pipeline for operator visibility,
  matching the `/book` precedent.

This is tracked in docs 08 (roadmap) and intentionally out of scope here.
