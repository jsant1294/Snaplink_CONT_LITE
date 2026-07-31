import { t, type Lang } from "@/lib/southline-i18n";

const PROMPT_KEYS = [
  "lucioPromptFindHome",
  "lucioPromptFindPro",
  "lucioPromptPlanProject",
  "lucioPromptCostEstimate",
  "lucioPromptDiyHelp",
  "lucioPromptBook",
] as const;

// Shown until the first message is sent — never a blank chat screen.
export default function GuidedPrompts({
  lang,
  onSelect,
}: {
  lang: Lang;
  onSelect: (prompt: string, flow: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {PROMPT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(t(key, lang), key)}
          className="rounded-xl border border-walnut/20 bg-cream px-4 py-2.5 text-left text-sm text-walnut transition-colors hover:border-gold/50 hover:bg-sand/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          {t(key, lang)}
        </button>
      ))}
    </div>
  );
}
