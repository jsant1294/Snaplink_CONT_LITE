import { notFound, redirect } from "next/navigation";
import { invoiceStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InvoiceRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await invoiceStore.getByToken(token);
  if (!invoice) notFound();
  if (invoice.hostedInvoiceUrl) redirect(invoice.hostedInvoiceUrl);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 text-center">
      <p className="text-obsidian">This invoice isn&apos;t ready yet. Please check back shortly.</p>
    </div>
  );
}
