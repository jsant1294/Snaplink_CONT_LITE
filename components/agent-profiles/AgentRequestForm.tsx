"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/southline-i18n";

export default function AgentRequestForm({ lang }: { lang: Lang }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", serviceArea: "", brokerageName: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const r = await fetch("/api/agent-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(r.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="rounded-xl border border-sage/30 bg-sage/10 p-5 text-center text-sm text-sage">{t("agentRequestSuccess", lang)}</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input required placeholder={t("agentRequestName", lang)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-walnut/20 bg-cream px-4 py-3 text-sm" />
      <input required type="email" placeholder={t("agentRequestEmail", lang)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-walnut/20 bg-cream px-4 py-3 text-sm" />
      <input required placeholder={t("agentRequestPhone", lang)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-walnut/20 bg-cream px-4 py-3 text-sm" />
      <input required placeholder={t("agentRequestServiceArea", lang)} value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} className="w-full rounded-xl border border-walnut/20 bg-cream px-4 py-3 text-sm" />
      <input placeholder={t("agentRequestBrokerage", lang)} value={form.brokerageName} onChange={(e) => setForm({ ...form, brokerageName: e.target.value })} className="w-full rounded-xl border border-walnut/20 bg-cream px-4 py-3 text-sm" />
      <button disabled={status === "sending"} className="w-full rounded-xl bg-obsidian py-3 text-sm font-semibold text-cream disabled:opacity-50">
        {t("agentRequestSubmit", lang)}
      </button>
      {status === "error" && <p className="text-center text-sm text-[#B4443B]">{t("errorGeneric", lang)}</p>}
    </form>
  );
}
