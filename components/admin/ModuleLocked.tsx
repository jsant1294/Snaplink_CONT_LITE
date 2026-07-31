export default function ModuleLocked({ lang }: { lang: "en" | "es" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-charcoal p-6 text-center">
      <p className="text-sm text-muted">
        {lang === "es"
          ? "Esta función no está habilitada para tu cuenta. Contacta a tu operador para activarla."
          : "This feature isn't enabled for your account. Contact your operator to turn it on."}
      </p>
    </div>
  );
}
