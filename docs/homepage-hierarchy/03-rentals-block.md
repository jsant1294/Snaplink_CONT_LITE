# Featured Rentals Block

`FeaturedRentals` is a bilingual, image-led homepage section using `listPublishedRentalsWithFallback()` and the existing `Property` model. It does not create a store, fixtures, route, pricing claim, availability claim, or booking behavior.

Cards use the canonical `/homes/[slug]` property detail route already used by the rentals landing page. The section destination is `/rentals`. Cards show image, rental/getaway badge, title, location, short description, and view-property action. An empty inventory produces bilingual, non-transactional fallback copy.

CMS-selected IDs are ordered first when present; remaining published rentals fill available positions. The configured count is clamped to one through four.
