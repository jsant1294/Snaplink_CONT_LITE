# Image source (shipped default)

- **Unsplash source page**: https://unsplash.com/photos/Nldp5s4drz0
- **Photographer**: Klaudia ([@ku_kla](https://unsplash.com/@ku_kla)) — Copenhagen, Denmark
- **License**: Unsplash License (free to use, no attribution required; attribution given here as
  good practice)
- **Direct delivery URL (desktop, as shipped)**:
  `https://images.unsplash.com/photo-1672177789763-18c8d0a3ab7f?auto=format&fit=crop&w=1800&q=80`
- **Direct delivery URL (mobile, as shipped)**:
  `https://images.unsplash.com/photo-1672177789763-18c8d0a3ab7f?auto=format&fit=crop&w=1200&h=1000&q=80`
- **Verification**: page existence and image subject confirmed by fetching the photo page and
  downloading/viewing a preview render before use (not selected from a search result title
  alone). Delivery URL confirmed live via a direct HTTP request (`200 image/jpeg`) before being
  set as the default.

## Why this image

A narrow, string-lit outdoor dining alley in Copenhagen: multiple restaurant tables, people
dining and standing in conversation, warm early-evening light, string lights overhead, colorful
building facades. It reads as "lively local business district" without being a single isolated
restaurant or a literal collage of categories — matching the spec's "suggest several SnapLink
Local categories without becoming a literal collage" direction. No readable business names, no
third-party logos, no Airbnb branding, no obvious stock-photo staging. The top third (sky,
hanging string lights, tree branches) is comparatively empty, which works as negative space for
a `full-background` overlay/text panel if an operator switches layouts; the composition also
crops cleanly to a portrait/near-square mobile ratio without losing the seated figures that
carry the "neighborhood energy" read.

## Crop guidance

- **Desktop** (`image-left`/`image-right` split card or `full-background`): wide crop,
  `object-cover`, default focal point `center`. The alley runs roughly through the frame center,
  so `center` keeps both sides of tables in view at any panel width.
- **Mobile**: default focal point `center` on a taller (`w=1200&h=1000`, roughly 6:5) crop —
  keeps the nearest seated group in frame while still showing the string lights/architecture
  above.

## Alt text (as shipped)

- **EN**: "A warm neighborhood alley strung with lights, lined with restaurants and people
  dining outdoors"
- **ES**: "Un cálido callejón de vecindario con luces, restaurantes y personas cenando al aire
  libre"

## Replacing the image

Operators can swap the desktop/mobile image URLs, alt text, focal points, layout, and overlay
from **Southline Admin → Homepage → SnapLink Local Promo**. Any `https://` URL is accepted (the
existing `ImageField` component also supports uploading a file directly, which is stored via
Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured, or embedded as a data URL otherwise) —
no code change or redeploy is required to change the photo.
