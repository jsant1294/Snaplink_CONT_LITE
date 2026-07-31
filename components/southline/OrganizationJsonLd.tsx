import { southlineStore } from "@/lib/southline-store";
import { organizationJsonLd } from "@/lib/southline-seo";

export default async function OrganizationJsonLd() {
  const seo = await southlineStore.getSettings().then((s) => s.seo).catch(() => null);
  const data = organizationJsonLd(seo);
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
