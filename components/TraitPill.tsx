export function TraitPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand-soft px-3.5 py-1.5 text-sm font-medium text-brand-dark">
      {label}
    </span>
  );
}
