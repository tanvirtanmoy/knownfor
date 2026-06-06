import type { CSSProperties } from "react";
import type { PublicFeedback } from "@/types/database";
import { RELATIONSHIP_LABELS } from "@/lib/validators/feedback";

// Soft "cloud" palette — light pastel fills with a slightly deeper border, so
// dark ink text stays readable. Cards cycle through these by index.
const CLOUD_COLORS = [
  "bg-[#e8f3ef] border-[#d3e7e0]",
  "bg-[#e9f0f7] border-[#d4e2f0]",
  "bg-[#fbeee6] border-[#f3ddcf]",
  "bg-[#efeaf7] border-[#ded3ee]",
  "bg-[#fbf4e2] border-[#f2e6c5]",
  "bg-[#fbeaee] border-[#f2d4dc]",
];

// Renders one approved feedback item. Respects allow_name_public: if the giver
// did not consent to showing their name, only the relationship is shown.
export function FeedbackCard({
  item,
  index = 0,
}: {
  item: PublicFeedback;
  index?: number;
}) {
  const showName = item.allow_name_public && item.giver_name;

  const relationshipLabel = item.relationship
    ? RELATIONSHIP_LABELS[item.relationship]
    : null;

  const metaParts: string[] = [];
  if (showName) {
    metaParts.push(item.giver_name!);
    const roleCompany = [item.giver_role, item.giver_company]
      .filter(Boolean)
      .join(", ");
    if (roleCompany) metaParts.push(roleCompany);
  } else if (relationshipLabel) {
    metaParts.push(relationshipLabel);
  }

  const attribution =
    metaParts.length > 0 ? metaParts.join(" · ") : "Anonymous";

  const color = CLOUD_COLORS[index % CLOUD_COLORS.length];
  // Stagger the float so cards drift independently, and keep it slow.
  const floatStyle = {
    "--float-delay": `${(index % 6) * 0.8}s`,
    "--float-dur": `${9 + (index % 4)}s`,
  } as CSSProperties;

  return (
    <figure
      style={floatStyle}
      className={`cloud-card flex h-full flex-col rounded-3xl border p-6 shadow-card transition-shadow duration-300 hover:shadow-lg ${color}`}
    >
      <blockquote className="flex-1 text-lg leading-relaxed text-ink">
        <span aria-hidden className="mr-1 text-brand">
          &ldquo;
        </span>
        {item.sentence}
      </blockquote>
      <figcaption className="mt-5 text-sm font-medium text-ink-muted">
        {showName ? attribution : <span>{attribution}</span>}
        {!showName && relationshipLabel && (
          <span className="sr-only"> (name withheld)</span>
        )}
      </figcaption>
    </figure>
  );
}
