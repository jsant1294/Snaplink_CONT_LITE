# Shared Intake Model

`lib/professional-intake/types.ts` defines one engine shared by both identity systems.

```ts
export type IntakeOwnerType = "contractor" | "agent";

export interface IntakeQuestion {
  id: string;
  step: number;
  type: "text" | "textarea" | "select" | "multiselect" | "phone" | "email" | "url" | "boolean" | "image";
  labelEn: string;
  labelEs: string;
  helpEn?: string;
  helpEs?: string;
  required: boolean;
  ownerTypes?: IntakeOwnerType[];
  professionTypes?: string[];
  categoryIds?: string[];
  options?: IntakeQuestionOption[];
  profileTargets?: string[];
  maxLength?: number;
  maxItems?: number;
}

export type IntakeAnswers = Record<string, unknown>;
export type IntakeSessionStatus = "not_started" | "in_progress" | "completed" | "applied" | "archived";
export type ProfileApplyMode = "fill_empty" | "replace_selected" | "replace_all";
```

Differences from the spec's suggested shape: `IntakeAudience` was renamed `IntakeOwnerType` (`"contractor" | "agent"`, not `"contractor" | "professional"`) to match this repo's own vocabulary exactly — `lib/agent-profiles/*` already calls the licensed-professional identity system "agent," never "professional" (see `AgentProfile`, `agentProfileStore`, `/agents/[slug]`). Reusing that name avoids introducing a second word for the same thing.

## Engine modules

| Module | Responsibility |
|---|---|
| `questions.ts` | The question registry + `getQuestionsFor(ownerType, professionType)` |
| `normalize.ts` | Trims, validates, and normalizes raw answers; flags (never guesses) unknown values |
| `profile-map.ts` | Two explicit adapters: `buildContractorPatch()`, `buildAgentPatch()` |
| `generate-copy.ts` | Deterministic public copy + a separate operator-only notes generator |
| `apply.ts` | Review preview + apply-mode resolution (`fill_empty` / `replace_selected` / `replace_all`) |
| `auth.ts` | PIN-based authorization reusing `lib/auth.ts` / `lib/agent-profiles/auth.ts` |
| `store-json.ts` / `store-pg.ts` | Session persistence (draft/resume), wired into `lib/store.ts` as `intakeSessionStore` |

Nothing in this engine imports or writes to a contractor/agent row directly except the two `buildXPatch()` functions, which only *compute* a patch — writing it is exclusively the apply API route's job, and only for an operator request.
