import fs from 'fs';
import path from 'path';
import { WRANGLER_ENV_KEYS } from '../backend/server/config/cloudflare-env';

const bucket = process.argv[2] === 'preview' ? WRANGLER_ENV_KEYS.preview.r2Bucket : WRANGLER_ENV_KEYS.production.r2Bucket;
const assetsDir = path.resolve(process.cwd(), 'frontend', 'public', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('No frontend/public/assets directory found.');
  process.exit(1);
}

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else results.push(full);
  }
  return results;
}

const files = walk(assetsDir);
console.log(`Uploading ${files.length} asset files to R2 bucket "${bucket}"...`);

for (const file of files) {
  const rel = path.relative(path.resolve(process.cwd(), 'frontend', 'public'), file).replace(/\\/g, '/');
  const proc = Bun.spawnSync(['bunx', 'wrangler', 'r2', 'object', 'put', `${bucket}/${rel}`, '--file', file, '--remote']);
  if (proc.exitCode !== 0) {
    console.warn(`Failed uploading ${rel}`);
  } else {
    console.log(`Uploaded ${rel}`);
  }
}
