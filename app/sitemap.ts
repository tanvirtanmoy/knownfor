import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl();
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
  ];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("users")
      .select("public_slug, updated_at")
      .not("public_slug", "is", null);

    for (const row of data ?? []) {
      routes.push({
        url: `${base}/${row.public_slug}`,
        lastModified: row.updated_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Env not configured at build time — return the static routes only.
  }

  return routes;
}
