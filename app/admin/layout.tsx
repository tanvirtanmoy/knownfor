import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";
import { signOut } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already guards /admin, but we also need the profile here.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // New users land here without a handle yet — finish onboarding first.
  if (!profile.public_slug) redirect("/onboarding");

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lg font-semibold text-ink">Admin</span>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-ink-soft hover:text-brand">
                Feedback
              </Link>
              <Link
                href="/admin/profile"
                className="text-ink-soft hover:text-brand"
              >
                Profile
              </Link>
              {profile.public_slug && (
                <Link
                  href={`/${profile.public_slug}`}
                  className="text-ink-soft hover:text-brand"
                  target="_blank"
                >
                  View public ↗
                </Link>
              )}
              {profile.role === "admin" && (
                <Link
                  href="/admin/platform"
                  className="font-medium text-brand hover:text-brand-dark"
                >
                  Platform
                </Link>
              )}
            </nav>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
