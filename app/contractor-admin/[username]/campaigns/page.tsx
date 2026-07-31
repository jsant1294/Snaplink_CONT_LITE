"use client";

// Contractor self-service Mini Campaign builder for one contractor.
// Reuses the exported PinGate so Dashboard.tsx stays untouched.

import { use } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import CampaignBoard from "@/components/admin/CampaignBoard";

export default function CampaignsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Campaigns · ${username}`}>
      {(pin, contractor) => <CampaignBoard contractor={contractor} pin={pin} />}
    </PinGate>
  );
}
