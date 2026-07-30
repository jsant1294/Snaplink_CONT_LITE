"use client";

import { useState } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import HomepageEditor from "@/components/southline/admin/HomepageEditor";
import FeaturedProsPicker from "@/components/southline/admin/FeaturedProsPicker";
import FeatureFlagPanel from "@/components/southline/admin/FeatureFlagPanel";
import RecruitmentLeadsViewer from "@/components/southline/admin/RecruitmentLeadsViewer";
import DiyEditor from "@/components/southline/admin/DiyEditor";
import SpotlightEditor from "@/components/southline/admin/SpotlightEditor";

type Tab = "homepage" | "featured" | "flags" | "recruitment" | "diy" | "spotlight";

export default function SouthlineAdminPage() {
  return (
    <PinGate title="Southline Living CMS">
      {(pin) => <SouthlineAdmin pin={pin} />}
    </PinGate>
  );
}

function SouthlineAdmin({ pin }: { pin: string }) {
  const [tab, setTab] = useState<Tab>("homepage");

  const tabs: { key: Tab; label: string }[] = [
    { key: "homepage", label: "Homepage" },
    { key: "featured", label: "Featured Pros" },
    { key: "recruitment", label: "Recruitment Leads" },
    { key: "diy", label: "DIY Projects" },
    { key: "spotlight", label: "Community Spotlight" },
    { key: "flags", label: "Feature Flags" },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-bone">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-1">
              Southline Living
            </p>
            <h1 className="font-display text-3xl">CMS</h1>
          </div>
          <a
            href="/"
            className="text-xs text-muted hover:text-gold transition-colors"
          >
            ← View homepage
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${
                tab === t.key
                  ? "bg-charcoal text-bone border border-white/10 border-b-transparent"
                  : "text-muted hover:text-bone"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-charcoal border border-white/5 rounded-2xl p-6">
          {tab === "homepage" && <HomepageEditor pin={pin} />}
          {tab === "featured" && <FeaturedProsPicker pin={pin} />}
          {tab === "recruitment" && <RecruitmentLeadsViewer pin={pin} />}
          {tab === "diy" && <DiyEditor pin={pin} />}
          {tab === "spotlight" && <SpotlightEditor pin={pin} />}
          {tab === "flags" && <FeatureFlagPanel pin={pin} />}
        </div>
      </div>
    </div>
  );
}
