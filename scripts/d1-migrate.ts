import fs from 'fs';
import path from 'path';
import { WRANGLER_ENV_KEYS } from '../backend/server/config/cloudflare-env';

const target = (process.argv[2] || 'local').toLowerCase();
const drizzleDir = path.resolve(process.cwd(), 'backend', 'drizzle');

if (!fs.existsSync(drizzleDir)) {
  console.error('No migrations directory found at backend/drizzle. Run "bun run db:generate" first.');
  process.exit(1);
}

const args = ['wrangler', 'd1', 'migrations', 'apply'];
if (target === 'production') {
  args.push(WRANGLER_ENV_KEYS.production.d1Name, '--remote', '--env', 'production');
} else if (target === 'preview') {
  args.push(WRANGLER_ENV_KEYS.preview.d1Name, '--remote', '--env', 'preview');
} else {
  args.push(WRANGLER_ENV_KEYS.production.d1Name, '--local');
}

console.log(`Executing: bunx ${args.join(' ')}`);
const proc = Bun.spawnSync(['bunx', ...args], {
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
});
process.exit(proc.exitCode);
