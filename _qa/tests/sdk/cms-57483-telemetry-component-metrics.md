# CMS-57483 — Fix Telemetry issues in JS SDK

## Bug Summary

Khi dùng `@optimizely/cms-sdk@3.0.2` với Next.js `cacheComponents: true` + OpenTelemetry `MeterProvider`, mọi CMS page (dynamic slug) trả về **500 Internal Server Error**.

---

## Điều kiện để bug xảy ra (cả 3 phải cùng tồn tại)

| # | Điều kiện | Chỗ cấu hình |
|---|---|---|
| 1 | `cacheComponents: true` | `next.config.ts` |
| 2 | `'use cache'` trong data fetch của page | `[...slug]/page.tsx` |
| 3 | Real OTel `MeterProvider` được register | `src/instrumentation.ts` |

Thiếu bất kỳ điều kiện nào → không có bug.

---

## Root Cause

**`@optimizely/cms-sdk@3.0.2`** — `ComponentRegistry.getComponent()` luôn gọi `recordMetrics()` vô điều kiện:

```js
// 3.0.2: dist/esm/telemetry/metrics.js
export const componentResolveDuration = meter.createHistogram(...)  // raw OTel

export const recordMetrics = (histogram, counter, startTime, attributes) => {
    histogram.record(duration, attributes)  // ← LUÔN gọi, không có guard
    counter.add(1, attributes)
}
```

`histogram.record()` → OTel `SyncInstrument._record()` → **`Date.now()`** để timestamp.

Next.js với `cacheComponents` patch `Date.now()` trong static shell prerender context. Khi detect `Date.now()` bị gọi → ném `NEXT_STATIC_GEN_BAILOUT` → **500**.

---

## Cơ chế kiến trúc

### Tại sao `'use cache'` trong data fetch lại ảnh hưởng đến `OptimizelyComponent`?

`'use cache'` trong `fetchPageContent()` là **trigger** để Next.js đổi rendering strategy của **cả page** sang "static shell prerender mode":

```
Không có 'use cache' trong page:
  → Page render bình thường → Date.now() allowed → OK

Có 'use cache' ở bất kỳ đâu trong Page():
  → Next.js: "Page này tham gia cacheComponents system"
  → Render toàn bộ Page() trong static shell prerender context
  → Date.now() bị PATCH và monitor cho toàn bộ context
  → OptimizelyComponent (dù không có 'use cache') cũng bị monitor
```

### Flow đầy đủ gây 500

```
next start
    │
    └─ src/instrumentation.ts → register() → NodeSDK.start()
         → Real MeterProvider registered globally

Request: /en/some-cms-page  (dynamic slug, không prerendered)
    │
    └─ Page({ params }) runs
         ├─ await params              ← request-time data
         │                              → page không thể prerender ở build time
         │                              → phải render ở runtime (OTel đã active)
         │
         ├─ fetchPageContent(path)    ← 'use cache'
         │     → Next.js: "static shell prerender mode"
         │     → Patch Date.now() cho toàn bộ Page render context
         │
         └─ <OptimizelyComponent content={content[0]} />
               └─ ComponentRegistry.getComponent('BlankExperience')
                     ├─ FOUND (type registered)
                     └─ recordMetrics(componentResolveDuration, ...)
                           └─ histogram.record(duration, attrs)
                                 └─ OTel SyncInstrument._record()
                                       └─ Date.now()  ← DETECTED!
                                             └─ NEXT_STATIC_GEN_BAILOUT
                                                   └─ 500 ❌
```

### Tại sao fixed route (`/cms-57483-test`) không bị?

```
/cms-57483-test (fixed route, no params):
  BUILD TIME: prerendered bởi build workers
              → instrumentation.ts CHƯA chạy trong workers
              → No OTel → histogram.record() = no-op → OK
              → HTML cached vào .next/

RUNTIME: serve cached HTML → không render lại
         → không gọi getComponent() → không gọi Date.now() → 200 ✅

/en/blankexp_richtext_all (dynamic slug):
  BUILD TIME: slug không biết → KHÔNG prerendered
  RUNTIME: phải render fresh → OTel ACTIVE → Date.now() → 500 ❌
```

---

