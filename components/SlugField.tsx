"use client";

import { useEffect, useRef, useState } from "react";
import { Label, Input, FieldError } from "@/components/ui/Field";

type Status = "idle" | "checking" | "ok" | "unavailable";

interface CheckResult {
  available: boolean;
  reason?: string;
  suggestion?: string;
}

// A handle (public_slug) input with live availability checking. Debounces a
// call to /api/slug-check as the user types and shows ✓ available / ✗ taken,
// offering a one-click suggestion when the handle is taken — so users never
// have to discover a clash by submitting the form and getting an error.
export function SlugField({
  id,
  name,
  defaultValue,
  serverError,
  label,
  help,
}: {
  id: string;
  name: string;
  defaultValue: string;
  serverError?: string;
  label: string;
  help?: React.ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const slug = value.trim().toLowerCase();
    if (!slug) {
      setStatus("idle");
      setMessage("");
      setSuggestion("");
      return;
    }

    setStatus("checking");

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(
          `/api/slug-check?slug=${encodeURIComponent(slug)}`,
          { signal: ac.signal }
        );
        const data: CheckResult = await res.json();
        if (data.available) {
          setStatus("ok");
          setMessage("Available");
          setSuggestion("");
        } else {
          setStatus("unavailable");
          setMessage(data.reason ?? "That handle isn't available.");
          setSuggestion(data.suggestion ?? "");
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        required
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="jane-smith"
        className="mt-1.5"
      />
      {help && <p className="mt-1 text-xs text-ink-muted">{help}</p>}

      {status === "checking" && (
        <p className="mt-1 text-xs text-ink-muted">Checking…</p>
      )}
      {status === "ok" && (
        <p className="mt-1 text-xs font-medium text-green-600">✓ {message}</p>
      )}
      {status === "unavailable" && (
        <p className="mt-1 text-xs text-red-600">
          {message}
          {suggestion && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setValue(suggestion)}
                className="font-medium underline hover:no-underline"
              >
                Use {suggestion}
              </button>
            </>
          )}
        </p>
      )}

      <FieldError>{serverError}</FieldError>
    </div>
  );
}
