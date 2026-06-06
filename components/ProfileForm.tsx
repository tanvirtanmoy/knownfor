"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfile, type ProfileFormState } from "@/lib/actions/admin";
import type { ProfileRow } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea, FieldError } from "@/components/ui/Field";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const [state, formAction] = useFormState<ProfileFormState, FormData>(
    updateProfile,
    {}
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.success && (
        <div
          role="status"
          className="rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-brand-dark"
        >
          Profile saved.
        </div>
      )}
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          required
          className="mt-1.5"
        />
        <FieldError>{fe.full_name}</FieldError>
      </div>

      <div>
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={profile.headline ?? ""}
          placeholder="Data Engineer"
          className="mt-1.5"
        />
        <FieldError>{fe.headline}</FieldError>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          className="mt-1.5"
        />
        <FieldError>{fe.bio}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={profile.location ?? ""}
            placeholder="Eindhoven, Netherlands"
            className="mt-1.5"
          />
          <FieldError>{fe.location}</FieldError>
        </div>
        <div>
          <Label htmlFor="public_slug">Public slug</Label>
          <Input
            id="public_slug"
            name="public_slug"
            defaultValue={profile.public_slug ?? ""}
            placeholder="tanvir"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Your profile lives at knownfor.eu/<strong>slug</strong>
          </p>
          <FieldError>{fe.public_slug}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="profile_image_url">Profile image URL</Label>
        <Input
          id="profile_image_url"
          name="profile_image_url"
          type="url"
          defaultValue={profile.profile_image_url ?? ""}
          placeholder="https://…"
          className="mt-1.5"
        />
        <FieldError>{fe.profile_image_url}</FieldError>
      </div>

      <SaveButton />
    </form>
  );
}
