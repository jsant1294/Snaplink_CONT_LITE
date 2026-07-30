"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
import Icon, { type IconName } from "./Icon";

interface DashboardData {
  metrics: {
    activeListings: number; pendingListings: number; soldListings: number;
    buyers: number; sellers: number; showings: number; openHouses: number;
    leads: { stage: string; count: number }[];
    tasks: { id: string; title: string; dueAt: string | null; status: string }[];
  };
  activities: { id: string; action: string; description: string; entityType: string; createdAt: string }[];
}

const headers = () => ({ "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });

export default function RealEstateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/real-estate/dashboard", { headers: headers() }).then(async (response) => {
      const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Dashboard unavailable"));
  }, []);
  const metrics = data?.metrics;
  const cards: [string, number, IconName][] = [
    ["Active listings", metrics?.activeListings ?? 0, "home"], ["Pending listings", metrics?.pendingListings ?? 0, "home"],
    ["Sold listings", metrics?.soldListings ?? 0, "chart"], ["Buyer leads", metrics?.buyers ?? 0, "users"],
    ["Seller leads", metrics?.sellers ?? 0, "users"], ["Scheduled showings", metrics?.showings ?? 0, "calendar"],
    ["Upcoming open houses", metrics?.openHouses ?? 0, "calendar"],
  ];
  return <div className="mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#B99A5B]">Operational CRM</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">Real Estate dashboard</h1><p className="mt-2 text-sm text-[#9FA098]">Live listings, clients, activity, and assignments.</p></div><Link href="/real-estate/properties/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B99A5B] px-4 py-3 text-sm font-semibold text-[#1A1C18]"><Icon name="plus" className="h-4 w-4" />New property</Link></div>
    {error && <p className="mt-5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value, icon]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><Icon name={icon} className="h-5 w-5 text-[#A88C52]" /><p className="mt-5 font-display text-3xl">{value}</p><p className="mt-1 text-xs text-[#9FA098]">{label}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><h2 className="font-display text-xl">Conversion funnel</h2><div className="mt-5 space-y-3">{metrics?.leads.length ? metrics.leads.map((item) => { const max = Math.max(...metrics.leads.map((lead) => lead.count), 1); return <div key={item.stage}><div className="flex justify-between text-xs"><span className="capitalize">{item.stage.replaceAll("_", " ")}</span><span>{item.count}</span></div><div className="mt-1 h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#8CA184]" style={{ width: `${Math.max(8, item.count / max * 100)}%` }} /></div></div>; }) : <p className="text-sm text-[#8F928A]">No lead activity yet.</p>}</div></section>
      <section className="rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><div className="flex justify-between"><h2 className="font-display text-xl">Assigned tasks</h2><Link href="/real-estate/tasks" className="text-xs text-[#C4A562]">Manage</Link></div><div className="mt-5 space-y-3">{metrics?.tasks.length ? metrics.tasks.map((task) => <div key={task.id} className="rounded-xl border border-white/[0.07] p-3"><p className="text-sm">{task.title}</p><p className="mt-1 text-xs text-[#8F928A]">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}</p></div>) : <p className="text-sm text-[#8F928A]">No open tasks.</p>}</div></section>
    </div>
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#20231F] p-5"><h2 className="font-display text-xl">Recent activity</h2><div className="mt-5 divide-y divide-white/[0.06]">{data?.activities.length ? data.activities.map((activity) => <div key={activity.id} className="flex gap-3 py-3 first:pt-0"><span className="mt-1 h-2 w-2 rounded-full bg-[#B99A5B]" /><div><p className="text-sm">{activity.description}</p><p className="mt-1 text-xs text-[#8F928A]">{activity.entityType} · {new Date(activity.createdAt).toLocaleString()}</p></div></div>) : <p className="text-sm text-[#8F928A]">Activity will appear as your team works.</p>}</div></section>
  </div>;
}
