"use client";

// Tenant-scoped dashboard — what a contractor client sees. Their PIN only
// unlocks their own board; other tenants are invisible.

import { use } from "react";
import Dashboard, { PinGate } from "@/components/admin/Dashboard";

export default function ScopedAdminPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Dashboard · ${username}`}>
      {(pin, contractor) => <Dashboard mode="scoped" contractor={contractor} pin={pin} />}
    </PinGate>
  );
}
