"use client";

import { use } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import IntakeConsole from "@/components/professional-intake/IntakeConsole";
import type { IntakeOwnerType } from "@/lib/professional-intake/types";

export default function ProfessionalIntakePage({
  params,
}: {
  params: Promise<{ ownerType: string; ownerId: string }>;
}) {
  const { ownerType, ownerId } = use(params);
  const validOwnerType: IntakeOwnerType = ownerType === "agent" ? "agent" : "contractor";

  return (
    <PinGate title="Southline Professional Intake">
      {(pin) => (
        <div className="min-h-screen bg-obsidian text-bone">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-1">Southline Living</p>
                <h1 className="font-display text-2xl">Professional Intake</h1>
              </div>
              <a href="/southline/admin" className="text-xs text-muted hover:text-gold transition-colors">
                ← Back to CMS
              </a>
            </div>
            <div className="bg-charcoal border border-white/5 rounded-2xl p-6">
              <IntakeConsole pin={pin} ownerType={validOwnerType} ownerId={ownerId} isOperator />
            </div>
          </div>
        </div>
      )}
    </PinGate>
  );
}
