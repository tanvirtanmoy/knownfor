import type { FeedbackRow } from "@/types/database";
import { RELATIONSHIP_LABELS } from "@/lib/validators/feedback";
import { moderateFeedback } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AdminEditSentence } from "@/components/AdminEditSentence";

function ActionButton({
  id,
  action,
  children,
  variant = "secondary",
}: {
  id: string;
  action: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <form action={moderateFeedback}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <Button type="submit" size="sm" variant={variant}>
        {children}
      </Button>
    </form>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-brand-soft text-brand-dark border-brand/20",
  hidden: "bg-canvas-subtle text-ink-muted border-line",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function Row({ item }: { item: FeedbackRow }) {
  const relationship = item.relationship
    ? RELATIONSHIP_LABELS[item.relationship]
    : "-";

  return (
    <li className="rounded-2xl border border-line bg-canvas-card p-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium ${
            STATUS_STYLES[item.status] ?? STATUS_STYLES.hidden
          }`}
        >
          {item.status}
        </span>
        {item.is_public && (
          <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand-soft px-2.5 py-0.5 font-medium text-brand-dark">
            public
          </span>
        )}
        <span className="text-ink-muted">{formatDate(item.created_at)}</span>
      </div>

      <AdminEditSentence id={item.id} sentence={item.sentence} />

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-muted sm:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide">Relationship</dt>
          <dd className="text-ink-soft">{relationship}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">Name</dt>
          <dd className="text-ink-soft">{item.giver_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">Role</dt>
          <dd className="text-ink-soft">{item.giver_role ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">Company</dt>
          <dd className="text-ink-soft">{item.giver_company ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">Name public?</dt>
          <dd className="text-ink-soft">
            {item.allow_name_public ? "Allowed" : "No"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">Source</dt>
          <dd className="text-ink-soft">{item.source}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide">Submitter</dt>
          <dd className="truncate text-ink-soft" title={item.user_agent ?? ""}>
            {item.ip_hash ? `ip:${item.ip_hash.slice(0, 10)}…` : "-"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.status !== "approved" && (
          <ActionButton id={item.id} action="approve" variant="primary">
            Approve
          </ActionButton>
        )}
        {item.status === "approved" && (
          <ActionButton id={item.id} action="toggle_public">
            {item.is_public ? "Make private" : "Make public"}
          </ActionButton>
        )}
        {item.status !== "hidden" && (
          <ActionButton id={item.id} action="hide">
            Hide
          </ActionButton>
        )}
        {item.status !== "rejected" && (
          <ActionButton id={item.id} action="reject">
            Reject
          </ActionButton>
        )}
        <ActionButton id={item.id} action="delete" variant="danger">
          Delete
        </ActionButton>
      </div>
    </li>
  );
}

export function AdminFeedbackTable({
  title,
  description,
  items,
  emptyMessage,
}: {
  title: string;
  description?: string;
  items: FeedbackRow[];
  emptyMessage: string;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-ink">
          {title}{" "}
          <span className="text-base font-normal text-ink-muted">
            ({items.length})
          </span>
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-canvas-card/60 px-5 py-8 text-center text-sm text-ink-muted">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
