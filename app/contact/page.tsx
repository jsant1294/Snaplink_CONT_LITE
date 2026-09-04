import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import type { SouthlineContactContent, SouthlineContactCtaType } from "@/lib/southline-types";
import { southlineStore } from "@/lib/southline-store";
import { buildSeoMetadata } from "@/lib/southline-seo";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = ((cookieStore.get("sl_lang")?.value ?? "en") as Lang);
  const seo = await southlineStore.getSettingsSeo().catch(() => null);
  return buildSeoMetadata({ lang, seo, pageKey: "contact" });
}

export const dynamic = "force-dynamic";

function ctaHref(type: SouthlineContactCtaType | null, value: string | null): string | null {
  if (!value) return null;
  switch (type) {
    case "call":
      return `tel:${value}`;
    case "text":
      return `sms:${value}`;
    case "email":
      return `mailto:${value}`;
    case "whatsapp":
      return `https://wa.me/${value.replace(/\D/g, "")}`;
    case "directions":
    case "external_link":
      return value;
    default:
      return null;
  }
}

function addressLine(contact: SouthlineContactContent): string | null {
  const parts = [
    contact.addressLine1,
    contact.addressLine2,
    [contact.city, contact.region, contact.postalCode].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function ContactPage() {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const settings = await southlineStore.getSettingsWithoutHeroImage().catch(() => null);
  const contact = settings?.contact;

  if (contact?.enabled === false) notFound();

  const heading = contact?.heading ?? t("contactHeading", lang);
  const body = contact?.body ?? t("contactBody", lang);
  const businessName = contact?.businessName ?? t("siteName", lang);
  const businessDescription = contact?.businessDescription ?? t("siteTagline", lang);

  const methods = [
    contact?.phone ? { key: "phone", label: t("contactPhoneLabel", lang), href: `tel:${contact.phone}`, value: contact.phone } : null,
    contact?.email ? { key: "email", label: t("contactEmailLabel", lang), href: `mailto:${contact.email}`, value: contact.email } : null,
    contact?.whatsapp ? { key: "whatsapp", label: t("contactWhatsAppLabel", lang), href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`, value: contact.whatsapp } : null,
  ].filter((method) => method !== null);

  const address = contact ? addressLine(contact) : null;
  const hours = contact?.hours
    ?.filter((entry) => entry.enabled !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const ctaHrefValue = ctaHref(contact?.primaryCtaType ?? null, contact?.primaryCtaValue ?? null);
  const ctaLabel = contact?.primaryCtaLabel ?? t("contactCtaLabel", lang);

  return (
    <>
      <Header lang={lang} />
      <main className="bg-page">
        <section className="border-b border-border-default px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-accent-gold">{t("contactEyebrow", lang)}</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-primary sm:text-5xl">{heading}</h1>
            <p className="mt-4 text-text-muted">{body}</p>
            {ctaHrefValue && (
              <a
                href={ctaHrefValue}
                target={contact?.primaryCtaType === "external_link" || contact?.primaryCtaType === "directions" ? "_blank" : undefined}
                rel={contact?.primaryCtaType === "external_link" || contact?.primaryCtaType === "directions" ? "noopener noreferrer" : undefined}
                className="mt-8 inline-block rounded-xl bg-accent-gold px-6 py-3 text-sm font-semibold text-primary hover:bg-accent-gold/90"
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-sm">
              <h2 className="text-xs uppercase tracking-[0.2em] text-accent-gold font-medium mb-4">
                {t("contactBusinessLabel", lang)}
              </h2>
              <p className="font-display text-xl text-primary">{businessName}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{businessDescription}</p>
            </div>

            {methods.length > 0 && (
              <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-sm">
                <h2 className="text-xs uppercase tracking-[0.2em] text-accent-gold font-medium mb-4">
                  {t("contactMethodsLabel", lang)}
                </h2>
                <ul className="space-y-3">
                  {methods.map((method) => (
                    <li key={method.key}>
                      <a
                        href={method.href}
                        target={method.key === "whatsapp" ? "_blank" : undefined}
                        rel={method.key === "whatsapp" ? "noopener noreferrer" : undefined}
                        className="text-sm text-primary hover:text-accent-gold transition-colors"
                      >
                        <span className="text-xs uppercase tracking-wider text-text-muted block">{method.label}</span>
                        <span className="font-medium">{method.value}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {address && (
              <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-sm">
                <h2 className="text-xs uppercase tracking-[0.2em] text-accent-gold font-medium mb-4">
                  {t("contactAddressLabel", lang)}
                </h2>
                <p className="text-sm leading-relaxed text-primary">{address}</p>
                {contact?.directionsUrl && (
                  <a
                    href={contact.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-lg border border-accent-gold px-4 py-2 text-xs font-semibold text-primary hover:bg-accent-gold/10"
                  >
                    {t("contactDirectionsLabel", lang)}
                  </a>
                )}
              </div>
            )}

            {hours && hours.length > 0 && (
              <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-sm">
                <h2 className="text-xs uppercase tracking-[0.2em] text-accent-gold font-medium mb-4">
                  {t("contactHoursLabel", lang)}
                </h2>
                <ul className="space-y-2">
                  {hours.map((entry) => (
                    <li key={entry.id} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-primary">{entry.dayLabel}</span>
                      <span className="text-text-muted text-right">{entry.hoursLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer lang={lang} footer={settings?.footer} contact={settings?.contact} />
    </>
  );
}
