"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/Button";
import { Label, Input, FieldError } from "@/components/ui/Field";
import { SlugField } from "@/components/SlugField";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Setting up…" : "Create my profile"}
    </Button>
  );
}

export function OnboardingForm({
  defaultName,
  defaultSlug,
}: {
  defaultName: string;
  defaultSlug: string;
}) {
  const [state, formAction] = useFormState<OnboardingState, FormData>(
    completeOnboarding,
    {}
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="full_name">Your name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultName}
          placeholder="Jane Smith"
          required
          className="mt-1.5"
        />
        <FieldError>{fe.full_name}</FieldError>
      </div>

      <SlugField
        id="public_slug"
        name="public_slug"
        label="Choose your handle"
        defaultValue={defaultSlug}
        serverError={fe.public_slug}
        help={
          <>
            Your profile will live at knownfor.eu/<strong>handle</strong>. You
            can change it later.
          </>
        }
      />

      <SubmitButton />
    </form>
  );
}
