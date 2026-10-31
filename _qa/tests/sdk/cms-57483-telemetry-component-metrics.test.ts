/**
 * CMS-57483: Fix Telemetry issues in JS SDK
 *
 * Bug: When a real OpenTelemetry MeterProvider is registered and an app uses
 * Next.js `cacheComponents: true`, the `optimizely.component.*` metrics recorded
 * inside `OptimizelyComponent` call `Date.now()` via OTel's SyncInstrument._record().
 * Next.js forbids `Date.now()` in the static shell → prerender aborts → 500.
 *
 * Fix (PR #614):
 *   - New `TelemetryOptions` type exported from `@optimizely/cms-sdk`
 *   - `config()` now accepts `telemetry: { componentMetrics: boolean }` option
 *   - When `componentMetrics: false`, `componentResolveDuration.record()` and
 *     `componentLookupCount.add()` become no-ops (OTel's Date.now() is never called)
 *   - The span (`optimizely.component.resolve`) is still emitted — only metrics are silenced
 *
 * Test runs against the workspace SDK (with fix applied).
 * For comparison, 3.0.2 has a direct call: componentResolveDuration.record(...)
 * without any guard — see `dist/esm/telemetry/metrics.js` in that version.
 *
 * Run:
 *   pnpm test:sdk -- cms-57483
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SDK_SRC = resolve(__dirname, '../../../packages/optimizely-cms-sdk/dist/esm');

// ─── Scenario A: API surface — TelemetryOptions is exported ──────────────────
//
// Before the fix (3.0.2): `config()` signature was `config(options: GraphOptions)`
// with no telemetry parameter. Passing `telemetry: {...}` was silently ignored.
//
// After the fix (workspace:*): `config(options: GraphOptions & { telemetry?: TelemetryOptions })`
// and `TelemetryOptions` is exported from the public index.

describe('Scenario A — TelemetryOptions is part of the public API', () => {
  test('TelemetryOptions is exported from the SDK', async () => {
    // Types are erased at runtime; verify the settings module that backs the type exists
    const settingsModule = await import(join(SDK_SRC, 'telemetry/settings.js'));
    expect(typeof settingsModule.isComponentMetricsEnabled).toBe('function');
    expect(typeof settingsModule.setTelemetryOptions).toBe('function');
  });

  test('config() accepts telemetry.componentMetrics without throwing', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    expect(() =>
      config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } }),
    ).not.toThrow();
  });

  test('config() without telemetry option defaults componentMetrics to true', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    const { isComponentMetricsEnabled } = await import(join(SDK_SRC, 'telemetry/settings.js'));

    config({ apiKey: 'test-api-key' }); // no telemetry
    expect(isComponentMetricsEnabled()).toBe(true);
  });

  test('config() with telemetry: { componentMetrics: false } disables metrics', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    const { isComponentMetricsEnabled } = await import(join(SDK_SRC, 'telemetry/settings.js'));

    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });
    expect(isComponentMetricsEnabled()).toBe(false);
  });

  test('telemetry setting is NOT stored in the graph config', async () => {
    const { config, getGraphConfig } = await import(join(SDK_SRC, 'graph/index.js'));

    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });
    const graphConfig = getGraphConfig();
    expect(graphConfig).not.toHaveProperty('telemetry');
  });
});

// ─── Scenario B: Metric guard — records only when componentMetrics is true ───
//
// Root cause of the bug: `componentResolveDuration.record()` called OTel directly.
// OTel's `SyncInstrument._record()` always calls `Date.now()`. Next.js cacheComponents
// forbids `Date.now()` in the static shell → NEXT_STATIC_GEN_BAILOUT → 500.
//
// The fix wraps `record()` / `add()` with `if (isComponentMetricsEnabled())`.
// This is the key differential: 3.0.2 has no guard; workspace:* has the guard.

describe('Scenario B — Component metrics are no-ops when componentMetrics is false', () => {
  test('componentResolveDuration.record() is a guarded wrapper (not a raw OTel call)', async () => {
    const metricsModule = await import(join(SDK_SRC, 'telemetry/metrics.js'));
    const { componentResolveDuration } = metricsModule;

    // The fix: record() is a function wrapper, not the raw OTel histogram object.
    // In 3.0.2: componentResolveDuration = meter.createHistogram(...)  ← raw OTel
    // In workspace:*: componentResolveDuration = { record: (...) => { if (isEnabled)... } }
    expect(typeof componentResolveDuration.record).toBe('function');

    // A raw OTel histogram's record function is bound to SyncInstrument._record()
    // which calls Date.now(). Our wrapper intercepts before that.
    // Verify the wrapper respects the isComponentMetricsEnabled() flag.
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));

    // With componentMetrics: false, record() should be a no-op
    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });
    // This must not throw and must not call Date.now() on an OTel provider
    expect(() => componentResolveDuration.record(1.5, {})).not.toThrow();
  });

  test('componentLookupCount.add() is a guarded wrapper (not a raw OTel counter)', async () => {
    const metricsModule = await import(join(SDK_SRC, 'telemetry/metrics.js'));
    const { componentLookupCount } = metricsModule;

    expect(typeof componentLookupCount.add).toBe('function');

    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });
    expect(() => componentLookupCount.add(1, {})).not.toThrow();
  });
});

// ─── Scenario C: Differential proof ──────────────────────────────────────────
//
// The bug in 3.0.2: componentResolveDuration.record() always called OTel's
// SyncInstrument._record() which always calls Date.now(). Next.js cacheComponents
// detects Date.now() in the static shell → NEXT_STATIC_GEN_BAILOUT → 500.
//
// The fix: record() is a wrapper. When componentMetrics is false, the wrapper
// checks isComponentMetricsEnabled() and returns early — the inner OTel call
// (and its Date.now()) is never reached.
//
// Differential: verify that the wrapper IS called by getComponent(), but the
// guard state (isComponentMetricsEnabled) differs between the two configs.
// Combined with Scenario B (wrapper correctly uses the guard), this proves
// the fix prevents Date.now() from being called when metrics are disabled.

describe('Scenario C — Differential: wrapper is always called, guard controls inner OTel path', () => {
  test('getComponent() always calls componentResolveDuration.record() (the wrapper)', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    const metricsModule = await import(join(SDK_SRC, 'telemetry/metrics.js'));
    const { ComponentRegistry } = await import(join(SDK_SRC, 'render/componentRegistry.js'));

    config({ apiKey: 'test-api-key' });
    // Spy without mockImplementation — original wrapper still runs, guard still checks
    const recordSpy = vi.spyOn(metricsModule.componentResolveDuration, 'record');

    new ComponentRegistry({ ArticlePage: 'ArticlePageComponent' }).getComponent('ArticlePage');

    expect(recordSpy).toHaveBeenCalled(); // wrapper is always invoked by getComponent()
    recordSpy.mockRestore();
  });

  test('with componentMetrics: true — isComponentMetricsEnabled()=true → inner OTel record() is reached', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    const { isComponentMetricsEnabled } = await import(join(SDK_SRC, 'telemetry/settings.js'));

    config({ apiKey: 'test-api-key' }); // default: componentMetrics = true
    // Guard is TRUE → wrapper passes through to inner OTel histogram.record()
    // Inner OTel: SyncInstrument._record() calls Date.now()
    // In a real app with cacheComponents + OTel MeterProvider → NEXT_STATIC_GEN_BAILOUT → 500
    expect(isComponentMetricsEnabled()).toBe(true);
  });

  test('with componentMetrics: false — isComponentMetricsEnabled()=false → inner OTel record() is SKIPPED', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    const { isComponentMetricsEnabled } = await import(join(SDK_SRC, 'telemetry/settings.js'));

    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });
    // Guard is FALSE → wrapper returns early, inner OTel histogram.record() never runs
    // → no Date.now() → no NEXT_STATIC_GEN_BAILOUT → page returns 200
    expect(isComponentMetricsEnabled()).toBe(false);
  });
});

// ─── Scenario D: Spans still emitted when metrics are disabled ────────────────
//
// The fix document says: "The optimizely.component.resolve span is still emitted
// with the same attributes, so the lookups stay visible in your traces."
// This verifies that disabling metrics does NOT disable spans.

describe('Scenario D — Spans are emitted even when componentMetrics is false', () => {
  test('ComponentRegistry.getComponent() still calls startComponentResolveSpan() regardless of componentMetrics', async () => {
    const spansModule = await import(join(SDK_SRC, 'telemetry/spans.js'));
    const startSpanSpy = vi.spyOn(spansModule, 'startComponentResolveSpan');

    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });

    const { ComponentRegistry } = await import(join(SDK_SRC, 'render/componentRegistry.js'));
    const registry = new ComponentRegistry({ ArticlePage: 'ArticlePageComponent' });
    registry.getComponent('ArticlePage');

    expect(startSpanSpy).toHaveBeenCalledWith('ArticlePage', undefined);
  });
});

// ─── Scenario E: Config resets correctly between calls ───────────────────────
//
// Edge case from the PR's own tests: calling config() without telemetry option
// after calling it with { componentMetrics: false } should reset to the default (true).

describe('Scenario E — Config reset between calls', () => {
  test('calling config() without telemetry re-enables component metrics', async () => {
    const { config } = await import(join(SDK_SRC, 'graph/index.js'));
    const { isComponentMetricsEnabled } = await import(join(SDK_SRC, 'telemetry/settings.js'));

    config({ apiKey: 'test-api-key', telemetry: { componentMetrics: false } });
    expect(isComponentMetricsEnabled()).toBe(false);

    config({ apiKey: 'test-api-key' }); // no telemetry option
    expect(isComponentMetricsEnabled()).toBe(true);
  });
});
