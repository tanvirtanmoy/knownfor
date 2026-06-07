"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, RESERVED_SLUGS } from "@/lib/validators/profile";

export interface OnboardingState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

// First-run setup for a freshly signed-up user: pick a public handle + name.
// The auth user + an (almost empty) public.users row already exist — created by
// the handle_new_user trigger — so this just fills in the slug and name.
export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = onboardingSchema.safeParse({
    full_name: formData.get("full_name"),
    public_slug: formData.get("public_slug"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, error: "Please fix the highlighted fields." };
  }

  const { full_name, public_slug } = parsed.data;

  if (RESERVED_SLUGS.has(public_slug)) {
    return {
      fieldErrors: { public_slug: "That handle is reserved. Try another." },
      error: "Please choose a different handle.",
    };
  }

  const { error } = await supabase
    .from("users")
    .update({ full_name, public_slug })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return {
        fieldErrors: { public_slug: "That handle is already taken." },
        error: "Please choose a different handle.",
      };
    }
    return { error: "Could not save. Please try again." };
  }

  revalidatePath("/admin");
  redirect("/admin");
}
