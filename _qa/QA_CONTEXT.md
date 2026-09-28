# JS SDK QA Automation — Context

> Đọc file này để khôi phục toàn bộ context về QA automation cho JS SDK.

---

## 1. Repo đang dùng

**Working repo:** `D:\github\JS-SDK\tahh-content-js-sdk`
- Fork cá nhân của `episerver/content-js-sdk` (GitHub: `tamhoang113/tahh-content-js-sdk`)
- Upstream `episerver/content-js-sdk` là repo của dev team — QA không push trực tiếp lên đó
- Fork tự động sync từ upstream mỗi ngày lúc **4:00 AM giờ Việt Nam** qua `.github/workflows/sync-upstream.yaml`
- Fork cũng dùng để deploy lên **Vercel**

**Local upstream (read-only):** `D:\github\JS-SDK\content-js-sdk`

---

## 1.1 Fork-Only Diff — Conflict-Proof cho `optimizely.config.mjs`

File `samples/nextjs-template/optimizely.config.mjs` do upstream sở hữu và thường xuyên chỉnh (sample propertyGroups/content/applications), nhưng QA cần chèn tweak fork-only:
1. Thêm glob `./src/qa/**` để `opti-cms config push` bắt được QA content types.
2. Bỏ `propertyGroups` / `content` / `applications` khi push — target automation không muốn bị đè bằng sample data.

**Anti-pattern (conflict mỗi ngày):** sửa array `components: [...]` hoặc field bên trong `buildConfig({...})`. Upstream sửa cùng dòng → sync 4h sáng luôn conflict.

**Pattern hiện tại (near-zero conflict):**
- `buildConfig({...})` giữ **giống hệt upstream 100%** (kể cả các field mặc định).
- Toàn bộ logic fork-only nằm **sau** `});`.
- Dữ liệu (globs QA) lấy từ **file sidecar JSON** upstream không có.

**Cấu trúc** [samples/nextjs-template/optimizely.config.mjs](../samples/nextjs-template/optimizely.config.mjs):
```javascript
import { buildConfig } from '@optimizely/cms-sdk';
import { existsSync, readFileSync } from 'node:fs';    // (1) fork-only

const config = buildConfig({                            // (2) `const config` thay vì `export default`
  // ── BÊN TRONG GIỐNG HỆT UPSTREAM ──
  components: ['./src/components/**.tsx', './src/components/**.ts'],
  propertyGroups: [ /* sample upstream */ ],
  content:        [ /* sample upstream */ ],
  applications:   [ /* sample upstream */ ],
});

// ─── LOCAL QA FORK ONLY ─────────────────────────────────────  (3) block mới sau `});`
const extrasUrl = new URL('./optimizely.qa-extras.json', import.meta.url);
if (existsSync(extrasUrl)) {
  const extras = JSON.parse(readFileSync(extrasUrl, 'utf8'));
  if (extras.components?.length) config.components.push(...extras.components);
}

// Mặc định strip sample data; set QA_PUSH_ALL=1 để giữ.
if (process.env.QA_PUSH_ALL !== '1') {
  config.propertyGroups = [];
  config.content = [];
  config.applications = [];
}

export default config;
```

**Sidecar** [samples/nextjs-template/optimizely.qa-extras.json](../samples/nextjs-template/optimizely.qa-extras.json) — file fork-only, upstream không có nên không bao giờ conflict:
```json
{
  "components": ["./src/qa/**.tsx", "./src/qa/**.ts"]
}
```

**Cách dùng:**
| Việc cần làm | Lệnh |
|---|---|
| Auto / test / push bình thường | `npx @optimizely/cms-cli config push` (không cần env var) |
| Push đầy đủ (rare, vd bootstrap demo site mới) | `$env:QA_PUSH_ALL="1"; npx @optimizely/cms-cli config push; Remove-Item Env:QA_PUSH_ALL` |
| Thêm QA glob mới | Chỉ sửa `optimizely.qa-extras.json`; không đụng `.mjs` |

**Nguy cơ conflict còn lại (~5-10%/năm, mỗi lần fix < 1 phút):** upstream đổi tên `buildConfig` → `defineConfig`, split cú pháp export, thêm import mới ở đầu, hoặc thêm code sau `});`. Sửa 30 giây bằng tay.

