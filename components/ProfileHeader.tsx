import type { ProfileRow } from "@/types/database";

export function ProfileHeader({ profile }: { profile: ProfileRow }) {
  const initials = (profile.full_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-2xl font-semibold text-brand-dark">
        {profile.profile_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profile_image_url}
            alt={profile.full_name ?? "Profile photo"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </div>

      <div className="flex-1">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {profile.full_name}
        </h1>
        <p className="mt-1 text-lg text-ink-soft">{profile.headline}</p>
        {profile.location && (
          <p className="mt-0.5 text-sm text-ink-muted">{profile.location}</p>
        )}
      </div>
    </header>
  );
}
