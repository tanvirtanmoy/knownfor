"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateProfile, type ProfileFormState } from "@/lib/actions/admin";
import type { ProfileRow } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea, FieldError } from "@/components/ui/Field";

function initialsOf(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  // Local preview for the avatar. `preview` is the URL shown in the circle;
  // `removed` tracks an explicit "remove photo" so we can tell the server to
  // clear it even when no new file is chosen.
  const [preview, setPreview] = useState<string | null>(
    profile.profile_image_url
  );
  const [removed, setRemoved] = useState(false);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setRemoved(false);
    }
  }

  function onRemovePhoto() {
    setPreview(null);
    setRemoved(true);
  }

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
        <Label htmlFor="profile_image">Profile photo</Label>
        <div className="mt-1.5 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-lg font-semibold text-brand-dark">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Profile photo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{initialsOf(profile.full_name)}</span>
            )}
          </div>
          <div className="space-y-1">
            <input
              id="profile_image"
              name="profile_image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onPickFile}
              className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark hover:file:bg-brand-soft/80"
            />
            <p className="text-xs text-ink-muted">
              JPEG, PNG, WebP, or GIF — up to 2 MB.
              {preview && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="font-medium text-red-600 hover:underline"
                  >
                    Remove photo
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
        {/* Tells the server to clear the stored photo when removed and no new
            file was chosen. */}
        <input type="hidden" name="remove_image" value={removed ? "on" : ""} />
        <FieldError>{fe.profile_image}</FieldError>
      </div>

      <SaveButton />
    </form>
  );
}