**Khi nào KHÔNG dùng pattern này:** file upstream refactor line-by-line không đoán được (vd `layout.tsx`) → dùng spread-injection từ registry fork-owned thay vì sidecar (xem section 6.2).

---

## 2. Cấu trúc file QA

```
tahh-content-js-sdk/
├── _qa/                                        ← QA automation project (pnpm workspace)
│   ├── package.json                            ← @playwright/test, vitest, dotenv, typescript
│   ├── playwright.config.ts                    ← E2E + SDK API tests config
│   ├── vitest.config.ts                        ← CLI tests config
│   ├── tsconfig.json                           ← module: NodeNext, no baseUrl
│   ├── helpers/
│   │   ├── index.ts                            ← barrel export
│   │   ├── types.ts                            ← SiteConfig
│   │   ├── config.ts                           ← loadSiteConfig('nextjs-template'|'stride')
│   │   ├── sdk-api.ts                          ← callSdkApi, getContentByPath, getContent, getItems
│   │   ├── graph-api.ts                        ← graphQuery, fetchSitePages, findContentPathByDisplayName
│   │   ├── pull-ts.ts                          ← pullTs() — TTY patch wrapper cho opti-cms pull
│   │   ├── cli-runner.ts                       ← runCli(command, projectDir)
│   │   ├── cms-auth.ts                         ← loginToCms(page, config) — Okta SSO
│   │   └── cms-navigation.ts                   ← openContentById(page, config, id)
│   ├── scripts/
│   │   ├── cli-pull-ts.mjs                     ← TTY patch script dùng bởi pullTs()
│   │   └── generate-report.mjs                 ← tạo HTML report từ vitest JSON output
│   └── tests/
│       ├── cli/
│       │   ├── pull-roundtrip.test.ts          ← 30 tests: push content type → pull → verify manifest
│       │   ├── push-property-types.test.ts     ← push validation tests
│       │   └── push-pull.test.ts               ← basic push/pull tests
│       ├── sdk/
│       │   ├── cms-54651-multi-contract.test.ts ← SDK API tests (Playwright runner)
│       │   └── cms-54844-section-properties-flat.test.ts ← SDK API test, resolves content by displayName (vitest)
│       └── e2e/
│           ├── smoke/stride.spec.ts
│           └── sdk/
│               ├── cms-54651-multi-contract.spec.ts
│               └── cms-54844-section-properties-flat.spec.ts
│
└── samples/nextjs-template/
    ├── .env                                    ← credentials (OPTIMIZELY_GRAPH_SINGLE_KEY, etc.)
    └── src/
        ├── app/
        │   ├── layout.tsx                      ← PATCHED: spreads QA_CONTENT_TYPES + QA_RESOLVERS
        │   └── qa/apis/run/route.ts            ← SDK API proxy route (/qa/apis/run)
        └── qa/
            ├── _registry.ts                    ← ⭐ single source of truth cho tất cả QA types
            ├── _api-registry.ts                ← dùng bởi route.ts (app types + QA types)
            ├── Auto_Push_PropertyTypes.tsx     ← content types cho CLI push/pull tests
            ├── CMS_49490_CircularFragmentFix.tsx
            ├── CMS_54651_MultiContract.tsx
            ├── CMS_54935_ArrayContractExpansion.tsx
            └── CMS_54844_SectionPropertiesFlat.tsx
```

---

## 3. Registry Pattern (quan trọng)

`initContentTypeRegistry()` và `initReactComponentRegistry()` đều **ghi đè hoàn toàn** khi gọi lại — không merge. Không được gọi 2 lần.

**Giải pháp:** Mọi QA content type đều đăng ký qua `_registry.ts`:

```typescript
// src/qa/_registry.ts — chỉ sửa file này khi thêm ticket mới
export const QA_CONTENT_TYPES = [
  // contracts + content types (cả hai)
  CMS49490MapPage, AutoBaseContract, AutoStringAllFields, ...
];

export const QA_RESOLVERS = {
  // chỉ renderable types — KHÔNG có contracts
  CMS49490MapPage: CMS49490MapPageComponent,
  ...
};
```

`layout.tsx` chỉ có 3 dòng QA (không bao giờ cần sửa thêm):
```typescript
import { QA_CONTENT_TYPES, QA_RESOLVERS } from '@/qa/_registry';
initContentTypeRegistry([...appTypes, ...QA_CONTENT_TYPES]);
initReactComponentRegistry({ resolver: { ...appResolver, ...QA_RESOLVERS } });
```

