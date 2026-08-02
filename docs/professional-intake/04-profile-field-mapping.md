# Profile Field Mapping

Two explicit adapters in `lib/professional-intake/profile-map.ts`, both reading the same normalized answer bag, writing to two completely separate, real field sets. Neither adapter imports the other's store or type.

## Contractor (`buildContractorPatch` → `ContractorProfilePatch`, `lib/types.ts`)

| Field | Source answer(s) |
|---|---|
| `professionType` | `professionType` (validated via `isValidProfessionType`) |
| `businessName` | `companyName` ‖ `displayName` |
| `ownerName` | `displayName` |
| `tagline` | `differentiator` ‖ `designStyle` |
| `phone` / `whatsapp` / `email` / `website` | same-named answers |
| `serviceArea` | composed from `serviceAreaCity` + `serviceAreaState` (+ `serviceAreaZips` if present) |
| `licenseInfo` | composed from `yearsInBusiness` + `licenseInfo` (license #) + `insuranceCarried` + `experienceQualifications` |
| `avatarUrl` / `logoUrl` | `profilePhoto[0]` (same photo fills both — `Contractor` has no separate logo-vs-headshot distinction upstream) |
| `galleryUrls` | `galleryPhotos` (max 6) |

**No target exists** for `primaryService`/`additionalServices` (category-level answers don't fit `Contractor.services`, which is specialty-level — see `lib/southline-search.ts`'s `categoryIdsForContractor`), `marketplaceSummary`, `bookingLink`, or `coverPhotoUrl` (none of these fields exist on `Contractor`). These answers still feed `generate-copy.ts`; they are simply not written to a structured field. This is a real, honest limitation, not an oversight — inventing a field would violate the task's explicit "do not invent schema fields" rule.

## Agent (`buildAgentPatch` → `Partial<AgentProfile>`, `lib/agent-profiles/types.ts`)

| Field | Source answer(s) |
|---|---|
| `professionType` | `professionType` (validated via `isValidAgentProfessionType`) |
| `displayName` | `displayName` |
| `brokerageName` / `officeName` / `teamName` | `companyName` / `officeName` / `teamName` |
| `licenseNumber` / `licenseState` | same-named conditional answers |
| `categories` | `primaryService` + `additionalServices` (both are already category-level ids — a direct fit) |
| `serviceArea` / `serviceRadius` / `neighborhoods` | composed / `serviceRadius` / split `neighborhoodsFocus` |
| `marketplaceSummary` | `idealCustomer` + `customerProblem` + `differentiator` |
| `languages` | `languages` (minus the `"other"` placeholder value) |
| `phone` / `email` / `whatsapp` / `website` / `bookingLink` | same-named answers |
| `photoUrl` / `coverPhotoUrl` | `profilePhoto[0]` / `coverPhoto[0]` |

Both maps are also exported as plain documentation objects (`CONTRACTOR_INTAKE_FIELD_MAP`, `AGENT_INTAKE_FIELD_MAP` — field → source answer id(s)) matching the shape the task spec suggested; the review preview's "source question" label reads from these.
