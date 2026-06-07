"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

// GDPR Art. 17 — let a user permanently delete their own account. Deleting the
// auth user cascades (ON DELETE CASCADE) to their profile, feedback, summaries,
// and share links. Requires typing the confirmation phrase to avoid accidents.
export async function deleteOwnAccount(
  _prev: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const confirm = formData.get("confirm")?.toString().trim();
  if (confirm !== "DELETE") {
    return { error: 'Please type DELETE to confirm.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  // Clear the session cookies first so the browser is logged out regardless of
  // what happens next, then hard-delete via the service role.
  await supabase.auth.signOut();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { error: "Could not delete your account. Please try again or contact support." };
  }

  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