`_api-registry.ts` dùng cho route handler `/qa/apis/run`:
```typescript
export function ensureContentTypesRegistered() {
  initContentTypeRegistry([...APP_CONTENT_TYPES, ...QA_CONTENT_TYPES]);
}
```

---

## 4. Run Commands

```bash
# Từ _qa/
pnpm test:cli                         # tất cả CLI tests (vitest)
pnpm test:cli -- pull-roundtrip       # chỉ pull-roundtrip
pnpm test:sdk                         # SDK API tests (Playwright)
pnpm test:e2e                         # E2E tests (Playwright)
KEEP_PULL_OUTPUT=1 pnpm test:cli      # giữ lại file TS đã generate để xem

# Từ samples/nextjs-template/
npx @optimizely/cms-cli config push   # push content types lên CMS
npx tsc --noEmit                      # kiểm tra TypeScript
```

---

## 5. Kiến trúc test (3 layer)

| Layer | Test gì | Runner | Cần gì |
|---|---|---|---|
| **CLI** | opti-cms push/pull, manifest round-trip | vitest | Node.js |
| **SDK API** | getContentByPath, getContent, contract expansion | Playwright (no browser) | Dev server chạy |
| **E2E** | React rendering, live preview | Playwright (browser) | Dev server + CMS site |

**Ưu tiên Layer SDK API** — không cần browser, cover hầu hết SDK bugs.

**Manual data model:** QA tạo content trên CMS UI một lần → tests verify API response tự động. Không dùng API để tạo content (flaky, tách biệt mối lo).

---

## 6. Thêm ticket QA mới

### CLI layer (bug về push/pull)
1. Thêm content type vào `src/qa/Auto_Push_PropertyTypes.tsx`
2. Thêm `test()` block vào `_qa/tests/cli/pull-roundtrip.test.ts`
3. Thêm vào `QA_CONTENT_TYPES` trong `_registry.ts`
4. Chạy `pnpm test:cli -- pull-roundtrip`

### SDK API layer (bug về getContentByPath, contracts)
1. Tạo `src/qa/CMS_{ID}_{ShortDesc}.tsx` (content types + React components)
2. Thêm vào `QA_CONTENT_TYPES` + `QA_RESOLVERS` trong `_registry.ts`
3. Chạy `opti-cms push` để đăng ký lên CMS SaaS
4. Tạo test content trên CMS UI
5. Tạo `_qa/tests/sdk/cms-{id}-{short-desc}.test.ts`
6. Chạy `pnpm test:sdk`

### Naming convention
- TSX: `CMS_{ID}_{ShortDesc}.tsx` — ShortDesc là PascalCase 3-5 từ
- Exports: prefix `CMS{ID}` (vd: `CMS54935CardContainer`)
- Test file: `cms-{id}-{short-desc}.test.ts`
- **CMS UI content (display name)**: cùng convention `CMS{ID}_{ShortDesc}` — khớp với tên TSX/test để dễ tra cứu 2 chiều (vd: content type `CMS54844_SectionPropertiesFlat` → folder/page trong CMS UI cũng đặt tên `CMS54844_SectionPropertiesFlat`)
- **CMS UI folder tổ chức**: gom toàn bộ content test-fixture vào 1 folder cố định (vd: `CheckBugs`), mỗi ticket 1 sub-item/sub-folder cùng tên `CMS{ID}_{ShortDesc}` — dễ nhận biết "đừng xoá", tránh lẫn với content demo thường

---

## 6.1 Resolve test content theo `displayName`, KHÔNG hardcode path

**Vấn đề:** Hardcode path (`/en/my-test-page`) trong test code sẽ vỡ khi ai đó move content sang folder khác trong CMS — path `hierarchical` được tính lại theo cây ancestor. `displayName` thì ổn định hơn nhiều vì theo naming convention cố định và hiếm khi đổi.

**Pattern chuẩn (SDK layer test):**
```typescript
import { findContentPathByDisplayName } from '../../helpers/graph-api.js';
import { getContentByPath } from '../../helpers/sdk-api.js';

const TEST_DISPLAY_NAME = process.env.CMS54844_TEST_DISPLAY_NAME ?? 'LandingExp_CustomSection';

const lookup = await findContentPathByDisplayName(config, TEST_DISPLAY_NAME);
// lookup: { key, displayName, path, types }
const results = await getContentByPath(config, lookup!.path); // vẫn test đúng SDK code path thật
```

