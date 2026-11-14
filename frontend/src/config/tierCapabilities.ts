export type FeatureFlagKey =
  | 'feature.dashboard'
  | 'feature.wallet'
  | 'feature.loyalty'
  | 'feature.returns'
  | 'feature.aiStudio'
  | 'feature.customDesign'
  | 'feature.calculator'
  | 'feature.showrooms';

export const DEFAULT_TIER_CAPABILITIES: Record<FeatureFlagKey, boolean> = {
  'feature.dashboard': true,
  'feature.wallet': true,
  'feature.loyalty': true,
  'feature.returns': true,
  'feature.aiStudio': true,
  'feature.customDesign': true,
  'feature.calculator': true,
  'feature.showrooms': false,
};

export function isFeatureEnabled(
  capabilities: Record<string, boolean> | undefined,
  feature: FeatureFlagKey
): boolean {
  if (!capabilities || !(feature in capabilities)) {
    return DEFAULT_TIER_CAPABILITIES[feature];
  }
  return Boolean(capabilities[feature]);
}
