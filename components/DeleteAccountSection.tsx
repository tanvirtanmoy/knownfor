"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  deleteOwnAccount,
  type DeleteAccountState,
} from "@/lib/actions/account";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Deleting…" : "Permanently delete my account"}
    </Button>
  );
}

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<DeleteAccountState, FormData>(
    deleteOwnAccount,
    {}
  );

  return (
    <div className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Delete account</h2>
      <p className="mt-1.5 text-sm text-red-700/90">
        This permanently removes your profile, all feedback on it, your share
        links, and your account. This cannot be undone.
      </p>

      {!open ? (
        <Button
          variant="danger"
          size="sm"
          className="mt-4"
          onClick={() => setOpen(true)}
        >
          Delete account
        </Button>
      ) : (
        <form action={formAction} className="mt-4 space-y-3">
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-red-800"
          >
            Type <span className="font-mono font-semibold">DELETE</span> to
            confirm
          </label>
          <Input
            id="confirm"
            name="confirm"
            autoComplete="off"
            className="max-w-xs border-red-300 bg-white"
          />
          {state.error && (
            <p className="text-sm text-red-700" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <ConfirmButton />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
