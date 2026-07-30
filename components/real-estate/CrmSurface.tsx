"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { CRM_CONFIG } from "@/lib/real-estate/crm-config";
import type { CrmRecord, CrmResource } from "@/lib/real-estate/crm-repositories";
import Icon from "./Icon";

const headers = () => ({ "Content-Type": "application/json", "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });
const display = (value: unknown) => Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? value ? "Yes" : "No" : value == null || value === "" ? "—" : String(value);

export default function CrmSurface({ resource }: { resource: CrmResource }) {
  const config = CRM_CONFIG[resource];
  const [records, setRecords] = useState<CrmRecord[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [editing, setEditing] = useState<CrmRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/real-estate/crm/${resource}`, { headers: headers() });
    const data = await response.json();
    if (response.ok) { setRecords(data.records ?? []); setError(""); } else setError(data.error ?? "Unable to load records");
  }, [resource]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => records.filter((record) => {
    const matchesText = !query || Object.values(record).some((value) => display(value).toLowerCase().includes(query.toLowerCase()));
    const matchesStage = !stage || record.stage === stage || record.pipelineStage === stage;
    return matchesText && matchesStage;
  }), [records, query, stage]);

  async function remove(record: CrmRecord) {
    if (!window.confirm(`Delete this ${config.singular.toLowerCase()}?`)) return;
    await fetch(`/api/real-estate/crm/${resource}/${record.id}`, { method: "DELETE", headers: headers() });
    load();
  }

  async function archive(record: CrmRecord) {
    await fetch(`/api/real-estate/crm/${resource}/${record.id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ action: "archive" }),
    });
    load();
  }

  async function convert(record: CrmRecord, target: "buyer" | "seller") {
    const data = target === "seller" ? { propertyAddress: window.prompt("Seller property address") || "Address pending" } : {};
    const response = await fetch(`/api/real-estate/leads/${record.id}/convert`, { method: "POST", headers: headers(), body: JSON.stringify({ target, data }) });
    if (!response.ok) setError((await response.json()).error || "Conversion failed"); else load();
  }

  async function attendees(record: CrmRecord) {
    const response = await fetch(`/api/real-estate/open-houses/${record.id}/attendees`, { headers: headers() });
    const data = await response.json();
    window.alert(response.ok ? (data.attendees.length ? data.attendees.map((item: CrmRecord) => `${item.name} — ${item.email || item.phone}`).join("\n") : "No registrations yet.") : data.error);
  }

  const dedicated = resource === "brokerages" || resource === "agents";
  return <div className="mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#B99A5B]">Operational CRM</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">{config.title}</h1></div>{dedicated ? <Link href={`/real-estate/${resource}/new`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B99A5B] px-4 py-3 text-sm font-semibold text-[#1A1C18]"><Icon name="plus" className="h-4 w-4" />Add {config.singular}</Link> : <button onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B99A5B] px-4 py-3 text-sm font-semibold text-[#1A1C18]"><Icon name="plus" className="h-4 w-4" />Add {config.singular}</button>}</div>
    <div className="mt-7 grid gap-3 rounded-2xl border border-white/[0.08] bg-[#20231F] p-4 sm:grid-cols-[1fr_220px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="rounded-xl border border-white/10 bg-[#181A17] px-4 py-3 text-sm outline-none focus:border-[#B99A5B]" /><select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-xl border border-white/10 bg-[#181A17] px-3 text-sm"><option value="">All stages</option>{["new", "contacted", "qualified", "appointment_scheduled", "showing_scheduled", "active", "under_contract", "closed", "lost"].map((value) => <option key={value}>{value}</option>)}</select></div>
    {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#20231F]"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-[#858980]"><tr>{config.columns.map((column) => <th key={column} className="p-4">{column.replaceAll(/([A-Z])/g, " $1")}</th>)}<th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{filtered.length === 0 ? <tr><td colSpan={config.columns.length + 1} className="p-8 text-center text-[#8F928A]">No records yet.</td></tr> : filtered.map((record) => <tr key={String(record.id)}>{config.columns.map((column) => <td key={column} className="max-w-[240px] truncate p-4">{display(record[column])}</td>)}<td className="p-4"><div className="flex justify-end gap-2">{resource === "leads" && <><button onClick={() => convert(record, "buyer")} className="rounded-lg border border-[#B99A5B]/30 px-2 py-1.5 text-xs">To buyer</button><button onClick={() => convert(record, "seller")} className="rounded-lg border border-[#B99A5B]/30 px-2 py-1.5 text-xs">To seller</button></>}{resource === "open-houses" && <button onClick={() => attendees(record)} className="rounded-lg border border-[#B99A5B]/30 px-2 py-1.5 text-xs">Registrations</button>}{dedicated ? <Link href={`/real-estate/${resource}/${record.id}/edit`} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">Edit</Link> : <button onClick={() => setEditing(record)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">Edit</button>}{dedicated && <button onClick={() => archive(record)} className="rounded-lg border border-[#B99A5B]/30 px-3 py-1.5 text-xs text-[#D1B06A]">{resource === "agents" ? "Deactivate" : "Archive"}</button>}<button onClick={() => remove(record)} className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger">Delete</button></div></td></tr>)}</tbody></table></div>
    {(creating || editing) && !dedicated && <CrmModal resource={resource} record={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />}
  </div>;
}

function CrmModal({ resource, record, onClose, onSaved }: { resource: CrmResource; record: CrmRecord | null; onClose: () => void; onSaved: () => void }) {
  const config = CRM_CONFIG[resource];
  const [form, setForm] = useState<CrmRecord>(record ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(record ? `/api/real-estate/crm/${resource}/${record.id}` : `/api/real-estate/crm/${resource}`, { method: record ? "PATCH" : "POST", headers: headers(), body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) setErrors(data.errors ?? { form: data.error }); else onSaved();
  }
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4"><form onSubmit={save} className="mx-auto my-8 max-w-2xl rounded-2xl border border-white/10 bg-[#20231F] p-6"><div className="flex justify-between"><h2 className="font-display text-2xl">{record ? "Edit" : "Add"} {config.singular}</h2><button type="button" onClick={onClose}>Close</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{config.fields.map((field) => <CrmInput key={field.key} field={field} value={form[field.key]} error={errors[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />)}</div>{errors.form && <p className="mt-4 text-sm text-danger">{errors.form}</p>}<button className="mt-6 w-full rounded-xl bg-[#B99A5B] px-4 py-3 font-semibold text-[#1A1C18]">Save {config.singular}</button></form></div>;
}

export function CrmInput({ field, value, error, onChange }: { field: import("@/lib/real-estate/crm-config").CrmField; value: unknown; error?: string; onChange: (value: string | number | boolean) => void }) {
  const cls = "w-full rounded-xl border border-white/10 bg-[#181A17] px-4 py-3 text-sm outline-none focus:border-[#B99A5B]";
  return <label className={field.type === "textarea" || field.type === "image" ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs text-[#B6B3AA]">{field.label}</span>{field.type === "textarea" ? <textarea rows={3} className={cls} value={typeof value === "object" ? JSON.stringify(value ?? {}) : display(value === "—" ? "" : value)} onChange={(event) => onChange(event.target.value)} /> : field.type === "relationship" && field.relationship ? <RelationshipSelect type={field.relationship} value={String(value || "")} onChange={onChange} /> : field.type === "select" ? <select className={cls} value={display(value === "—" ? "" : value)} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "checkbox" ? <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} /> : field.type === "image" ? <><input className={cls} value={display(value === "—" ? "" : value)} placeholder="Image URL or upload below" onChange={(event) => onChange(event.target.value)} /><input className="mt-2 text-xs" type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const body = new FormData(); body.set("file", file); body.set("kind", field.key === "logoUrl" ? "brokerage-logo" : "agent-photo"); const response = await fetch("/api/real-estate/uploads", { method: "POST", headers: { "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id }, body }); const result = await response.json(); if (response.ok) onChange(result.url); }} /></> : <input className={cls} required={field.required} type={field.type ?? "text"} value={display(value === "—" ? "" : value)} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} />}{error && <span className="mt-1 block text-xs text-danger">{error}</span>}</label>;
}

function RelationshipSelect({ type, value, onChange }: { type: string; value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/real-estate/selectors?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}`, { headers: headers() });
      const data = await response.json();
      if (response.ok) setOptions(data.options || []);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, type]);
  return <div className="space-y-2"><input className="w-full rounded-xl border border-white/10 bg-[#181A17] px-4 py-2 text-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${type}`} /><select className="w-full rounded-xl border border-white/10 bg-[#181A17] px-4 py-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{value && !options.some((option) => option.value === value) && <option value={value}>{value}</option>}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
