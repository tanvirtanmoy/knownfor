"use client";

import { useState } from "react";
import { editFeedbackSentence } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

// Inline typo-fix editor for a single feedback sentence.
export function AdminEditSentence({
  id,
  sentence,
}: {
  id: string;
  sentence: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg leading-relaxed text-ink">{sentence}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-sm font-medium text-brand hover:text-brand-dark"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      action={editFeedbackSentence}
      className="space-y-2"
      onSubmit={() => setEditing(false)}
    >
      <input type="hidden" name="id" value={id} />
      <Textarea
        name="sentence"
        defaultValue={sentence}
        maxLength={280}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
