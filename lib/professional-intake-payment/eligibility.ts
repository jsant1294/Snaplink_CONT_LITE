// ---------------------------------------------------------------------------
// Publication eligibility — the single derived rule. Used by both the
// operator review UI (to disable the Publish action) and the publish API
// route (to enforce it server-side) — never duplicated between the two.
// ---------------------------------------------------------------------------

import { PAYMENT_SATISFIED_STATUSES, type ProfilePaymentStatus, type PublicationEligibility } from "./types.ts";

function paymentBlockReason(status: ProfilePaymentStatus, lang: "en" | "es"): string {
  const reasons: Record<ProfilePaymentStatus, { en: string; es: string }> = {
    not_required: { en: "", es: "" },
    paid: { en: "", es: "" },
    comped: { en: "", es: "" },
    payment_required: { en: "Payment is still required.", es: "Aún se requiere el pago." },
    pending: { en: "Payment is pending confirmation.", es: "El pago está pendiente de confirmación." },
    past_due: { en: "Payment is past due.", es: "El pago está vencido." },
    failed: { en: "The last payment attempt failed.", es: "El último intento de pago falló." },
    refunded: { en: "Payment was refunded — review before publishing.", es: "El pago fue reembolsado — revisa antes de publicar." },
  };
  return reasons[status][lang];
}

export function evaluateProfilePublicationEligibility(
  input: {
    profileApproved: boolean;
    paymentStatus: ProfilePaymentStatus;
    planActive: boolean;
    entitlementValid: boolean;
  },
  lang: "en" | "es" = "en"
): PublicationEligibility {
  const paymentSatisfied = PAYMENT_SATISFIED_STATUSES.includes(input.paymentStatus);
  const paymentRequired = input.paymentStatus !== "not_required";

  const reasons: string[] = [];
  if (!input.profileApproved) {
    reasons.push(lang === "es" ? "El contenido aún no ha sido aprobado por un operador." : "Content has not been approved by an operator yet.");
  }
  if (!input.planActive) {
    reasons.push(lang === "es" ? "El plan seleccionado no está activo." : "Selected plan is not active.");
  }
  if (!input.entitlementValid) {
    reasons.push(
      lang === "es" ? "Los módulos habilitados no coinciden con el plan seleccionado." : "Entitlements do not match the selected plan."
    );
  }
  if (!paymentSatisfied) {
    const reason = paymentBlockReason(input.paymentStatus, lang);
    if (reason) reasons.push(reason);
  }

  const canPublish = input.profileApproved && input.planActive && input.entitlementValid && paymentSatisfied;

  return {
    profileApproved: input.profileApproved,
    paymentRequired,
    paymentSatisfied,
    planActive: input.planActive,
    entitlementValid: input.entitlementValid,
    canPublish,
    reasons,
  };
}
