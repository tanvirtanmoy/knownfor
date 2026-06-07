"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import {
  submitFeedback,
  type SubmitFeedbackState,
} from "@/lib/actions/feedback";
import { RELATIONSHIPS, RELATIONSHIP_LABELS } from "@/lib/validators/feedback";
import { Button } from "@/components/ui/Button";
import {
  Label,
  Input,
  Textarea,
  Select,
  FieldError,
} from "@/components/ui/Field";

const MAX = 280;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Sending…" : "Submit feedback"}
    </Button>
  );
}

export function FeedbackForm({
  slug,
  fullName,
  token,
}: {
  slug: string;
  fullName: string;
  token: string;
}) {
  const action = submitFeedback.bind(null, slug);
  const [state, formAction] = useFormState<SubmitFeedbackState, FormData>(
    action,
    {}
  );
  const [count, setCount] = useState(0);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.error && !state.fieldErrors && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="sentence">
          If you had to describe working with {fullName} in one sentence, what
          would you say?
        </Label>
        <Textarea
          id="sentence"
          name="sentence"
          required
          maxLength={MAX}
          aria-describedby="sentence-help sentence-count"
          aria-invalid={Boolean(fe.sentence)}
          placeholder={`Example: ${fullName} is reliable, thoughtful, and always willing to help when others are blocked.`}
          onChange={(e) => setCount(e.target.value.length)}
          className="mt-1.5"
        />
        <div className="mt-1 flex items-center justify-between">
          <FieldError>{fe.sentence}</FieldError>
          <span
            id="sentence-count"
            className="ml-auto text-xs text-ink-muted"
            aria-live="polite"
          >
            {count}/{MAX}
          </span>
        </div>
        <p id="sentence-help" className="sr-only">
          One sentence, up to {MAX} characters.
        </p>
      </div>

      <div>
        <Label htmlFor="relationship">
          How do you know {fullName}?{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
        </Label>
        <Select
          id="relationship"
          name="relationship"
          defaultValue=""
          className="mt-1.5"
        >
          <option value="">Prefer not to say</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {RELATIONSHIP_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="giver_name">
            Name <span className="font-normal text-ink-muted">(optional)</span>
          </Label>
          <Input id="giver_name" name="giver_name" className="mt-1.5" autoComplete="name" />
          <FieldError>{fe.giver_name}</FieldError>
        </div>
        <div>
          <Label htmlFor="giver_role">
            Role <span className="font-normal text-ink-muted">(optional)</span>
          </Label>
          <Input id="giver_role" name="giver_role" className="mt-1.5" />
          <FieldError>{fe.giver_role}</FieldError>
        </div>
        <div>
          <Label htmlFor="giver_company">
            Company{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </Label>
          <Input id="giver_company" name="giver_company" className="mt-1.5" />
          <FieldError>{fe.giver_company}</FieldError>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-line bg-canvas-card p-4">
        <input
          type="checkbox"
          name="allow_name_public"
          className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand/30"
        />
        <span className="text-sm text-ink-soft">
          You may show my name publicly alongside this feedback. If unchecked,
          only your relationship to {fullName} will be shown.
        </span>
      </label>

      <p className="text-xs leading-relaxed text-ink-muted">
        Your feedback is stored and, once {fullName} approves it, may be shown on
        their public profile. We record a hashed form of your IP address to
        prevent spam. See our{" "}
        <Link href="/privacy" className="underline hover:text-ink" target="_blank">
          Privacy Policy
        </Link>
        .
      </p>

      <SubmitButton />
    </form>
  );
}
