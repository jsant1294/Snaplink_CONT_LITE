// ---------------------------------------------------------------------------
// Payment helpers. SnapLink NEVER processes money — it only displays the
// contractor's own payment instructions and tracks what they mark as received.
// ---------------------------------------------------------------------------

import type { PaymentMethods, PaymentVia } from "./types";
import type { Lang } from "./i18n";

export interface PayOption {
  via: PaymentVia;
  label: string;        // e.g. "Zelle"
  handle: string;       // what to show the client, e.g. "jose@email.com"
  url?: string;         // tappable deep link when one exists
  qrable: boolean;      // can we make a scan-to-pay QR
}

function normalizeCashApp(tag: string): string {
  const t = tag.replace(/^\$/, "").trim();
  return t;
}

function paypalUrl(v: string): string {
  const t = v.trim();
  if (t.startsWith("http")) return t;
  if (t.startsWith("paypal.me/")) return `https://${t}`;
  return `https://paypal.me/${t.replace(/^@/, "")}`;
}

/** Build the display + link options from a contractor's methods. Order = priority. */
export function payOptions(pm: PaymentMethods | undefined, opts?: { amount?: number }): PayOption[] {
  if (!pm) return [];
  const out: PayOption[] = [];
  const amt = opts?.amount && opts.amount > 0 ? opts.amount.toFixed(2) : undefined;

  if (pm.stripeLink) {
    out.push({ via: "Stripe", label: "Card (Stripe)", handle: "Secure card payment", url: pm.stripeLink.trim(), qrable: true });
  }
  if (pm.paypalMe) {
    const base = paypalUrl(pm.paypalMe);
    const url = amt ? `${base}/${amt}` : base;
    out.push({ via: "PayPal", label: "PayPal", handle: base.replace(/^https?:\/\//, ""), url, qrable: true });
  }
  if (pm.cashApp) {
    const tag = normalizeCashApp(pm.cashApp);
    const url = amt ? `https://cash.app/$${tag}/${amt}` : `https://cash.app/$${tag}`;
    out.push({ via: "CashApp", label: "Cash App", handle: `$${tag}`, url, qrable: true });
  }
  if (pm.venmo) {
    const handle = pm.venmo.replace(/^@/, "");
    const url = `https://venmo.com/${handle}${amt ? `?txn=pay&amount=${amt}` : ""}`;
    out.push({ via: "Venmo", label: "Venmo", handle: `@${handle}`, url, qrable: true });
  }
  if (pm.zelle) {
    // Zelle has no universal deep link — show the handle to enter in their bank app.
    out.push({ via: "Zelle", label: "Zelle", handle: pm.zelle.trim(), qrable: false });
  }
  if (pm.cash) {
    out.push({ via: "Cash", label: "Cash", handle: "Cash on site", qrable: false });
  }
  if (pm.check) {
    out.push({ via: "Check", label: "Check", handle: pm.payToName ? `Payable to ${pm.payToName}` : "Check", qrable: false });
  }
  return out;
}

export function hasAnyPayment(pm: PaymentMethods | undefined): boolean {
  return payOptions(pm).length > 0;
}

/** The single best QR target (first qrable option). */
export function primaryQrUrl(pm: PaymentMethods | undefined, amount?: number): string | undefined {
  return payOptions(pm, { amount }).find((o) => o.qrable && o.url)?.url;
}

export const PAY_LABELS = {
  howToPay: { en: "How to pay", es: "Cómo pagar" },
  scanToPay: { en: "Scan to pay", es: "Escanea para pagar" },
  depositDue: { en: "Deposit due", es: "Depósito requerido" },
  balanceDue: { en: "Balance due", es: "Saldo pendiente" },
  paid: { en: "PAID", es: "PAGADO" },
  partiallyPaid: { en: "PARTIALLY PAID", es: "PAGO PARCIAL" },
  unpaid: { en: "UNPAID", es: "SIN PAGAR" },
  recordPayment: { en: "Record payment", es: "Registrar pago" },
  paidOf: { en: "paid of", es: "pagado de" },
  balance: { en: "balance", es: "saldo" },
} as const;

export function payText(key: keyof typeof PAY_LABELS, lang: Lang): string {
  return PAY_LABELS[key][lang];
}
