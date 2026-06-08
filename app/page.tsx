import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getProfileBySlug } from "@/lib/queries";

// The public demo profile linked from the hero. Verified to exist at render
// time so the CTA never 404s if the example is ever removed.
const EXAMPLE_SLUG = "jane";

const STEPS = [
  {
    title: "Share your link",
    body: "Send your personal KnownFor link to colleagues, managers, clients and collaborators.",
  },
  {
    title: "People describe working with you",
    body: "Each person answers one question in a single, honest sentence.",
  },
  {
    title: "You approve what appears publicly",
    body: "Nothing is shown until you review it. You stay in control of your wall.",
  },
  {
    title: "Your strengths become visible",
    body: "Approved feedback forms a warm, human picture of what you are known for.",
  },
];

export default async function LandingPage() {
  const example = await getProfileBySlug(EXAMPLE_SLUG);

  return (
    <div className="container-page">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex rounded-full border border-line bg-canvas-card px-4 py-1.5 text-sm font-medium text-ink-muted">
            Authentic feedback, not ratings
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            What are you known for?
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            KnownFor helps professionals collect short, authentic feedback from
            the people they work with, so they can understand and share their
            real strengths.
          </p>
          {example && (
            <div className="mt-9 flex justify-center">
              <Link href={`/${EXAMPLE_SLUG}`}>
                <Button size="lg" className="w-full sm:w-auto">
                  View example profile
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink">
          How it works
        </h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-canvas-card p-6 shadow-soft"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why it matters */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-brand-soft/50 p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Why it matters
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
            Your resume shows what you did. KnownFor shows how people experienced
            working with you.
          </p>
        </div>
      </section>
    </div>
  );
}
