import { NextRequest, NextResponse } from "next/server";
import { isOperator, operatorPin, pinFromRequest } from "@/lib/auth";
import { southlineStore } from "@/lib/southline-store";
import { validateSouthlineSettings } from "@/lib/southline-validation";

export async function GET(req: NextRequest) {
  const pin = pinFromRequest(req);
  if (!isOperator(pin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await southlineStore.getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const pin = pinFromRequest(req);
  if (!isOperator(pin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const validationError = validateSouthlineSettings(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const settings = await southlineStore.updateSettings(body);
    return NextResponse.json({ settings });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
