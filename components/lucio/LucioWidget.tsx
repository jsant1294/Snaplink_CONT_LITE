"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { t, type Lang } from "@/lib/southline-i18n";
import GuidedPrompts from "./GuidedPrompts";
import LeadConfirmCard, { type LeadProposal } from "./LeadConfirmCard";
import {
  closeLucioWidget,
  openLucioWidget,
  getLucioSessionId,
  getLucioWidgetSnapshot,
  subscribeLucioWidget,
} from "@/lib/lucio/widget-state";

export interface LucioPageContext {
  type: "home" | "property" | "contractor" | "diy" | "planner" | "book" | "rentals";
  ref?: string;
}

function trackEvent(eventType: string, extra?: Record<string, unknown>) {
  fetch("/api/lucio/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, sessionId: getLucioSessionId(), ...extra }),
  }).catch(() => {});
}

export default function LucioWidget({ lang, pageContext }: { lang: Lang; pageContext?: LucioPageContext }) {
  const isOpen = useSyncExternalStore(subscribeLucioWidget, getLucioWidgetSnapshot, () => false);
  const [input, setInput] = useState("");
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/lucio/chat",
      body: {
        pageContext,
        lang,
        sessionId: getLucioSessionId(),
      },
    }),
  });

  useEffect(() => {
    if (isOpen && !hasOpenedOnce) {
      setHasOpenedOnce(true);
      trackEvent("widget_opened", { pageType: pageContext?.type, pageRef: pageContext?.ref });
    }
  }, [isOpen, hasOpenedOnce, pageContext]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openLucioWidget}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-obsidian px-5 py-3 text-sm font-semibold text-cream shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
      >
        <span className="font-display text-gold">{t("lucioName", lang)}</span>
        <span className="hidden sm:inline">{t("startPlanningWithLucio", lang)}</span>
      </button>
    );
  }

  function onGuidedSelect(prompt: string, flow: string) {
    trackEvent("flow_selected", { pageType: pageContext?.type, pageRef: pageContext?.ref, metadata: { flow } });
    sendMessage({ text: prompt });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-walnut/15 bg-ivory shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between bg-obsidian px-4 py-3">
        <div>
          <p className="font-display text-base text-gold">{t("lucioName", lang)}</p>
          <p className="text-[11px] text-cream/60">{t("lucioTagline", lang)}</p>
        </div>
        <button type="button" onClick={closeLucioWidget} aria-label={t("lucioClose", lang)} className="text-cream/60 hover:text-cream">
          X
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <>
            <p className="mb-4 text-sm text-walnut/80">{t("lucioWelcome", lang)}</p>
            <GuidedPrompts lang={lang} onSelect={onGuidedSelect} />
          </>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "self-end" : "self-start"}>
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p
                      key={i}
                      className={
                        message.role === "user"
                          ? "rounded-xl bg-obsidian px-3.5 py-2 text-sm text-cream"
                          : "rounded-xl bg-cream px-3.5 py-2 text-sm text-walnut"
                      }
                    >
                      {part.text}
                    </p>
                  );
                }
                if (part.type === "tool-proposeLeadOrBooking" && part.state === "output-available") {
                  return <LeadConfirmCard key={i} lang={lang} proposal={part.output as LeadProposal} />;
                }
                return null;
              })}
            </div>
          ))}
          {status === "submitted" || status === "streaming" ? (
            <p className="text-xs text-walnut/50">{t("lucioName", lang)}…</p>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-walnut/15 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("lucioInputPlaceholder", lang)}
          disabled={status === "submitted" || status === "streaming"}
          className="flex-1 rounded-xl border border-walnut/20 bg-cream px-3 py-2 text-base text-walnut placeholder:text-clay/70 outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:bg-sand disabled:text-clay/50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={status === "submitted" || status === "streaming" || !input.trim()}
          className="rounded-xl bg-obsidian px-3.5 py-2 text-xs font-semibold text-cream focus-visible:ring-2 focus-visible:ring-obsidian focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("lucioSend", lang)}
        </button>
      </form>
    </div>
  );
}
