import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How KnownFor collects, uses, publishes, and protects personal data, and the rights you have under the GDPR.",
  alternates: { canonical: "/privacy" },
};

// Plain, readable privacy notice. This is a good-faith disclosure written to
// match what the app actually does — it is not legal advice. Have it reviewed
// by a qualified advisor before relying on it commercially.
//
// FILL IN before going to production:
//   • PRIVACY_CONTACT  — the address that receives data-protection requests
//   • OPERATOR         — the legal person/entity acting as data controller
const PRIVACY_CONTACT = "privacy@knownfor.eu";
const OPERATOR = "the operator of KnownFor";
const LAST_UPDATED = "7 June 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 text-ink-soft">
          KnownFor (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps people collect short,
          authentic feedback from those they work with and turn it into a public
          profile. This policy explains what personal data we handle, why, who we
          share it with, and the rights you have under the EU General Data
          Protection Regulation (GDPR).
        </p>

        <Section title="Who is responsible for your data">
          <p>
            The data controller is {OPERATOR}. For any privacy question or to
            exercise your rights, contact us at{" "}
            <a
              href={`mailto:${PRIVACY_CONTACT}`}
              className="text-brand hover:underline"
            >
              {PRIVACY_CONTACT}
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="text-ink">Account &amp; profile data.</strong>{" "}
            When you sign in with Google or Microsoft we receive your name, email
            address, and profile picture from that provider. You may add a
            headline, bio, location, and a public handle (the address of your
            profile).
          </p>
          <p>
            <strong className="text-ink">Feedback content.</strong> When someone
            leaves feedback about you, we store the sentence they wrote, the
            relationship they selected, and any optional name, role, or company
            they chose to provide.
          </p>
          <p>
            <strong className="text-ink">Technical data.</strong> When feedback
            is submitted we record a one-way <em>hashed</em> form of the
            sender&rsquo;s IP address and a short browser identifier. We do this
            only to prevent spam and abuse; we do not store the raw IP address.
          </p>
          <p>
            We do not use advertising or analytics trackers, and we do not buy or
            sell personal data.
          </p>
        </Section>

        <Section title="How we use it and our legal basis">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              To create and run your profile and publish the feedback you choose
              to approve — on the basis of{" "}
              <strong className="text-ink">performing our contract</strong> with
              you.
            </li>
            <li>
              To show a feedback giver&rsquo;s name publicly only when they tick
              the box allowing it — on the basis of their{" "}
              <strong className="text-ink">consent</strong>, which they can
              withdraw by contacting us.
            </li>
            <li>
              To prevent spam and keep the service secure (rate-limiting via
              hashed IPs) — on the basis of our{" "}
              <strong className="text-ink">legitimate interest</strong> in a safe
              platform.
            </li>
            <li>
              To send you a notification email when you receive new feedback — on
              the basis of performing our contract with you.
            </li>
          </ul>
        </Section>

        <Section title="Feedback is published publicly">
          <p>
            A core purpose of KnownFor is to publish feedback on a public profile
            page that anyone with the link can view, and which search engines may
            index. <strong className="text-ink">You control what appears:</strong>{" "}
            feedback is only shown after the profile owner approves it, and a
            giver&rsquo;s name is shown only with their explicit consent. You can
            unpublish or delete any feedback on your profile at any time from your
            dashboard.
          </p>
        </Section>

        <Section title="Who we share it with">
          <p>
            We use a small number of trusted service providers (&ldquo;processors&rdquo;)
            who handle data only on our instructions:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Supabase</strong> — database and
              authentication. Your data is stored in the European Union (Ireland).
            </li>
            <li>
              <strong className="text-ink">Vercel</strong> — application hosting
              and delivery.
            </li>
            <li>
              <strong className="text-ink">Resend</strong> — sends the
              new-feedback notification emails.
            </li>
            <li>
              <strong className="text-ink">OpenAI</strong> — generates the
              optional summary of your feedback. Only the feedback sentences are
              sent, without names attached, and they are not used to train
              models.
            </li>
          </ul>
          <p>
            Some providers are based outside the EU. Where data is transferred
            internationally it is protected by appropriate safeguards such as the
            European Commission&rsquo;s Standard Contractual Clauses.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your account and feedback for as long as your profile is
            active. If you delete your account, your profile, the feedback on it,
            and the associated technical data are permanently removed. Anti-spam
            hashes are retained only briefly for their security purpose.
          </p>
        </Section>

        <Section title="Your rights">
          <p>Under the GDPR you have the right to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>access the personal data we hold about you;</li>
            <li>correct inaccurate data;</li>
            <li>delete your data (&ldquo;right to be forgotten&rdquo;);</li>
            <li>object to or restrict certain processing;</li>
            <li>receive your data in a portable format;</li>
            <li>withdraw consent at any time.</li>
          </ul>
          <p>
            Signed-in users can{" "}
            <strong className="text-ink">download their data</strong> and{" "}
            <strong className="text-ink">delete their account</strong> directly
            from{" "}
            <Link href="/admin/profile" className="text-brand hover:underline">
              profile settings
            </Link>
            . For anything else, email{" "}
            <a
              href={`mailto:${PRIVACY_CONTACT}`}
              className="text-brand hover:underline"
            >
              {PRIVACY_CONTACT}
            </a>
            . You also have the right to complain to your local data protection
            authority.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use only strictly necessary cookies to keep you signed in and to
            secure the service. We do not use advertising, marketing, or
            third-party analytics cookies, so there is no tracking to consent to.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as the service evolves. We will revise the
            &ldquo;last updated&rdquo; date above and, for significant changes,
            give you notice where appropriate.
          </p>
        </Section>
      </article>
    </div>
  );
}
