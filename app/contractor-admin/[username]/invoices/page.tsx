"use client";

// Contractor self-service Invoices (Stripe Connect) for one contractor.
// Reuses the exported PinGate so Dashboard.tsx stays untouched.

import { use } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import InvoiceBoard from "@/components/admin/InvoiceBoard";

export default function InvoicesPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Invoices · ${username}`}>
      {(pin, contractor) => <InvoiceBoard contractor={contractor} pin={pin} />}
    </PinGate>
  );
}
