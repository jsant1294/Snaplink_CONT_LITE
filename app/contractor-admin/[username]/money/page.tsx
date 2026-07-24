"use client";

// Lucio Financial Copilot — money board for one contractor.
// Reuses the exported PinGate so Dashboard.tsx stays untouched.

import { use } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import MoneyBoard from "@/components/admin/MoneyBoard";

export default function MoneyPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Money · ${username}`}>
      {(pin, contractor) => <MoneyBoard contractor={contractor} pin={pin} />}
    </PinGate>
  );
}
