# QA Automation — CMS JS SDK

## Quick Start

### 1. Install dependencies

```bash
cd d:/github/JS-SDK/content-js-sdk
pnpm install
```

### 2. Configure environment

Mỗi template site cần file `.env` riêng. Test CLI/SDK đọc `.env` từ template:

```bash
# CLI tests dùng .env từ samples/nextjs-template/
cp samples/nextjs-template/.env.example samples/nextjs-template/.env

# Smoke tests dùng .env từ từng template
cp templates/stride/.env.example templates/stride/.env
```

Mở file `.env` và điền credentials:

```env
# Required cho CLI/SDK tests
OPTIMIZELY_CMS_URL=https://app-xxxxx.cmstest.optimizely.com
OPTIMIZELY_CMS_CLIENT_ID=xxx
OPTIMIZELY_CMS_CLIENT_SECRET=xxx
OPTIMIZELY_CMS_API_URL=https://api.cmstest.optimizely.com
OPTIMIZELY_GRAPH_GATEWAY=https://staging.cg.optimizely.com
OPTIMIZELY_GRAPH_SINGLE_KEY=xxx

# Optional — mặc định là saas
OPTIMIZELY_PLATFORM=saas

# Required cho E2E smoke tests
CMS_SMOKE_USER=cms.auto1+admin@optimizely.com
CMS_SMOKE_PASS=xxx
```

### 3. Chạy tests

**Từ thư mục repo root** (`content-js-sdk/`):

```bash
# Chạy CLI tests (push, pull, property types)
pnpm --filter cms-js-sdk-qa test:cli

# Chạy SDK tests (contract, content type API)
pnpm --filter cms-js-sdk-qa test:sdk

# Chạy E2E tests (cần install browser trước)
pnpm --filter cms-js-sdk-qa exec playwright install --with-deps chromium
pnpm --filter cms-js-sdk-qa test:e2e

# Chạy tất cả
pnpm --filter cms-js-sdk-qa test
```

**Hoặc từ thư mục `_qa/`:**

```bash
cd _qa

# CLI tests
pnpm test:cli

# SDK tests
pnpm test:sdk

# E2E tests
pnpm test:e2e

# Chỉ smoke tests
pnpm test:e2e:smoke

# Smoke cho 1 site cụ thể
pnpm test:e2e:smoke:stride
pnpm test:e2e:smoke:alloy

# E2E có hiện browser (debug)
pnpm test:e2e:headed
```

**Chạy 1 file test cụ thể:**

```bash
# Chỉ chạy push-property-types
pnpm test:cli -- push-property-types

# Chỉ chạy push-pull
pnpm test:cli -- push-pull
```

## Test Reports

Sau khi chạy xong, report tự động sinh vào `_qa/test-results/`:

```
test-results/
  cli-20260926-131358.html       ← CLI test report
  sdk-20260926-140012.html       ← SDK test report
  e2e-20260926-150030/           ← E2E report (folder)
  e2e-20260926-150030.xml        ← E2E JUnit XML
```

**Xem report:**

```bash
# CLI/SDK — mở file HTML trực tiếp trong browser
start test-results/cli-20260926-131358.html          # Windows
open test-results/cli-20260926-131358.html            # macOS

# E2E — dùng Playwright viewer
pnpm report:e2e
```

Mỗi lần chạy tạo file mới (không ghi đè), giúp so sánh kết quả qua các lần.

## Danh sách tests hiện có

| Suite | File | Mô tả |
|-------|------|--------|
| CLI | `push-pull.test.ts` | `opti-cms --version`, `--help`, `config pull`, `config push --dryRun` |
| CLI | `push-property-types.test.ts` | Push 14 property types lên CMS, verify qua Integration API (66 tests) |
| SDK | `cms-54651-multi-contract.test.ts` | Multi-contract content type API |
| E2E/smoke | `stride.spec.ts` | Smoke test site Stride |
| E2E/smoke | `alloy.spec.ts` | Smoke test site Alloy |
| E2E/sdk | `cms-54651-multi-contract.spec.ts` | Multi-contract browser test |

## Platform SaaS vs PaaS

Một số property types chỉ support trên PaaS (vd: `binary`). Đặt `OPTIMIZELY_PLATFORM` trong `.env`:

- `saas` (mặc định) — skip PaaS-only tests
- `paas` — chạy tất cả, thêm PaaS-only content types khi push

## CI — GitHub Actions

File: `.github/workflows/qa-tests.yaml`

1. Vào **Actions > QA Tests > Run workflow**
2. Chọn suite: `cli` / `sdk` / `e2e` / `all`
3. Sau khi chạy xong, download report từ **Artifacts** (giữ 30 ngày)

## Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `Failed to load .env` | Chưa tạo file `.env` cho template | Copy `.env.example` → `.env`, điền credentials |
| `401 Unauthorized` | Client ID/Secret sai hoặc hết hạn | Kiểm tra lại credentials trong `.env` |
| `binary not supported` | Chạy trên SaaS với PaaS-only type | Đặt `OPTIMIZELY_PLATFORM=saas` (mặc định) |
| `playwright: command not found` | Chưa install browser | `pnpm exec playwright install --with-deps chromium` |
| `Cannot find module` | Chưa install dependencies | `pnpm install` từ repo root |
