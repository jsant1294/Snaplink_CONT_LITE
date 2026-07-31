"use client";

// Contractor self-service Flipbook builder for one contractor.
// Reuses the exported PinGate so Dashboard.tsx stays untouched.

import { use } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import FlipbookBoard from "@/components/admin/FlipbookBoard";

export default function FlipbookPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Flipbook · ${username}`}>
      {(pin, contractor) => <FlipbookBoard contractor={contractor} pin={pin} />}
    </PinGate>
  );
}
