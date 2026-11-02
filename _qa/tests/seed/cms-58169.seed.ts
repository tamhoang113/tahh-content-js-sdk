import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import { CMS_58169 } from '../../fixtures/cms-58169.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer(CMS_58169.ticket);

describe('seed: CMS-58169 preview media token fixtures', () => {
  test('ensure page with imageRef exists', async () => {
    if (!container) {
      throw new Error('CMS_TEST_CONTAINER not set');
    }

    const fixtures = await ensureStoryFixtures(config, CMS_58169, { container });

    expect(fixtures.pageWithImage.key).toBeTruthy();
    console.log(`[seed] pageWithImage: key=${fixtures.pageWithImage.key} path=${fixtures.pageWithImage.path}`);
  }, 180_000);
});
