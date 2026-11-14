import { createDb } from '../functions/api/utils/db-factory';
import { ensureSeeded } from '../functions/api/utils/seed';
import type { Bindings } from '../functions/api/types';

async function main() {
  const env = process.env as unknown as Bindings;
  const db = createDb(env);
  await ensureSeeded(db, env);
  console.log('Database seeded successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
