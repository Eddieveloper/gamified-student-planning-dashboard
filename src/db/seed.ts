import "dotenv/config";
import { ensureDemoSeed, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed-demo";
import { pool } from "@/db";

async function main() {
  const user = await ensureDemoSeed();
  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${user.id})`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
