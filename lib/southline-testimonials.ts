import type { SouthlineTestimonialItem, SouthlineTestimonialsContent } from "./southline-types";

/** Visible testimonials in display order: enabled-only, sorted by sortOrder.
 *  Returns [] when the content or item list is missing so callers can hide the
 *  section entirely (Southline has no curated testimonials until an operator
 *  adds them, and it never fabricates reviews). */
export function visibleTestimonials(
  content: SouthlineTestimonialsContent | undefined
): SouthlineTestimonialItem[] {
  if (!content?.items) return [];
  return content.items
    .filter((item) => item.enabled !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