- `findContentPathByDisplayName` dùng raw GraphQL query filter `_metadata.displayName.eq` (không đi qua SDK) — chỉ để "tìm path", còn assertion chính vẫn phải gọi `getContentByPath` (qua `/qa/apis/run`) để test đúng SDK code path.
- Env var convention: `{TICKET}_TEST_DISPLAY_NAME` để override khi cần (không phải path).
- Lưu ý: `getContentByPath` trong SDK thật ra match cả `url.default` lẫn `url.hierarchical` (xem `packages/optimizely-cms-sdk/src/graph/filters.ts`) nên nhiều trường hợp move folder vẫn không vỡ path `default` — nhưng dùng displayName vẫn an toàn hơn và không cần biết cơ chế URL bên dưới.

---

## 6.2 QUAN TRỌNG: 2 GraphClient tách biệt hoàn toàn — `layout.tsx` vs `route.ts`

App có **2 nơi khởi tạo Graph client độc lập, KHÔNG chia sẻ config cho nhau**:

| Client | File | Dùng khi nào | Config nguồn |
|---|---|---|---|
| Global singleton qua `config()` | `src/app/layout.tsx` | App render page thật (SSR/RSC bình thường qua Next.js) | Chỉ đọc trong `layout.tsx` |
| `new GraphClient(...)` thủ công | `src/app/qa/apis/run/route.ts` (`getClient()`) | MỌI test SDK API layer đi qua `/qa/apis/run` (`callSdkApi`, `getContentByPath`, `getContentByDisplayName`) | Chỉ đọc trong `route.ts` |

```typescript
// layout.tsx — KHÔNG ảnh hưởng tới test SDK API
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  fragment: { richTextFormat: 'both' },
});

// route.ts — đây mới là config thật sự áp dụng cho mọi test SDK API
function getClient(apiKey?: string) {
  return new GraphClient(apiKey ?? GRAPH_KEY, {
    graphUrl: GRAPH_URL,
    fragment: { expandContracts: true }, // set ở CMS-54935 — xem Key Gotchas
  });
}
```

**Hệ quả quan trọng:** Nếu ticket sau này cần bật/đổi thêm setting SDK khác cho test (vd `richTextFormat`, `compositionDepth`, `maxThreshold`, `dam`) — PHẢI sửa `route.ts`'s `getClient()`. Sửa `layout.tsx` sẽ **không có tác dụng gì** với bất kỳ test nào trong `_qa/tests/sdk/` hay `_qa/tests/e2e/sdk/`, vì các test đó luôn gọi qua `/qa/apis/run`, không phải qua page render thật.

---

## 6.3 NGUYÊN TẮC CỐT LÕI: KHÔNG BAO GIỜ để test báo pass giả

**Test báo pass giả còn tệ hơn không có test.** Test đó cho cảm giác an tâm sai, che giấu bug regression thật, làm mất niềm tin vào toàn bộ suite. Trước mỗi khi merge/rely vào 1 test mới, luôn tự hỏi:

> "Nếu bug ticket này quay lại, test có PHẢI fail không? Hay chỉ CÓ THỂ fail?"

Nếu câu trả lời là "có thể" — test đó chưa đủ chặt, cần siết lại. Các nguồn "pass giả" phổ biến đã gặp thật trong suite này:

### 3 nguồn pass giả thường gặp (kèm dấu hiệu và cách phòng)

| Nguồn | Dấu hiệu | Cách phòng |
|---|---|---|
| **Assertion chỉ check "không có lỗi"** (`expect(body).not.toContain('Error')`) | Test luôn pass kể cả khi navigate sai trang, page trắng | LUÔN assert nội dung dương ("phải chứa X, Y, Z"), không chỉ assert phủ định |
| **Assertion check label thay vì value** (`toContain('Teaser Contract')`) | Section shell render bình thường nhưng value regression thì test vẫn pass | Assert cả LABEL lẫn VALUE — nếu chỉ có value đủ thông tin, bỏ luôn label check |
| **`try/catch` bao trọn cả wait + assertion** làm best-effort | Khi setup (preview iframe, login...) chậm/fail, mọi assertion bên trong bị nuốt lỗi im lặng | KHÔNG BAO GIỜ bao expect() trong try/catch. Nếu setup có thể fail hợp lý, tách 2 giai đoạn: setup có timeout riêng (throw khi hết) → assertion NẰM NGOÀI try/catch |

