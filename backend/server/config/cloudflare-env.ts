export interface CloudflareEnvTarget {
  d1Name: string;
  d1Id: string;
  r2Bucket: string;
  kvNamespaceId: string;
}

export const WRANGLER_ENV_KEYS = {
  projectName: 'fashion-doniya',
  production: {
    d1Name: 'fashion-doniya',
    d1Id: 'd2e027d8-bf91-41c3-82ee-6b83b5629c24',
    r2Bucket: 'fashion-doniya',
    kvNamespaceId: '3c457f8170e8424485270f016329a096',
  } satisfies CloudflareEnvTarget,
  preview: {
    d1Name: 'fashion-doniya',
    d1Id: 'd2e027d8-bf91-41c3-82ee-6b83b5629c24',
    r2Bucket: 'fashion-doniya-prev',
    kvNamespaceId: '79990ec512c749dc99bbbe5d4afe148e',
  } satisfies CloudflareEnvTarget,
} as const;
