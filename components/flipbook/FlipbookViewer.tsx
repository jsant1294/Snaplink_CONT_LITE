"use client";

import { useRef, useState } from "react";
import type { FlipCampaign, FlipPage } from "@/lib/flipbook-types";

function ctaHref(page: FlipPage): string | null {
  if (!page.ctaType || !page.ctaValue) return null;
  switch (page.ctaType) {
    case "phone":
      return `tel:${page.ctaValue}`;
    case "sms":
      return `sms:${page.ctaValue}`;
    case "whatsapp":
      return `https://wa.me/${page.ctaValue.replace(/[^0-9]/g, "")}`;
    case "url":
    default:
      return page.ctaValue.startsWith("http") ? page.ctaValue : `https://${page.ctaValue}`;
  }
}

function PageContent({ page }: { page: FlipPage }) {
  const href = ctaHref(page);
  const cta = href && (
    <a
      href={href}
      target={page.ctaType === "url" ? "_blank" : undefined}
      rel={page.ctaType === "url" ? "noopener noreferrer" : undefined}
      className="mt-6 inline-block rounded-full bg-gold px-6 py-3 text-sm font-semibold text-obsidian"
    >
      {page.ctaLabel || "Contact"}
    </a>
  );

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end overflow-hidden bg-obsidian">
      {page.mediaUrl && (
        <img src={page.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="relative z-10 w-full px-6 pb-14 pt-10 text-center text-cream sm:px-12">
        {page.headline && (
          <h2 className="font-display text-2xl sm:text-4xl">{page.headline}</h2>
        )}
        {page.body && <p className="mt-3 text-sm text-bone/90 sm:text-base">{page.body}</p>}
        {cta}
      </div>
    </div>
  );
}

export default function FlipbookViewer({
  campaign,
  pages,
}: {
  campaign: FlipCampaign;
  pages: FlipPage[];
}) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(pages.length - 1, i + delta)));
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < 40) return;
    go(delta < 0 ? 1 : -1);
  }

  if (pages.length === 0) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-obsidian text-bone">
        <p>{campaign.title}</p>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full touch-pan-y overflow-hidden bg-obsidian">
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {pages.map((page) => (
          <div key={page.id} className="h-full w-full shrink-0">
            <PageContent page={page} />
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="absolute inset-x-0 top-4 z-20 flex justify-center gap-1.5">
          {pages.map((page, i) => (
            <button
              key={page.id}
              aria-label={`Go to page ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-gold" : "w-1.5 bg-bone/40"
              }`}
            />
          ))}
        </div>
      )}

      {index > 0 && (
        <button
          aria-label="Previous page"
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-3 text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          ‹
        </button>
      )}
      {index < pages.length - 1 && (
        <button
          aria-label="Next page"
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-3 text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          ›
        </button>
      )}
    </div>
  );
}
