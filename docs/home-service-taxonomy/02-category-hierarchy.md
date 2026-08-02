# 02 — Category Hierarchy

Status: Phase 4 — complete.

Three levels: **Group** (22) → **Category** (21) → **Specialty** (59).

## Groups (top-level)

```
Construction & Remodeling   Exterior                 Roofing
Plumbing                    Electrical               HVAC
Landscaping & Outdoor Living Pools & Spas            Cleaning
Pest & Environmental        Inspection & Testing     Architecture & Design
Real Estate                 Property Management      Moving & Storage
Security & Smart Home       Energy & Utilities       Accessibility & Senior Living
Insurance, Finance & Legal  Photography & Media      Rentals & Getaways
Specialty Home Services
```

Groups with **no live category today** (valid parents for future/seed work, present so
the taxonomy "can represent" them): `exterior`, `cleaning`, `pest-environmental`,
`moving-storage`, `security-smart-home`, `accessibility-senior`,
`rentals-getaways`.

## Categories (21) by group

**Construction & Remodeling**
- `remodeling` (Remodeling & Interior / Remodelación e Interiores) — both
- `paint_drywall` (Painting & Drywall / Pintura y Tablaroca) — contractor
- `flooring` (Flooring / Pisos) — contractor
- `concrete` (Concrete & Masonry / Concreto y Albañilería) — contractor

**Roofing**
- `roof_exterior` (Roofing & Exterior / Techos y Exterior) — contractor

**Plumbing / Electrical / HVAC**
- `plumbing`, `electrical`, `hvac` — contractor

**Landscaping & Outdoor Living**
- `outdoor` (Outdoor & Landscape / Exteriores y Jardín) — contractor

**Specialty Home Services**
- `handyman` (Handyman & General / Reparaciones Generales) — contractor

**Pools & Spas**
- `pools` (Pools & Spas / Piscinas y Spas) — contractor

**Inspection & Testing**
- `home-inspections` (Home Inspections / Inspección de Casas) — **both**
- `appraisals` (Appraisals / Avalúos) — professional
- `surveying` (Surveying / Agrimensura) — professional

**Architecture & Design**
- `architecture-design` (Architecture / Arquitectura) — contractor
- `interior-design` (Interior Design / Diseño de Interiores) — contractor

**Energy & Utilities**
- `solar` (Solar / Energía Solar) — contractor

**Photography & Media**
- `photography` (Photography / Fotografía) — **both**

**Real Estate**
- `real-estate` (Real Estate / Bienes Raíces) — professional

**Insurance, Finance & Legal**
- `mortgage-financing` (Mortgage & Financing / Hipotecas y Financiamiento) — professional

**Property Management**
- `property-management` (Property Management / Administración de Propiedades) — professional

## Mapping decisions

- **`roof_exterior` → group `roofing`.** The category spans roofing + exterior services
  (gutters, siding, windows, doors, garage door, pressure washing). It is anchored on
  the `roofing` group because roofing is its flagship trade (and the shipped search
  fixture is Ace Roofing). The `exterior` group stays available for a future split.
- **`concrete` → `construction-remodeling`**, **`handyman` → `specialty`**,
  **`outdoor` → `landscaping-outdoor`** — chosen parent groups; ids unchanged.
- **Professional categories** are derived from real profession types
  (`PROFESSION_TYPES` + `LICENSED_PROFESSION_TYPES`); none are invented.

## Audience semantics

- `contractor` — providers primarily live on the contractor surface
  (`contractors` table / `/contractor/{username}`).
- `professional` — providers primarily live on the agent surface
  (`agent_profiles` / `/agents/{slug}`).
- `both` — currently served from both surfaces (`home-inspections`, `photography`).

## Specialties (59)

`HOME_SERVICE_SPECIALTIES` preserves all 59 `SERVICE_LIBRARY` entries 1:1 (id = EN
name, `labelEs` = `es`). Each is parented to its existing `SERVICE_CATEGORIES`
category — e.g. `Roofing`, `Gutters & Downspouts` → `roof_exterior`;
`Kitchen Remodel`, `Bathroom Remodel` → `remodeling`. This keeps lead-stored values
stable while giving search a full bilingual surface.