## Steps tái hiện bug

### Chuẩn bị

```bash
# 1. Trỏ về SDK 3.0.2 (buggy)
# samples/nextjs-template/package.json
"@optimizely/cms-sdk": "3.0.2"

# 2. Bật cacheComponents + bỏ qua TS errors của QA files
# samples/nextjs-template/next.config.ts
cacheComponents: true,
typescript: { ignoreBuildErrors: true },

# 3. Wrap data fetch với 'use cache' (pattern của khách hàng)
# samples/nextjs-template/src/app/[...slug]/page.tsx
async function fetchPageContent(path: string) {
  'use cache';
  return client.getContentByPath(path);
}

# 4. Remove dynamicParams (incompatible với cacheComponents)
# Comment out: export const dynamicParams = true;

# 5. Thêm fallback cho generateStaticParams
return pages.length > 0 ? pages : [{ slug: ['cms-57483-placeholder'] }];

# 6. Opt out preview page
# samples/nextjs-template/src/app/preview/page.tsx
export const instant = false;

# 7. Đảm bảo instrumentation.ts có real OTel MeterProvider
# samples/nextjs-template/src/instrumentation.ts (đã có sẵn)

# 8. Install 3.0.2
cd d:/github/JS-SDK/tahh-content-js-sdk
pnpm install --no-frozen-lockfile
```

### Reproduce

```bash
cd samples/nextjs-template
pnpm build
npx next start -p 3001
```

Mở browser: `http://localhost:3001/en/<any-cms-page>`
→ **500 Internal Server Error** ✅

---

## Fix (PR #614)

Thêm guard `isComponentMetricsEnabled()` bao quanh mọi OTel metric call:

```ts
// workspace:* (fixed): dist/esm/telemetry/metrics.ts

// Wrapper thay vì raw OTel histogram
export const componentResolveDuration: Histogram = {
  record: (...args) => {
    if (isComponentMetricsEnabled())  // ← guard
      componentResolveHistogram.record(...args)
  }
}

// Config option mới
config({
  apiKey: '...',
  telemetry: { componentMetrics: false }  // ← tắt metrics → no Date.now()
})
```

---

## Verify fix

### Option A: Revert về workspace:* + thêm config option

```ts
// samples/nextjs-template/package.json
"@optimizely/cms-sdk": "workspace:*"

// samples/nextjs-template/src/app/layout.tsx
config(withQaConfig({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  telemetry: { componentMetrics: false },  // ← thêm dòng này
}));
```

```bash
pnpm install --no-frozen-lockfile
pnpm build
npx next start -p 3001
```

Mở `http://localhost:3001/en/<any-cms-page>` → **200** ✅

### Option B: Chạy automated tests

```bash
cd _qa
pnpm test:sdk -- cms-57483
# → 12/12 tests pass
```

---

## Automated Tests

File: [`_qa/tests/sdk/cms-57483-telemetry-component-metrics.test.ts`](_qa/tests/sdk/cms-57483-telemetry-component-metrics.test.ts)

| Scenario | Nội dung |
|---|---|
| A (5 tests) | `TelemetryOptions` exported, `config({ telemetry })` hoạt động, không lưu trong graph config |
| B (2 tests) | `componentResolveDuration.record()` và `componentLookupCount.add()` là guarded wrappers |
| C (3 tests) | Differential: wrapper được gọi bởi `getComponent()`, guard khác nhau với true/false |
| D (1 test) | Spans vẫn emit khi metrics disabled |
| E (1 test) | Config reset khi gọi `config()` lại không có telemetry |

```bash
pnpm test:sdk -- cms-57483
# 12/12 pass
```

---

## Cleanup sau khi test

```bash
# Revert package.json về workspace:*
# Revert next.config.ts (bỏ cacheComponents, typescript.ignoreBuildErrors)
# Revert [...]slug/page.tsx (restore dynamicParams, remove fallback, remove 'use cache' wrapper)
# Revert preview/page.tsx (bỏ instant=false)
# Revert src/app/layout.tsx (bỏ telemetry option nếu đã thêm)

cd d:/github/JS-SDK/tahh-content-js-sdk
pnpm install --no-frozen-lockfile
```
