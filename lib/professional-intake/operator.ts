// ---------------------------------------------------------------------------
// Professional Intake — operator command-center helpers.
// Pure / store-free so the classification and filters are unit-testable and
// shared by the operator API route and (indirectly) the IntakeCenter UI.
// ---------------------------------------------------------------------------

import type { IntakeSession } from "./types.ts";

export const IMAGE_QUESTION_IDS = ["profilePhoto", "coverPhoto", "galleryPhotos"] as const;

export interface IntakeAssetCompleteness {
  needsAssets: boolean;
  completedImageAnswers: string[];
  missingImageAnswers: string[];
}

/** Which of the step-14 image questions have a non-empty answer. */
export function intakeAssetCompleteness(session: Pick<IntakeSession, "answers">): IntakeAssetCompleteness {
  const completed = IMAGE_QUESTION_IDS.filter((id) => {
    const v = session.answers[id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
  const missing = IMAGE_QUESTION_IDS.filter((id) => !completed.includes(id));
  return { needsAssets: missing.length > 0, completedImageAnswers: [...completed], missingImageAnswers: [...missing] };
}

export type IntakeFilterBucket = "All" | "New" | "In Progress" | "Needs Assets" | "Ready" | "Completed";

/**
 * Operator-facing bucket for a raw intake session. Reflects stored state and
 * NEVER over-claims: needs assets is derived from the presence of image-step
 * answers; "Ready" only when completed AND not missing assets; "Completed"
 * only when actually applied to the live profile.
 */
export function intakeSessionFilter(session: Pick<IntakeSession, "status" | "answers">): IntakeFilterBucket {
  const { needsAssets } = intakeAssetCompleteness(session);
  switch (session.status) {
    case "applied":
      return "Completed";
    case "completed":
      return needsAssets ? "Needs Assets" : "Ready";
    case "in_progress":
      return needsAssets ? "Needs Assets" : "In Progress";
    case "not_started":
      return "New";
    default:
      return "In Progress";
  }
}
