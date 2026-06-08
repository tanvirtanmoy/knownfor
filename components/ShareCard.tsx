import QRCode from "qrcode";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Button } from "@/components/ui/Button";
import {
  createShareLink,
  revokeShareLink,
  deleteShareLink,
} from "@/lib/actions/admin";
import { MAX_ACTIVE_LINKS } from "@/lib/feedback-links";
import { formatDate } from "@/lib/utils";
import type { FeedbackLinkRow } from "@/types/database";

// Server component: generates each QR code locally (no third-party service) so
// feedback links never leave your infrastructure. Links are private — only
// someone with the exact URL/QR can open the feedback form.
export async function ShareCard({
  links,
  siteUrl,
  slug,
}: {
  links: FeedbackLinkRow[];
  siteUrl: string;
  slug: string;
}) {
  const activeCount = links.filter((l) => !l.revoked).length;
  const atCap = activeCount >= MAX_ACTIVE_LINKS;

  const items = await Promise.all(
    links.map(async (link) => {
      const url = `${siteUrl}/${slug}/feedback?k=${link.token}`;
      let qr: string | null = null;
      try {
        qr = await QRCode.toDataURL(url, {
          margin: 1,
          width: 220,
          color: { dark: "#1c2433", light: "#ffffff" },
        });
      } catch {
        qr = null;
      }
      return { link, url, qr };
    })
  );

  return (
    <section className="rounded-2xl border border-line bg-canvas-card p-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Private feedback links
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Generate a link to share with a colleague or group. Only people with
            the exact link can open your feedback form. Revoke any link anytime.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          <form action={createShareLink}>
            <Button type="submit" size="sm" disabled={atCap}>
              Generate link
            </Button>
          </form>
          <p className="text-xs text-ink-muted">
            {activeCount} / {MAX_ACTIVE_LINKS} active links
          </p>
        </div>
      </div>

      {atCap && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You&apos;ve reached the limit of {MAX_ACTIVE_LINKS} active links.
          Revoke or delete one to generate another.
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-canvas-subtle p-5 text-sm text-ink-soft">
          No links yet. Generate one to start collecting feedback.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map(({ link, url, qr }) => (
            <li
              key={link.id}
              className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center ${
                link.revoked
                  ? "border-dashed border-line bg-canvas-subtle/60"
                  : "border-line"
              }`}
            >
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt={`QR code for ${link.label ?? "feedback link"}`}
                  className={`h-28 w-28 shrink-0 rounded-lg border border-line bg-white p-1.5 ${
                    link.revoked ? "opacity-40 grayscale" : ""
                  }`}
                  width={112}
                  height={112}
                />
              )}

              <div className="min-w-0 flex-1">
                {link.revoked && (
                  <span className="mb-2 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Revoked
                  </span>
                )}
                <div
                  className={`flex items-center gap-2 overflow-hidden rounded-lg border border-line bg-canvas-subtle px-3 py-2 ${
                    link.revoked ? "opacity-60" : ""
                  }`}
                >
                  <span
                    className={`truncate text-sm text-ink-soft ${
                      link.revoked ? "line-through" : ""
                    }`}
                    title={url}
                  >
                    {url}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {link.label ? `${link.label} · ` : ""}
                  {link.use_count} submission{link.use_count === 1 ? "" : "s"} ·
                  created {formatDate(link.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {link.revoked ? (
                    <span className="inline-flex h-8 items-center text-sm text-ink-muted">
                      This link can no longer collect feedback.
                    </span>
                  ) : (
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
                      <form action={revokeShareLink}>
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
                  <form action={deleteShareLink}>
                    <input type="hidden" name="id" value={link.id} />
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center rounded-xl border border-line bg-canvas-card px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
