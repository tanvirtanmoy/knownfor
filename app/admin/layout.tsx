import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";
import { signOut } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { AdminNav } from "@/components/AdminNav";

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

  // "Admin" is reserved for the platform super-admin. Everyone else sees their
  // own first name (falling back to a neutral label).
  const nameParts = profile.full_name?.trim().split(/\s+/) ?? [];
  const ownLabel = nameParts[0] || "Dashboard";
  const heading = profile.role === "admin" ? "Admin" : ownLabel;

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lg font-semibold text-ink">{heading}</span>
            <AdminNav
              publicSlug={profile.public_slug}
              isAdmin={profile.role === "admin"}
            />
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
