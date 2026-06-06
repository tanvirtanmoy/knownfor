// One-shot database setup: applies migrations, creates the admin auth user,
// then runs the seed. Idempotent — safe to re-run.
//
// Usage:
//   DATABASE_URL="postgresql://..." ADMIN_EMAIL="you@example.com" \
//   ADMIN_PASSWORD="..." node scripts/setup-db.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const out = {};
  try {
    for (const line of readFileSync(join(root, file), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2];
    }
  } catch {}
  return out;
}

const env = { ...loadEnv(".env.local"), ...process.env };

const DATABASE_URL = env.DATABASE_URL;
const ADMIN_EMAIL = env.ADMIN_EMAIL;
const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

if (!DATABASE_URL) fail("DATABASE_URL is required.");
if (!ADMIN_EMAIL || !ADMIN_PASSWORD)
  fail("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
if (!SUPABASE_URL || !SERVICE_KEY)
  fail("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local.");

const sql = (f) => readFileSync(join(root, f), "utf8");

async function runMigrations(client) {
  for (const file of [
    "supabase/migrations/0001_init.sql",
    "supabase/migrations/0002_rls.sql",
    "supabase/migrations/0003_feedback_links.sql",
  ]) {
    process.stdout.write(`→ applying ${file} ... `);
    await client.query(sql(file));
    console.log("done");
  }
}

async function ensureAdminUser() {
  process.stdout.write(`→ ensuring admin auth user (${ADMIN_EMAIL}) ... `);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    }),
  });

  if (res.ok) {
    console.log("created");
    return;
  }
  const body = await res.json().catch(() => ({}));
  const msg = (body.msg || body.error_description || body.message || "").toLowerCase();
  if (res.status === 422 || msg.includes("already") || msg.includes("registered")) {
    console.log("already exists");
    return;
  }
  fail(`could not create admin user: ${res.status} ${JSON.stringify(body)}`);
}

async function runSeed(client) {
  process.stdout.write("→ seeding profile + example feedback ... ");
  // Point the seed at the chosen admin email.
  const seed = sql("supabase/seed.sql").replace(
    /admin_email\s+text\s*:=\s*'[^']*'/,
    `admin_email   text := '${ADMIN_EMAIL.replace(/'/g, "''")}'`
  );
  await client.query(seed);
  console.log("done");
}

async function main() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await runMigrations(client);
    await ensureAdminUser();
    await runSeed(client);

    const { rows } = await client.query(
      "select public_slug from public.users limit 1"
    );
    const { rows: fb } = await client.query(
      "select count(*)::int as n from public.feedback"
    );
    console.log(
      `\n✓ Setup complete. Profile slug: /${rows[0]?.public_slug ?? "?"}, feedback rows: ${fb[0].n}`
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => fail(e.message || String(e)));
