import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// Renders a branded-color QR PNG for any provided payment URL.
// No auth needed — it only encodes a URL passed in; nothing sensitive.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "A valid http(s) url is required" }, { status: 400 });
  }
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#0A0A0A", light: "#FFFFFFFF" },
    errorCorrectionLevel: "M",
  });
  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
