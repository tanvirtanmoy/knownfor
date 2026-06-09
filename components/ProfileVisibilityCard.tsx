import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Button } from "@/components/ui/Button";
import {
  setProfileVisibility,
  createViewLink,
  revokeViewLink,
  deleteViewLink,
} from "@/lib/actions/admin";
import {
  isViewLinkActive,
  MAX_ACTIVE_VIEW_LINKS,
} from "@/lib/view-links";
import { formatDate } from "@/lib/utils";
import type { ProfileViewLinkRow } from "@/types/database";

// Controls whether the profile is world-public (live at /<slug>, indexed) or
// private (reachable only through the tokenized /v/<token> view links managed
// here). Server component — view links never leave our infrastructure.
export function ProfileVisibilityCard({
  isPublic,
  slug,
  siteUrl,
  links,
}: {
  isPublic: boolean;
  slug: string | null;
  siteUrl: string;
  links: ProfileViewLinkRow[];
}) {
  const activeCount = links.filter(isViewLinkActive).length;
  const atCap = activeCount >= MAX_ACTIVE_VIEW_LINKS;
  const publicUrl = slug ? `${siteUrl}/${slug}` : null;

  return (
    <section className="rounded-2xl border border-line bg-canvas-card p-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">
              Profile visibility
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPublic
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-line bg-canvas-subtle text-ink-muted"
              }`}
            >
              {isPublic ? "Public" : "Private"}
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            {isPublic ? (
              <>
                Your profile is live{publicUrl ? "" : " once you pick a handle"}{" "}
                {publicUrl && (
                  <span className="text-ink-soft">at {publicUrl}</span>
                )}{" "}
                and may appear in search engines. Anyone with the link can see
                your wall.
              </>
            ) : (
              <>
                Your profile is hidden from{" "}
                {publicUrl ? <span className="text-ink-soft">{publicUrl}</span> : "the public"}{" "}
                and from search engines. Share it privately with the view links
                below.
              </>
            )}
          </p>
        </div>
        <form action={setProfileVisibility} className="shrink-0">
          <input
            type="hidden"
            name="make_public"
            value={isPublic ? "off" : "on"}
          />
          <Button type="submit" variant="secondary" size="sm">
            {isPublic ? "Make private" : "Make public"}
          </Button>
        </form>
      </div>

      {/* View links — most useful while private, but available either way. */}
      <div className="mt-6 border-t border-line pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Private view links
            </h3>
            <p className="mt-1 max-w-xl text-sm text-ink-muted">
              Share your wall with specific people (e.g. an interviewer) without
              making it public. Each link is unguessable and can be revoked
              anytime.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
            <form
              action={createViewLink}
              className="flex flex-wrap items-center gap-2"
            >
              <select
                name="expires_days"
                defaultValue="0"
                aria-label="Link expiry"
                className="h-8 rounded-xl border border-line bg-canvas-card px-2 text-sm text-ink-soft"
              >
                <option value="0">Never expires</option>
                <option value="7">Expires in 7 days</option>
                <option value="30">Expires in 30 days</option>
                <option value="90">Expires in 90 days</option>
              </select>
              <Button type="submit" size="sm" disabled={atCap}>
                Create link
              </Button>
            </form>
            <p className="text-xs text-ink-muted">
              {activeCount} / {MAX_ACTIVE_VIEW_LINKS} active links
            </p>
          </div>
        </div>

        {atCap && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You&apos;ve reached the limit of {MAX_ACTIVE_VIEW_LINKS} active
            links. Revoke or delete one to create another.
          </p>
        )}

        {links.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-line bg-canvas-subtle p-5 text-sm text-ink-soft">
            No view links yet. Create one to share your profile privately.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {links.map((link) => {
              const url = `${siteUrl}/v/${link.token}`;
              const active = isViewLinkActive(link);
              const expired =
                !link.revoked &&
                link.expires_at != null &&
                new Date(link.expires_at).getTime() <= Date.now();
              return (
                <li
                  key={link.id}
                  className={`rounded-xl border p-4 ${
                    active ? "border-line" : "border-dashed border-line bg-canvas-subtle/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {link.revoked && (
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        Revoked
                      </span>
                    )}
                    {expired && (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Expired
                      </span>
                    )}
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        active ? "text-ink-soft" : "text-ink-muted line-through"
                      }`}
                      title={url}
                    >
                      {url}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">
                    {link.label ? `${link.label} · ` : ""}
                    {link.view_count} view{link.view_count === 1 ? "" : "s"} ·
                    created {formatDate(link.created_at)}
                    {link.expires_at
                      ? ` · expires ${formatDate(link.expires_at)}`
                      : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {active && (
                      <>
                        <CopyLinkButton url={url} />
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center rounded-xl border border-line bg-canvas-card px-3 text-sm font-medium text-ink-soft hover:bg-canvas-subtle"
                        >
                          Open ↗
                        </a>
                        <form action={revokeViewLink}>
                          <input type="hidden" name="id" value={link.id} />
                          <button
                            type="submit"
                            className="inline-flex h-8 items-center rounded-xl border border-line bg-canvas-card px-3 text-sm font-medium text-amber-700 hover:bg-amber-50"
                          >
                            Revoke
                          </button>
                        </form>
                      </>
                    )}
                    <form action={deleteViewLink}>
                      <input type="hidden" name="id" value={link.id} />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-xl border border-line bg-canvas-card px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
