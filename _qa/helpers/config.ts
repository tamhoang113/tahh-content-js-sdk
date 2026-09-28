import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { SiteConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load site config from a .env file.
 *
 * Supports two modes:
 *   loadSiteConfig('stride')  → reads from templates/stride/.env
 *   loadSiteConfig('/abs/path/to/.env') → reads from absolute path
 */
export function loadSiteConfig(templateOrPath: string): SiteConfig {
  let envPath: string;

  if (path.isAbsolute(templateOrPath)) {
    envPath = templateOrPath;
  } else {
    const monorepoRoot = path.resolve(__dirname, '..', '..');
    const templateMap: Record<string, string> = {
      stride: 'templates/stride/.env',
      alloy: 'templates/alloy/.env',
      'nextjs-template': 'samples/nextjs-template/.env',
    };
    const rel = templateMap[templateOrPath];
    if (!rel) {
      throw new Error(`Unknown template "${templateOrPath}". Use: ${Object.keys(templateMap).join(', ')}`);
    }
    envPath = path.join(monorepoRoot, rel);
  }

  const result = dotenv.config({ path: envPath });
  if (result.error) {
    throw new Error(`Failed to load .env from ${envPath}: ${result.error.message}`);
  }

  const env = result.parsed ?? {};

  const platformRaw = (env.OPTIMIZELY_PLATFORM ?? 'saas').toLowerCase();
  const platform = platformRaw === 'paas' ? 'paas' as const : 'saas' as const;

  return {
    platform,
    cmsUrl: (env.OPTIMIZELY_CMS_URL ?? '').replace(/\/$/, ''),
    cmsApiUrl: (env.OPTIMIZELY_CMS_API_URL ?? 'https://api.cms.optimizely.com').replace(/\/$/, ''),
    graphGateway: (env.OPTIMIZELY_GRAPH_GATEWAY ?? '').replace(/\/$/, ''),
    graphKey: env.OPTIMIZELY_GRAPH_SINGLE_KEY ?? '',
    baseUrl: env.APPLICATION_HOST ?? env.BASE_URL ?? 'https://localhost:3000',
    cmsUser: env.CMS_SMOKE_USER ?? process.env.CMS_SMOKE_USER ?? 'cms.auto1+admin@optimizely.com',
    cmsPass: env.CMS_SMOKE_PASS ?? process.env.CMS_SMOKE_PASS ?? '',
    clientId: env.OPTIMIZELY_CMS_CLIENT_ID ?? process.env.OPTIMIZELY_CMS_CLIENT_ID ?? '',
    clientSecret: env.OPTIMIZELY_CMS_CLIENT_SECRET ?? process.env.OPTIMIZELY_CMS_CLIENT_SECRET ?? '',
  };
}
