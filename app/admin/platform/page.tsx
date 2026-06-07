import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getAllUsersForAdmin,
  getPendingFeedbackForAdmin,
} from "@/lib/queries";
import { adminModerateFeedback, removeUser } from "@/lib/actions/platform";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Platform admin",
  robots: { index: false },
};

export default async function PlatformPage() {
  // Super-admin only. The /admin layout already handled auth + onboarding.
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/admin");

  const [users, pending] = await Promise.all([
    getAllUsersForAdmin(),
    getPendingFeedbackForAdmin(),
  ]);

  const totalFeedback = users.reduce((n, u) => n + u.feedbackCount, 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Platform admin
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Oversight across every KnownFor profile. Only you can see this.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Members" value={users.length} />
        <Stat label="Feedback" value={totalFeedback} />
        <Stat label="Pending" value={pending.length} />
      </div>

      {/* Cross-user pending moderation queue */}
      <section>
        <h2 className="text-lg font-semibold text-ink">Pending moderation</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line bg-canvas-subtle p-5 text-sm text-ink-soft">
            Nothing waiting. Every submission has been reviewed.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-line bg-canvas-card p-4"
              >
                <p className="text-sm text-ink">&ldquo;{f.sentence}&rdquo;</p>
                <p className="mt-2 text-xs text-ink-muted">
                  for{" "}
                  {f.owner_slug ? (
                    <Link
                      href={`/${f.owner_slug}`}
                      target="_blank"
                      className="text-brand hover:underline"
                    >
                      {f.owner_name ?? f.owner_slug}
                    </Link>
                  ) : (
                    (f.owner_name ?? "unknown")
                  )}{" "}
                  · {formatDate(f.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ModButton id={f.id} action="approve" label="Approve" tone="brand" />
                  <ModButton id={f.id} action="hide" label="Hide" tone="muted" />
                  <ModButton id={f.id} action="delete" label="Delete" tone="danger" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Member directory */}
      <section>
        <h2 className="text-lg font-semibold text-ink">Members</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas-subtle text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Handle</th>
                <th className="px-4 py-3 font-medium">Feedback</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">
                      {u.full_name ?? "—"}
                      {u.role === "admin" && (
                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.public_slug ? (
                      <Link
                        href={`/${u.public_slug}`}
                        target="_blank"
                        className="text-brand hover:underline"
                      >
                        /{u.public_slug}
                      </Link>
                    ) : (
                      <span className="text-ink-muted">not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {u.feedbackCount}
                    {u.pendingCount > 0 && (
                      <span className="ml-1 text-xs text-amber-600">
                        ({u.pendingCount} pending)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "admin" && (
                      <form action={removeUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-canvas-card p-4">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-wide text-ink-muted">
        {label}
      </div>
    </div>
  );
}

function ModButton({
  id,
  action,
  label,
  tone,
}: {
  id: string;
  action: string;
  label: string;
  tone: "brand" | "muted" | "danger";
}) {
  const toneClass =
    tone === "brand"
      ? "border-brand/30 text-brand-dark hover:bg-brand-soft"
      : tone === "danger"
        ? "border-red-200 text-red-600 hover:bg-red-50"
        : "border-line text-ink-soft hover:bg-canvas-subtle";

  return (
    <form action={adminModerateFeedback}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={`inline-flex h-8 items-center rounded-xl border bg-canvas-card px-3 text-sm font-medium ${toneClass}`}
      >
        {label}
      </button>
    </form>
  );
}
