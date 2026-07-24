import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { suggestFromReceipt } from "@/lib/ai/receipt-ocr";
import { ModelGuardError } from "@/lib/ai/model-guard";

/**
 * POST { contractorUsername, dataUrl }
 * Returns a SUGGESTION only — writes nothing. The user confirms before saving.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const dataUrl = String(body.dataUrl ?? "");
  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "An image is required" }, { status: 400 });
  }

  try {
    const suggestion = await suggestFromReceipt(dataUrl);
    return NextResponse.json({ ok: true, suggestion });
  } catch (err) {
    if (err instanceof ModelGuardError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    // Never fail the batch over OCR — return an empty suggestion instead.
    return NextResponse.json({
      ok: true,
      suggestion: {
        amount: null,
        spentOn: null,
        vendor: null,
        source: "OCR unavailable — enter fields manually",
        hasSuggestion: false,
      },
    });
  }
}
