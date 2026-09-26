export type Platform = 'saas' | 'paas';

export interface SiteConfig {
  platform: Platform;
  cmsUrl: string;
  cmsApiUrl: string;
  graphGateway: string;
  graphKey: string;
  baseUrl: string;
  cmsUser: string;
  cmsPass: string;
  clientId: string;
  clientSecret: string;
}

export interface CmsPage {
  key: string;
  name: string;
  url: string;
  typename?: string;
}

export interface PageCheckResult {
  page: string;
  url: string;
  status: 'OK' | 'HTTP_ERROR' | 'BLANK' | 'HAS_ERRORS' | 'NAV_ERROR';
  httpStatus?: number;
  errors: string[];
}

export interface SmokeReport {
  site: string;
  timestamp: string;
  totalPages: number;
  passed: number;
  failed: number;
  results: PageCheckResult[];
}
