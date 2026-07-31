import type { SeasonalContent } from "./southline-types";

export function isSeasonalActive(
  content: SeasonalContent | undefined,
  now: Date = new Date()
): boolean {
  if (!content) return true;
  if (content.enabled === false) return false;
  if (content.startAt) {
    const start = new Date(content.startAt).getTime();
    if (!Number.isNaN(start) && now.getTime() < start) return false;
  }
  if (content.endAt) {
    const end = new Date(content.endAt).getTime();
    if (!Number.isNaN(end) && now.getTime() > end) return false;
  }
  return true;
}
