import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;

// The avatars bucket public URL contains this path segment. We use it to tell
// whether a stored profile photo already lives in our own storage (durable) vs.
// still points at an external provider URL that may expire.
export const HOSTED_AVATAR_MARKER = "/storage/v1/object/public/avatars/";

// Download an external OAuth profile photo (e.g. LinkedIn's signed URL, which
// expires after a few weeks) and store it in our own avatars bucket so it stays
// valid indefinitely. Best-effort: any failure returns null and leaves the photo
// as-is — this must never block login. Returns the durable public URL on success.
export async function rehostProviderAvatar(
  userId: string,
  sourceUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, { redirect: "follow" });
    if (!res.ok) return null;

    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!ALLOWED.includes(type)) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;

    const admin = createAdminClient();
    const ext = type.split("/")[1].replace("jpeg", "jpg");
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: upErr } = await admin.storage
      .from("avatars")
      .upload(path, bytes, { contentType: type, upsert: true });
    if (upErr) return null;

    const publicUrl = admin.storage.from("avatars").getPublicUrl(path).data
      .publicUrl;

    const { error: updErr } = await admin
      .from("users")
      .update({ profile_image_url: publicUrl })
      .eq("id", userId);
    if (updErr) return null;

    return publicUrl;
  } catch {
    return null;
  }
}
