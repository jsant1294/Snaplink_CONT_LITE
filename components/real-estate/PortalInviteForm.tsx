"use client";
import { useState } from "react"; import { useRouter } from "next/navigation";
export default function PortalInviteForm({ token }: { token: string }) {
  const router = useRouter(); const [error, setError] = useState("");
  async function submit(data: FormData) { const response = await fetch("/api/portal/invitations/redeem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, firstName: data.get("firstName"), lastName: data.get("lastName") }) }); if (!response.ok) return setError("This invitation cannot be accepted. Request a new invitation from your real estate professional."); router.push("/portal"); router.refresh(); }
  return <form action={submit} className="mt-7 grid gap-4"><input name="firstName" required placeholder="First name" className="rounded-xl border border-[#92712e]/30 bg-[#fffaf0] px-4 py-3 text-[#25231f]" /><input name="lastName" required placeholder="Last name" className="rounded-xl border border-[#92712e]/30 bg-[#fffaf0] px-4 py-3 text-[#25231f]" />{error && <p className="text-sm text-red-800">{error}</p>}<button className="rounded-xl bg-[#25231f] px-5 py-3 font-semibold text-[#e0c276]">Accept secure invitation</button></form>;
}
