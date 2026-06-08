"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Dashboard tab bar. Lives in a client component so it can highlight the active
// tab via usePathname — otherwise it's not obvious which page you're already on.
export function AdminNav({
  publicSlug,
  isAdmin,
}: {
  publicSlug: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const cls = (active: boolean, inactive: string) =>
    active
      ? "font-semibold text-brand underline underline-offset-4 decoration-2"
      : `${inactive} transition-colors`;

  const muted = "text-ink-soft hover:text-brand";

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link
        href="/admin"
        aria-current={pathname === "/admin" ? "page" : undefined}
        className={cls(pathname === "/admin", muted)}
      >
        Feedback
      </Link>
      <Link
        href="/admin/profile"
        aria-current={pathname === "/admin/profile" ? "page" : undefined}
        className={cls(pathname === "/admin/profile", muted)}
      >
        Edit profile
      </Link>
      {publicSlug && (
        <Link href={`/${publicSlug}`} className={muted} target="_blank">
          View public ↗
        </Link>
      )}
      {isAdmin && (
        <Link
          href="/admin/platform"
          aria-current={pathname === "/admin/platform" ? "page" : undefined}
          className={cls(
            pathname === "/admin/platform",
            "font-medium text-brand hover:text-brand-dark"
          )}
        >
          Platform
        </Link>
      )}
    </nav>
  );
}
