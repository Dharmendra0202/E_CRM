// Supabase keep-alive.
//
// The Supabase free tier PAUSES a project after 7 days of no activity. A plain
// HTTP ping to the API is not enough — the pause timer only resets on real
// DATABASE activity. This script opens a connection and runs a trivial query so
// the project stays awake.
//
// It is run on a schedule by .github/workflows/keep-alive.yml. It can also be
// run locally:  node backend/scripts/keep-alive.js
//
// Requires DATABASE_URL in the environment (a GitHub Actions secret in CI).

const { PrismaClient } = require("@prisma/client");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("keep-alive: DATABASE_URL is not set.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const startedAt = new Date().toISOString();

  try {
    // A no-op query. `now()` also confirms the DB responded, not just connected.
    const rows = await prisma.$queryRaw`SELECT now() AS ts`;
    const dbTime = rows?.[0]?.ts ?? "unknown";
    console.log(`keep-alive OK @ ${startedAt} — database responded, db time: ${dbTime}`);
  } catch (err) {
    // If the project was paused, the FIRST query after a long gap can fail while
    // it wakes up. Retry a couple of times before giving up so a cold start
    // doesn't fail the whole run.
    console.error(`keep-alive: first attempt failed (${err.message}). Retrying…`);
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      await new Promise((r) => setTimeout(r, attempt * 15000)); // 15s, 30s, 45s
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log(`keep-alive OK on retry ${attempt} @ ${new Date().toISOString()}`);
        ok = true;
      } catch (retryErr) {
        console.error(`keep-alive: retry ${attempt} failed (${retryErr.message}).`);
      }
    }
    if (!ok) {
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await prisma.$disconnect();
  process.exit(0);
}

main();
