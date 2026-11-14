import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'drizzle-kit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  schema: path.resolve(__dirname, './server/db/schemas/index.ts').replace(/\\/g, '/'),
  out: path.resolve(__dirname, './drizzle').replace(/\\/g, '/'),
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_URL || 'file:backend/dev.db',
  },
});
