import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 text-ink-soft">
        The profile or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="mt-8 inline-block">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
