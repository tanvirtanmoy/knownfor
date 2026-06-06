import { describe, it, expect } from "vitest";
import { profileSchema } from "@/lib/validators/profile";

describe("profileSchema", () => {
  const base = { full_name: "Tanvir Tanmoy", public_slug: "tanvir" };

  it("accepts a minimal valid profile", () => {
    expect(profileSchema.safeParse(base).success).toBe(true);
  });

  it("requires a full name", () => {
    expect(
      profileSchema.safeParse({ ...base, full_name: "" }).success
    ).toBe(false);
  });

  it("rejects slugs with invalid characters", () => {
    expect(
      profileSchema.safeParse({ ...base, public_slug: "Tan vir!" }).success
    ).toBe(false);
  });

  it("accepts lowercase hyphenated slugs", () => {
    expect(
      profileSchema.safeParse({ ...base, public_slug: "tanvir-data" }).success
    ).toBe(true);
  });

  it("rejects an invalid image URL", () => {
    expect(
      profileSchema.safeParse({ ...base, profile_image_url: "not-a-url" })
        .success
    ).toBe(false);
  });

  it("treats an empty image URL as undefined", () => {
    const result = profileSchema.safeParse({ ...base, profile_image_url: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.profile_image_url).toBeUndefined();
  });
});
