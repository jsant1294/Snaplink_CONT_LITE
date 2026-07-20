import Link from "next/link";
import { contractorStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const contractors = await contractorStore.list();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <p className="text-xs tracking-[0.35em] uppercase text-gold mb-3">SnapLink</p>
      <h1 className="font-display text-5xl md:text-6xl text-center leading-tight">Contractor</h1>
      <div className="gold-rule w-40 my-6" />
      <p className="text-muted text-center max-w-md mb-10">
        Client intake, organized leads, and instant proposals — one link your
        clients can actually use from their phone.
      </p>
      <div className="w-full max-w-sm space-y-3">
        {contractors.map((c) => (
          <Link key={c.id} href={`/contractor/${c.username}`} className="card block p-4">
            <p className="font-semibold">{c.businessName}</p>
            <p className="text-sm text-muted">/contractor/{c.username}</p>
          </Link>
        ))}
        <Link href="/contractor-admin" className="btn-outline block mt-6">
          Open contractor dashboard
        </Link>
        <Link href="/contractor-admin/new-contractor" className="btn-gold block">
          + Create new contractor
        </Link>
      </div>
    </main>
  );
}
