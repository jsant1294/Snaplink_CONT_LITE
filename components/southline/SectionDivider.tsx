/** Shared editorial boundary for every major Southline content section. */
export default function SectionDivider({ monogram = false }: { monogram?: boolean }) {
  return (
    <div aria-hidden="true" className="bg-page py-6 sm:py-8">
      <div className="mx-auto flex w-28 items-center justify-center sm:w-[calc(100%-3rem)] sm:max-w-7xl lg:w-[calc(100%-4rem)]">
        {monogram ? (
          <>
            <span className="h-px flex-1 bg-[var(--sl-divider)]" />
            <span className="mx-4 hidden h-6 w-6 items-center justify-center rounded-md border border-[var(--sl-divider)] font-display text-xs font-semibold text-eyebrow sm:inline-flex">
              S
            </span>
            <span className="hidden h-px flex-1 bg-[var(--sl-divider)] sm:block" />
          </>
        ) : (
          <span className="h-px w-full bg-[var(--sl-divider)]" />
        )}
      </div>
    </div>
  );
}
