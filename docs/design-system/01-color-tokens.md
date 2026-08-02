# Color Tokens

Tokens are declared in `app/globals.css` and exposed to Tailwind in `tailwind.config.ts`. RGB channel aliases support Tailwind opacity modifiers without duplicating values.

| Semantic token | Value | Use |
| --- | --- | --- |
| `page` / `--sl-page` | `#D8D6D0` | Canonical architectural-gray public canvas |
| `section` / `--sl-section` | `#D8D6D0` | Canonical section canvas; intentionally identical to `page` |
| `surface` / `--sl-surface` | `#F6F3ED` | Elevated ivory cards, forms, chips, and navigation |
| `surface-soft` / `--sl-surface-soft` | `#E7E4DE` | Optional secondary surface for true nested hierarchy or hover feedback |
| `surface-raised` | `#F6F3ED` | Compatibility alias for `surface`; do not use to alternate section bands |
| `border-default` | `#AAA79F` | Architectural-stone dividers and form borders |
| `primary` | `#202020` | Headlines and input text |
| `secondary` | `#3F5C4A` | Body, navigation, and links |
| `text-muted` / `--sl-muted` | `#59615A` | WCAG-oriented helper, metadata, and secondary small text |
| `accent-gold` / `--sl-gold` | `#B88A2E` | Premium button fills and larger decorative accents |
| `accent-gold-text` / `--sl-gold-strong` | `#9E7423` | Strong gold expression on light surfaces |
| `eyebrow` / `--sl-eyebrow` | `#9E7423` | Small uppercase editorial labels |
| `--sl-divider` | `rgba(158, 116, 35, 0.72)` | Architectural section rules and monogram outline |
| `accent-green` | `#758A72` | Badges and quiet green emphasis |
| `accent-dark` | `#2F4738` | Secondary actions, overlays, footer |
| `on-dark` | `#FFFDF9` | Primary text on dark surfaces |
| `on-dark-muted` | `#E8E1D7` | Supporting text on dark surfaces |
| `state-error` | `#A24E45` | Errors |
| `state-success` | `#55725C` | Success states |

## Legacy replacement map

| Previous usage | Replacement |
| --- | --- |
| former page `#D8D3CA` | `page` / `section` → `#D8D6D0` |
| former structural surface `#CBC7BE` and `bg-surface/65` section bands | `page` / `section` → `#D8D6D0` |
| former raised surface `#F6F2EA` | `surface` / `surface-raised` → `#F6F3ED` |
| page-to-surface gradients | flat `page` → `#D8D6D0` |
| cream / `#EEE7DA` / `#F1EADF` on public Southline canvases | `page` |
| paper / ivory / `#E4DACB` / `#DDD1C0` used as public section backgrounds | `page` |
| white / `#F5EFE4` form and card surfaces | `surface` |
| walnut / `#2F2923` text | `primary` |
| clay / taupe / brown body copy | `secondary` or `text-muted` by hierarchy |
| sand / walnut translucent borders | `border-default` |
| olive / sage accents | `accent-green` |
| obsidian consumer actions | `accent-dark` |
| gold / goldlight | `accent-gold` or `accent-gold-text` by background |
| one-off brown image gradients | `image-overlay` and `accent-dark` |

Legacy material-name tokens remain available only for out-of-scope SnapLink/admin surfaces. New Southline code must use semantic names.