### Cách kiểm chứng test có "pass giả" hay không (bắt buộc trước khi merge test edit-mode)

Tạm đổi 1 giá trị EXPECTED trong test sang giá trị SAI (vd thêm số/chữ vào cuối), chạy test:

- ✅ **Test FAIL với message rõ ràng nói đúng field nào sai** → test chặt, an toàn
- ❌ **Test vẫn PASS** → test đang che giấu lỗi, PHẢI sửa trước khi merge

Sau khi verify hard-fail đúng, đổi lại giá trị đúng, test PASS thật mới là kết quả có ý nghĩa.

### Ví dụ thực tế đã suýt merge bug pass-giả (2026-09-28)

Test CMS-54651 edit-mode ban đầu bọc như sau:
```typescript
try {
  const { text } = await getPreviewFrameText(page, key, 10_000);
  expect(text).toContain('another-contract-field');   // ← bị nuốt khi preview treo
} catch (err) {
  console.warn(`Preview check skipped: ${err.message}`);  // ← chỉ warn, không fail
}
```

Khi preview iframe bị Chrome Local Network Access permission chặn (xem §6.4), `getPreviewFrameText` throw, `catch` nuốt luôn, **test pass dù giá trị `anotherField` bị đổi sai cố ý**. Phát hiện chỉ vì QA (bạn) chủ động thử với giá trị sai. Đã fix: tách wait khỏi assertion, hard-fail preview, assertion nằm ngoài try/catch.

---

## 6.4 Playwright Edit-Mode Preview — pattern & gotchas

Test edit-mode phức tạp hơn view-mode nhiều vì phải điều hướng CMS UI + login Okta + đọc nội dung từ preview iframe (điểm bên ngoài main frame). Pattern chuẩn sau nhiều lần debug:

### Điều hướng bằng GUID key, KHÔNG bằng content ID số cũng KHÔNG bằng path

```typescript
const lookup = await findContentPathByDisplayName(config, DISPLAY_NAME);
await loginToCms(page, config);           // BẮT BUỘC login TRƯỚC
await openContentById(page, config, lookup!.key);  // rồi mới navigate với hash GUID
```

- `openContentById` tự chuẩn hoá GUID thành dashed format (`8-4-4-4-12`) — Graph trả về dashless, còn CMS edit URL yêu cầu dashed. Sai format sẽ silent fallback về content ID `6` (site root)
- **Thứ tự login → openContentById là bắt buộc**: nếu chưa auth mà điều hướng thẳng tới URL có hash `#context=...`, OAuth redirect **làm mất hash fragment** (browser không gửi hash qua network) → sau login lại rơi vào content mặc định

### Login Okta: dùng `getByRole('button', ...)`, KHÔNG dùng CSS selector theo tag

Nút "Next"/"Verify" trên Okta widget **không phải thẻ `<button>`** — có thể là `<input type="submit">` hoặc custom element. Selector `button:has-text('Next')` luôn match 0 phần tử dù mắt/screenshot thấy rõ nút. Dùng role-based:

```typescript
await page.getByRole('button', { name: /Next/i }).click();
await page.getByRole('button', { name: /Verify|Sign in/i }).click();
```

### Preview iframe: match theo URL pattern, KHÔNG theo `name` attribute

Trước đây match `page.frame({ name: 'sitePreview' })` — nhưng ở view mới (Visual Builder / On-Page Editing) attribute này có thể đổi/mất. Match ổn định hơn bằng URL:

```typescript
const previewFrame = page.frames().find(f => /\/preview\?key=/.test(f.url()));
```

Helper `waitForPreviewFrame` + `getPreviewFrameText(page, expectedKey)` trong `_qa/helpers/page-checker.ts` đã dùng pattern này. Bonus: `getPreviewFrameText` verify URL chứa `expectedKey` như 1 bước xác nhận "đúng trang" trước khi đọc text (nhanh, deterministic, không race).

### Chrome "Local Network Access" prompt chặn iframe `localhost:3001`

Chrome 136+ show 1 native permission prompt khi trang public-origin (CMS test cloud) embed iframe trỏ tới private/local (dev server tại `localhost:3001`):

