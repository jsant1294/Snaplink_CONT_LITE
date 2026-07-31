"use client";

// Operator-only landing page editor for one contractor. The API route
// (PATCH /api/contractor/landing-page) enforces operator-only server-side
// regardless of which PIN unlocked this page — see route.ts.

import { use } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import LandingPageEditor from "@/components/admin/LandingPageEditor";

export default function LandingPageEditPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Landing Page · ${username}`}>
      {(pin, contractor) => <LandingPageEditor pin={pin} contractor={contractor} />}
    </PinGate>
  );
}
