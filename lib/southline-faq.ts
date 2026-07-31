import type { SouthlineFaqContent, SouthlineFaqItem } from "./southline-types";

export function visibleFaqItems(content: SouthlineFaqContent | undefined): SouthlineFaqItem[] {
  if (!content) return [];
  return content.items
    .filter((item) => item.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