> "app-...cmstest.optimizely.com wants to: Access other apps and services on this device"

Popup này KHÔNG phải JS dialog — `page.on('dialog')` không bắt được. Playwright context sạch không có ai click "Allow" → iframe treo mãi ở `about:blank`. Fix trong `openContentById`:

```typescript
// Grant qua CDP trước khi navigate — Chrome tôn trọng permission đã grant
const cdp = await page.context().newCDPSession(page);
for (const permission of ['localNetworkAccess', 'privateNetworkAccess']) {
  try { await cdp.send('Browser.grantPermissions', { origin, permissions: [permission] }); } catch {}
}
```

Kết hợp với launch flags trong `playwright.config.ts`:
```
--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessPermission,PrivateNetworkAccessSendPreflights,...
```

Cả 2 lớp cùng đảm bảo prompt không xuất hiện — flag khác nhau ở các version Chrome khác nhau, nên phải cover cả hai family (Local... và Private...).

### `createErrorCollector` phải filter theo URL response, không theo console text

Console message kiểu `"Failed to load resource: the server responded with a status of 404 ()"` **không kèm URL** — dù `IGNORED_ERRORS` đã có sẵn pattern như `/api/cms/extensions`, nó không match được. Fix: thêm `page.on('response')` listener bắt `status >= 400` với URL thật, filter qua đúng pattern; console listener skip message dạng "Failed to load resource" để tránh trùng lặp.

---

## 7. Key Gotchas

| Vấn đề | Chi tiết |
|---|---|
| `opti-cms pull` cần TTY | Dùng `pullTs()` wrapper — direct execFileSync trả về JSON thay vì file |
| `_self` trong mayContainTypes | CMS resolve `'_self'` → key thực tế khi pull (vd: `'AutoFolderBaseType'`) |
| `opti-cms push` dùng bundler | TypeScript errors không ngăn push — chạy `tsc --noEmit` riêng |
| Array item validation | `items.minLength`, `items.maxLength`, `items.pattern` cho string; `items.minimum`, `items.maximum` cho int/float |
| JIRA link type | Dùng `1-Relates` (không phải `Relates to`) |
| Contracts | Thêm vào `QA_CONTENT_TYPES` — KHÔNG thêm vào `QA_RESOLVERS` |
| Windows EPERM | Dùng `execSync('rmdir /s /q ...', { shell: 'cmd.exe' })` thay rmSync |
| Build SDK | Fork cần `pnpm --filter @optimizely/cms-sdk build` trước khi tsc check |
| Self-signed HTTPS dev server | `next dev --experimental-https` dùng cert tự ký → Node fetch reject mặc định. KHÔNG set `NODE_TLS_REJECT_UNAUTHORIZED=0` global trong `.env` (tắt TLS verify luôn cho Graph/CMS thật). Thay vào đó, `sdk-api.ts` chỉ bypass TLS scoped cho request tới `https://localhost`/`127.0.0.1`, restore lại ngay sau |
| `graphQuery` 403 do double `/content/v2` | Nếu `.env`'s `OPTIMIZELY_GRAPH_GATEWAY` đã có sẵn suffix `/content/v2`, code cũ nối thêm 1 lần nữa → URL sai → 403. `graph-api.ts` đã fix bằng `buildGraphEndpoint()` (chỉ append khi thiếu), giống cách SDK chính fix ở CMS-54607 |
| Assertion message phải phân biệt rõ 2 loại lỗi | (1) **Bug regression** (property nested sai chỗ / undefined) vs (2) **CMS fixture data issue** (property tồn tại đúng chỗ nhưng giá trị sai do nhập nhầm khi tạo content). Message loại (2) phải note rõ "not a bug regression" + kèm context (`displayName`, `key`, `path`) để biết ngay cần sửa content nào, tránh báo nhầm thành bug code |
| `optimizely.config.mjs` chỉ scan `src/components/**` | QA content types nằm ở `src/qa/**` KHÔNG được `opti-cms push` cho tới khi thêm `'./src/qa/**.tsx'` + `'./src/qa/**.ts'` vào mảng `components`. Đã fix — an toàn với daily upstream sync vì `sync-upstream.yaml` dùng `git merge` (không hard reset), nên diff cục bộ này không bị mất |
| `expandContracts` mặc định `false` ở `/qa/apis/run` | Route tạo `GraphClient` riêng (không dùng chung config `layout.tsx`) và không set `fragment: { expandContracts: true }` — nên test contract-in-array (CMS-54935) luôn thấy property `undefined` dù bug code đã fix, vì query không request expansion. Đã fix trong `route.ts`'s `getClient()`. Không ảnh hưởng ticket dùng `extends` (schema merge, khác cơ chế với `allowedTypes` + `expandContracts`) |
| Test edit-mode: **KHÔNG bao expect() trong try/catch** | Bao trọn wait + assertion trong 1 khối `try/catch { ...; catch: console.warn }` biến mọi assertion thành best-effort → pass giả khi setup fail. Tách riêng: wait có timeout riêng, assertion NẰM NGOÀI catch. Xem §6.3 để verify test không pass-giả trước khi merge |
| Preview iframe match theo URL, không theo `name` | View mới (Visual Builder / On-Page Editing) không đảm bảo còn `name="sitePreview"`. `waitForPreviewFrame` giờ tìm frame có URL match `/\/preview\?key=/` — ổn định qua các version CMS |
| Chrome Local Network Access prompt chặn iframe → treo `about:blank` | CMS trên public-origin embed iframe `localhost:3001` → Chrome 136+ show native permission prompt, context tự động không click được. Grant `localNetworkAccess`+`privateNetworkAccess` qua CDP trong `openContentById` + disable-features flags trong `playwright.config.ts` |
| Login Okta dùng `getByRole('button', ...)` | Nút "Next"/"Verify" không phải thẻ `<button>` gốc. Selector `button:has-text('Next')` luôn match 0 phần tử. Dùng role-based (ARIA), độc lập với tag HTML |
| Thứ tự bắt buộc: `loginToCms` → `openContentById` | URL hash `#context=...` bị browser bỏ khi OAuth redirect. Nếu điều hướng thẳng URL có hash lúc chưa auth → sau login rơi về content default (id=6). Luôn login trước (URL không hash), navigate GUID sau |
| `openContentById` yêu cầu GUID dashed format | Graph trả về key dashless 32-char hex, CMS edit URL yêu cầu `8-4-4-4-12`. Đã chuẩn hoá tự động trong `openContentById`. Truyền dashless raw sẽ silent fallback về content id `6` |
| `createErrorCollector` filter theo URL response, không theo console text | Console "Failed to load resource: 404" không kèm URL nên `IGNORED_ERRORS` không match. Fix: bắt `page.on('response')` với status ≥ 400, filter theo URL thật; skip console message dạng "Failed to load resource" tránh trùng lặp |

