// Seeds auth users for rio-staging via the Supabase Admin API. Creating a user
// fires the on_auth_user_created trigger, which inserts the matching profile
// row (business, role and default counter come from user_metadata).
//
// Run: node --env-file=.env.local scripts/seed-auth.mjs
// Requires SEED_PASSWORD in the environment. Idempotent: existing users are
// updated in place rather than duplicated.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!password) {
  console.error("Missing SEED_PASSWORD. Pass it in the environment.");
  process.exit(1);
}

const BUSINESS_ID = "11111111-1111-1111-1111-111111111111";
const BAKERY = "22222222-2222-2222-2222-222222222222";
const HOT_PLATE = "33333333-3333-3333-3333-333333333333";

const users = [
  { email: "owner@riobakershut.lk", name: "Rio Owner", role: "owner", counter_id: null },
  { email: "bakery@riobakershut.lk", name: "Bakery Staff", role: "staff", counter_id: BAKERY },
  { email: "hotplate@riobakershut.lk", name: "Hot Plate Staff", role: "staff", counter_id: HOT_PLATE },
];

const admin = `${url}/auth/v1/admin`;
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function findUserByEmail(email) {
  // Admin list is paginated; the seed set is tiny so a few pages is plenty.
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${admin}/users?page=${page}&per_page=200`, { headers });
    if (!res.ok) throw new Error(`list users failed: ${res.status} ${await res.text()}`);
    const { users: batch } = await res.json();
    if (!batch?.length) return null;
    const hit = batch.find((u) => u.email === email);
    if (hit) return hit;
  }
  return null;
}

async function upsertUser(u) {
  const user_metadata = {
    name: u.name,
    role: u.role,
    business_id: BUSINESS_ID,
    counter_id: u.counter_id,
  };
  const existing = await findUserByEmail(u.email);

  if (existing) {
    const res = await fetch(`${admin}/users/${existing.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password, email_confirm: true, user_metadata }),
    });
    if (!res.ok) throw new Error(`update ${u.email} failed: ${res.status} ${await res.text()}`);
    console.log(`updated  ${u.email.padEnd(26)} role=${u.role}`);
    return;
  }

  const res = await fetch(`${admin}/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: u.email, password, email_confirm: true, user_metadata }),
  });
  if (!res.ok) throw new Error(`create ${u.email} failed: ${res.status} ${await res.text()}`);
  console.log(`created  ${u.email.padEnd(26)} role=${u.role}`);
}

for (const u of users) {
  await upsertUser(u);
}
console.log("done.");
