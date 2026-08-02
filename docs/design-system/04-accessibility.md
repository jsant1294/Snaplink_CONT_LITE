# Accessibility

## Improvements

- Primary and body text now use charcoal and forest instead of low-contrast tan/brown.
- Muted text was darkened to `#6F6A64` for practical small-text contrast.
- Gold text on light surfaces uses the dedicated darker `accent-gold-text` token.
- Hero copy uses white and linen over a stronger deep-forest overlay.
- Forms use visible borders, charcoal values, readable placeholders, and a two-part focus treatment.
- Buttons and standard form controls have a 44px minimum target height.
- Professional-card actions have explicit 44px targets and stronger visual separation.
- Footer supporting text moved from low-opacity beige to opaque linen.
- Motion-reduction behavior already present in interactive components was preserved.

## Contrast intent

Charcoal on ivory, forest on ivory, white on deep forest, and muted gray on ivory meet WCAG AA for normal text. Champagne gold remains a fill or a dark-surface accent; it is not used for body copy on light backgrounds.

Automated visual contrast scanning and keyboard walkthrough remain recommended once a browser automation backend is available.
