"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { FeedbackStatus } from "@/types/database";

// Gate every platform action behind the single super-admin (role = 'admin').
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (data?.role !== "admin") redirect("/admin");
  return { supabase, userId: user.id };
}

// Cross-user moderation. Unlike the owner action in admin.ts this is NOT scoped
// to the caller's own profile — the admin RLS policy authorises any row.
export async function adminModerateFeedback(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = formData.get("id")?.toString();
  const action = formData.get("action")?.toString();
  if (!id || !action) return;

  if (action === "delete") {
    await supabase.from("feedback").delete().eq("id", id);
    revalidatePath("/admin/platform");
    revalidatePath("/", "layout");
    return;
  }

  const statusMap: Record<string, FeedbackStatus> = {
    approve: "approved",
    hide: "hidden",
    reject: "rejected",
  };
  const status = statusMap[action];
  if (!status) return;

  await supabase
    .from("feedback")
    .update({
      status,
      is_public: status === "approved",
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/admin/platform");
  revalidatePath("/", "layout");
}

// Permanently remove a user account. Deleting the auth user cascades to the
// public.users row and all their feedback (ON DELETE CASCADE). Uses the
// service-role client because auth admin operations bypass the user session.
export async function removeUser(formData: FormData): Promise<void> {
  const { userId: adminId } = await requireAdmin();
  const targetId = formData.get("id")?.toString();
  if (!targetId) return;

  // Never let the admin delete themselves from here.
  if (targetId === adminId) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(targetId);

  revalidatePath("/admin/platform");
  revalidatePath("/", "layout");
}
