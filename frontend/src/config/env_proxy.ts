export const ENV = {
  API_BASE_URL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  IS_DEV: Boolean(import.meta.env.DEV),
} as const;