---

## 7.1 CHECKLIST bắt buộc trước khi merge 1 test edit-mode mới

Đây là 3 câu hỏi mọi test edit-mode phải trả lời "có" trước khi được merge:

- [ ] **Assert value THẬT, không chỉ label**? (vd assert `"another-contract-field"`, không phải chỉ `"Another Contract"`)
- [ ] **Không có `try/catch` bao ngoài `expect()`**? (nếu bao thì đã tách wait/setup ra ngoài chưa?)
- [ ] **Đã verify hard-fail bằng cách đổi 1 EXPECTED sang giá trị sai và thấy test fail đúng field**?

Nếu chưa làm bước 3, test có thể đang pass giả mà chưa biết. Xem §6.3 để hiểu chi tiết vì sao.

---

## 8. JIRA Tasks đã làm (2026-09-26)

| Ticket | Nội dung | Link |
|---|---|---|
| CMS-56625 | CLI: vitest infrastructure + HTML reporter | QAK-15125 |
| CMS-56626 | CLI: pull-roundtrip tests (30 tests) | QAK-15125 |
| CMS-56627 | CLI: push-property-types tests | QAK-15125 |
| CMS-56628 | CLI: push-pull basic tests | QAK-15125 |

Labels: `CLI` + `BasicCommands` / `Push` / `Pull`

---

## 9. Skill trong automation-solu

Skill `auto-generate-js-sdk-testscript` tại:
`d:\github\automation-solu\.claude\skills\auto-generate-js-sdk-testscript\`

- `SKILL.md` — workflow 6 bước: path discovery → analyze ticket → generate code → push → create test → run
- `guidelines.md` — code patterns, registry rules, gotchas, run commands
- Step 0 tự tìm `JS_SDK_ROOT` bằng cách search `pnpm-workspace.yaml` — không hardcode path
