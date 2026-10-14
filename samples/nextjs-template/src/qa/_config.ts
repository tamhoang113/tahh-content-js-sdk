/**
 * QA-only SDK config overrides, deep-merged into upstream config.
 *
 * Usage in layout.tsx (one line added to upstream):
 *   config(withQaConfig({ ...upstreamConfig }));
 *
 * Deep-merges nested objects (fragment, query) so upstream keys are preserved.
 * This file is fork-only — upstream doesn't have it.
 */

const QA_OVERRIDES: Record<string, any> = {
  fragment: {
    expandContracts: true,
  },
  query: {
    resolveTaxonomy: true,
  },
};

export function withQaConfig<T extends Record<string, any>>(upstream: T): T {
  const result = { ...upstream };
  for (const [key, qaValue] of Object.entries(QA_OVERRIDES)) {
    if (qaValue && typeof qaValue === 'object' && !Array.isArray(qaValue)) {
      result[key as keyof T] = { ...(upstream[key] ?? {}), ...qaValue } as any;
    } else {
      result[key as keyof T] = qaValue;
    }
  }
  return result;
}
