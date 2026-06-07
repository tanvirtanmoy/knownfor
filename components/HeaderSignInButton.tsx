"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

// The "Sign in" CTA for signed-out visitors. Hidden on the auth pages
// themselves (login / onboarding / oauth callback) where it would be redundant.
export function HeaderSignInButton() {
  const pathname = usePathname();
  const onAuthPage =
    pathname === "/login" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/auth");

  if (onAuthPage) return null;

  return (
    <Link href="/login">
      <Button size="sm">Sign in</Button>
    </Link>
  );
}
