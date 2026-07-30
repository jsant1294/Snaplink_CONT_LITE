"use client";

import type { ReactNode } from "react";
import { PinGate } from "@/components/admin/Dashboard";

export default function ProtectedRealEstate({ children }: { children: ReactNode }) {
  return (
    <PinGate title="SnapLink Real Estate">
      {() => children}
    </PinGate>
  );
}
