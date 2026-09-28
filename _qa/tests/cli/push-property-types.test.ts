/**
 * CLI Push — Property Type Verification
 *
 * Pushes content types with Auto prefix to CMS via `opti-cms push`,
 * then verifies via Integration API that all property fields are preserved.
 *
 * Content type definitions: samples/nextjs-template/src/qa/Auto_Push_PropertyTypes.tsx
 *
 * Prerequisites:
 *   - .env with OPTIMIZELY_CMS_URL, CLIENT_ID, CLIENT_SECRET
 *
 * Run:
 *   pnpm test:cli -- push-property-types
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { runCli, resolveProjectDir } from '../../helpers/cli-runner.js';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentType } from '../../helpers/cms-api.js';
import type { SiteConfig } from '../../helpers/types.js';

const config: SiteConfig = loadSiteConfig('nextjs-template');
const projectDir = resolveProjectDir('samples/nextjs-template');

// ─── Push once before all tests ──────────────────────────────────────────────

beforeAll(() => {
  const result = runCli('config push', projectDir);
  const output = result.stdout + result.stderr;
  const uploaded =
    output.includes('Configuration file uploaded') ||
    output.includes('Successfully imported');
  expect(uploaded, `Push did not upload config:\n${output}`).toBe(true);
}, 120_000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findProperty(ct: any, key: string): any | undefined {
  if (Array.isArray(ct.properties)) {
    return ct.properties.find(
      (p: any) => p.key === key || p.name === key || p.key?.toLowerCase() === key.toLowerCase(),
    );
  }
  if (ct.properties && typeof ct.properties === 'object') {
    return ct.properties[key];
  }
  return undefined;
}

function extractEnum(prop: any): any[] {
  if (Array.isArray(prop.enum)) return prop.enum;
  if (prop.enum?.values) {
    if (Array.isArray(prop.enum.values)) return prop.enum.values;
    return Object.entries(prop.enum.values).map(([k, v]) => ({ value: k, displayName: v }));
  }
  if (prop.allowedValues) return prop.allowedValues;
  return [];
}

// ─── Contract verification ──────────────────────────────────────────────────

describe('AutoBaseContract — contract exists on CMS', () => {
  test('contract type found', async () => {
    const ct = await getContentType(config, 'AutoBaseContract');
    expect(ct, 'AutoBaseContract not found on CMS').toBeTruthy();
    expect(ct.key).toBe('AutoBaseContract');
  });
});

// ─── Case 1: AutoStringAllFields ─────────────────────────────────────────────

describe('AutoStringAllFields — string property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoStringAllFields');
    expect(ct, 'AutoStringAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoStringAllFields');
    expect(ct.displayName).toBe('Auto String All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('extends AutoBaseContract', () => {
    const contracts = ct.contracts ?? ct.extends ?? [];
    expect(contracts).toContain('AutoBaseContract');
  });

  test('simpleString — minimal string, no extra fields', () => {
    const prop = findProperty(ct, 'simpleString');
    expect(prop, 'simpleString not found').toBeTruthy();
    expect(prop.type).toBe('string');
  });

  test('fullString — all base fields + string-specific fields', () => {
    const prop = findProperty(ct, 'fullString');
    expect(prop, 'fullString not found').toBeTruthy();
    expect(prop.type).toBe('string');
    expect(prop.displayName).toBe('Full String');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);

    const validation = prop.validation ?? prop;
    expect(validation.minLength ?? prop.minLength).toBe(1);
    expect(validation.maxLength ?? prop.maxLength).toBe(500);
    expect(validation.pattern ?? prop.pattern).toBe('^[A-Za-z0-9 ]+$');
  });

  test('enumString — string with enum choices', () => {
    const prop = findProperty(ct, 'enumString');
    expect(prop, 'enumString not found').toBeTruthy();

    const enumValues = extractEnum(prop);
    expect(enumValues.length).toBe(3);

    const values = enumValues.map((e: any) => e.value ?? e.key ?? e);
    expect(values).toContain('option_a');
    expect(values).toContain('option_b');
    expect(values).toContain('option_c');
  });

  test('hiddenString — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenString');
    expect(prop, 'hiddenString not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });

  test('queryableString — indexingType queryable', () => {
    const prop = findProperty(ct, 'queryableString');
    expect(prop, 'queryableString not found').toBeTruthy();
    expect(prop.indexingType).toMatch(/queryable/i);
  });

  test('noIndexString — indexingType disabled', () => {
    const prop = findProperty(ct, 'noIndexString');
    expect(prop, 'noIndexString not found').toBeTruthy();
    expect(prop.indexingType).toMatch(/disabled/i);
  });

  test('contractField — inherited from AutoBaseContract', () => {
    const prop = findProperty(ct, 'contractField');
    expect(prop, 'contractField not found — contract extends broken').toBeTruthy();
    expect(prop.type).toBe('string');
  });
});

// ─── Case 2: AutoBooleanAllFields ────────────────────────────────────────────

describe('AutoBooleanAllFields — boolean property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoBooleanAllFields');
    expect(ct, 'AutoBooleanAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoBooleanAllFields');
    expect(ct.displayName).toBe('Auto Boolean All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleBool — minimal boolean', () => {
    const prop = findProperty(ct, 'simpleBool');
    expect(prop, 'simpleBool not found').toBeTruthy();
    expect(prop.type).toBe('boolean');
  });

  test('fullBool — all base fields', () => {
    const prop = findProperty(ct, 'fullBool');
    expect(prop, 'fullBool not found').toBeTruthy();
    expect(prop.type).toBe('boolean');
    expect(prop.displayName).toBe('Full Boolean');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);
    expect(prop.indexingType).toMatch(/queryable/i);
  });

  test('hiddenBool — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenBool');
    expect(prop, 'hiddenBool not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 3: AutoIntegerAllFields ────────────────────────────────────────────

describe('AutoIntegerAllFields — integer property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoIntegerAllFields');
    expect(ct, 'AutoIntegerAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoIntegerAllFields');
    expect(ct.displayName).toBe('Auto Integer All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleInt — minimal integer', () => {
    const prop = findProperty(ct, 'simpleInt');
    expect(prop, 'simpleInt not found').toBeTruthy();
    expect(prop.type).toBe('integer');
  });

  test('fullInt — all base fields + min/max', () => {
    const prop = findProperty(ct, 'fullInt');
    expect(prop, 'fullInt not found').toBeTruthy();
    expect(prop.type).toBe('integer');
    expect(prop.displayName).toBe('Full Integer');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);
    expect(prop.indexingType).toMatch(/searchable/i);

    const validation = prop.validation ?? prop;
    expect(validation.minimum ?? prop.minimum).toBe(0);
    expect(validation.maximum ?? prop.maximum).toBe(1000);
  });

  test('enumInt — integer with enum choices', () => {
    const prop = findProperty(ct, 'enumInt');
    expect(prop, 'enumInt not found').toBeTruthy();

    const enumValues = extractEnum(prop);
    expect(enumValues.length).toBe(3);

    const values = enumValues.map((e: any) => e.value ?? e.key ?? e);
    expect(values).toContain(1);
    expect(values).toContain(2);
    expect(values).toContain(3);
  });

  test('hiddenInt — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenInt');
    expect(prop, 'hiddenInt not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 4: AutoFloatAllFields ──────────────────────────────────────────────

describe('AutoFloatAllFields — float property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoFloatAllFields');
    expect(ct, 'AutoFloatAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoFloatAllFields');
    expect(ct.displayName).toBe('Auto Float All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleFloat — minimal float', () => {
    const prop = findProperty(ct, 'simpleFloat');
    expect(prop, 'simpleFloat not found').toBeTruthy();
    expect(prop.type).toBe('float');
  });

  test('fullFloat — all base fields + min/max', () => {
    const prop = findProperty(ct, 'fullFloat');
    expect(prop, 'fullFloat not found').toBeTruthy();
    expect(prop.type).toBe('float');
    expect(prop.displayName).toBe('Full Float');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);

    const validation = prop.validation ?? prop;
    expect(validation.minimum ?? prop.minimum).toBe(0);
    expect(validation.maximum ?? prop.maximum).toBe(99.99);
  });

  test('enumFloat — float with enum choices', () => {
    const prop = findProperty(ct, 'enumFloat');
    expect(prop, 'enumFloat not found').toBeTruthy();

    const enumValues = extractEnum(prop);
    expect(enumValues.length).toBe(3);

    const values = enumValues.map((e: any) => e.value ?? e.key ?? e);
    expect(values).toContain(0.5);
    expect(values).toContain(1.0);
    expect(values).toContain(1.5);
  });

  test('hiddenFloat — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenFloat');
    expect(prop, 'hiddenFloat not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 5: AutoDateTimeAllFields ───────────────────────────────────────────

describe('AutoDateTimeAllFields — dateTime property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoDateTimeAllFields');
    expect(ct, 'AutoDateTimeAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoDateTimeAllFields');
    expect(ct.displayName).toBe('Auto DateTime All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleDateTime — minimal dateTime', () => {
    const prop = findProperty(ct, 'simpleDateTime');
    expect(prop, 'simpleDateTime not found').toBeTruthy();
    expect(prop.type).toBe('dateTime');
  });

  test('fullDateTime — all base fields + min/max dates', () => {
    const prop = findProperty(ct, 'fullDateTime');
    expect(prop, 'fullDateTime not found').toBeTruthy();
    expect(prop.type).toBe('dateTime');
    expect(prop.displayName).toBe('Full DateTime');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);

    const validation = prop.validation ?? prop;
    const min = validation.minimum ?? prop.minimum;
    const max = validation.maximum ?? prop.maximum;
    expect(min).toBeTruthy();
    expect(max).toBeTruthy();
    expect(min).toContain('2020');
    expect(max).toContain('2030');
  });

  test('hiddenDateTime — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenDateTime');
    expect(prop, 'hiddenDateTime not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 6: AutoRichTextAllFields ───────────────────────────────────────────

describe('AutoRichTextAllFields — richText property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoRichTextAllFields');
    expect(ct, 'AutoRichTextAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoRichTextAllFields');
    expect(ct.displayName).toBe('Auto RichText All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleRichText — minimal richText', () => {
    const prop = findProperty(ct, 'simpleRichText');
    expect(prop, 'simpleRichText not found').toBeTruthy();
    expect(prop.type).toBe('richText');
  });

  test('fullRichText — all fields + expanded preset', () => {
    const prop = findProperty(ct, 'fullRichText');
    expect(prop, 'fullRichText not found').toBeTruthy();
    expect(prop.type).toBe('richText');
    expect(prop.displayName).toBe('Full RichText');
    expect(prop.isRequired).toBe(true);
    expect(prop.indexingType).toMatch(/searchable/i);

    const preset = prop.editorSettings?.preset ?? prop.preset;
    expect(preset).toMatch(/expanded/i);
  });

  test('minimalRichText — minimal preset', () => {
    const prop = findProperty(ct, 'minimalRichText');
    expect(prop, 'minimalRichText not found').toBeTruthy();

    const preset = prop.editorSettings?.preset ?? prop.preset;
    expect(preset).toMatch(/minimal/i);
  });

  test('hiddenRichText — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenRichText');
    expect(prop, 'hiddenRichText not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 7: AutoUrlAllFields ────────────────────────────────────────────────

describe('AutoUrlAllFields — url property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoUrlAllFields');
    expect(ct, 'AutoUrlAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoUrlAllFields');
    expect(ct.displayName).toBe('Auto Url All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleUrl — minimal url', () => {
    const prop = findProperty(ct, 'simpleUrl');
    expect(prop, 'simpleUrl not found').toBeTruthy();
    expect(prop.type).toBe('url');
  });

  test('fullUrl — all base fields', () => {
    const prop = findProperty(ct, 'fullUrl');
    expect(prop, 'fullUrl not found').toBeTruthy();
    expect(prop.type).toBe('url');
    expect(prop.displayName).toBe('Full Url');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);
  });

  test('hiddenUrl — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenUrl');
    expect(prop, 'hiddenUrl not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 8: AutoLinkAllFields ───────────────────────────────────────────────

describe('AutoLinkAllFields — link property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoLinkAllFields');
    expect(ct, 'AutoLinkAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoLinkAllFields');
    expect(ct.displayName).toBe('Auto Link All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleLink — minimal link', () => {
    const prop = findProperty(ct, 'simpleLink');
    expect(prop, 'simpleLink not found').toBeTruthy();
    expect(prop.type).toBe('link');
  });

  test('fullLink — all base fields', () => {
    const prop = findProperty(ct, 'fullLink');
    expect(prop, 'fullLink not found').toBeTruthy();
    expect(prop.type).toBe('link');
    expect(prop.displayName).toBe('Full Link');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);
  });

  test('hiddenLink — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenLink');
    expect(prop, 'hiddenLink not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 9: AutoJsonAllFields ───────────────────────────────────────────────

describe('AutoJsonAllFields — json property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoJsonAllFields');
    expect(ct, 'AutoJsonAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoJsonAllFields');
    expect(ct.displayName).toBe('Auto Json All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleJson — minimal json', () => {
    const prop = findProperty(ct, 'simpleJson');
    expect(prop, 'simpleJson not found').toBeTruthy();
    expect(prop.type).toBe('json');
  });

  test('fullJson — all base fields', () => {
    const prop = findProperty(ct, 'fullJson');
    expect(prop, 'fullJson not found').toBeTruthy();
    expect(prop.type).toBe('json');
    expect(prop.displayName).toBe('Full Json');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);
  });

  test('hiddenJson — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenJson');
    expect(prop, 'hiddenJson not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 10: AutoBinaryAllFields (PaaS only) ───────────────────────────────

const isSaas = config.platform === 'saas';

describe.skipIf(isSaas)('AutoBinaryAllFields — binary property (PaaS only)', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoBinaryAllFields');
    expect(ct, 'AutoBinaryAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoBinaryAllFields');
    expect(ct.displayName).toBe('Auto Binary All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleBinary — minimal binary', () => {
    const prop = findProperty(ct, 'simpleBinary');
    expect(prop, 'simpleBinary not found').toBeTruthy();
    expect(prop.type).toBe('binary');
  });

  test('fullBinary — all base fields', () => {
    const prop = findProperty(ct, 'fullBinary');
    expect(prop, 'fullBinary not found').toBeTruthy();
    expect(prop.type).toBe('binary');
    expect(prop.displayName).toBe('Full Binary');
    expect(prop.isRequired).toBe(true);
  });

  test('hiddenBinary — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenBinary');
    expect(prop, 'hiddenBinary not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 11: AutoContentRefAllFields ────────────────────────────────────────

describe('AutoContentRefAllFields — contentReference property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoContentRefAllFields');
    expect(ct, 'AutoContentRefAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoContentRefAllFields');
    expect(ct.displayName).toBe('Auto ContentReference All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleRef — minimal contentReference', () => {
    const prop = findProperty(ct, 'simpleRef');
    expect(prop, 'simpleRef not found').toBeTruthy();
    expect(prop.type).toBe('contentReference');
  });

  test('fullRef — all fields + allowedTypes', () => {
    const prop = findProperty(ct, 'fullRef');
    expect(prop, 'fullRef not found').toBeTruthy();
    expect(prop.type).toBe('contentReference');
    expect(prop.displayName).toBe('Full ContentReference');
    expect(prop.isRequired).toBe(true);

    const allowed = prop.allowedTypes ?? prop.contentType ?? [];
    expect(allowed.length).toBeGreaterThanOrEqual(1);
  });

  test('hiddenRef — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenRef');
    expect(prop, 'hiddenRef not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 12: AutoComponentAllFields ─────────────────────────────────────────

describe('AutoComponentAllFields — component property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoComponentAllFields');
    expect(ct, 'AutoComponentAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoComponentAllFields');
    expect(ct.displayName).toBe('Auto Component All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleComponent — minimal component', () => {
    const prop = findProperty(ct, 'simpleComponent');
    expect(prop, 'simpleComponent not found').toBeTruthy();
    expect(prop.type).toBe('component');
  });

  test('fullComponent — all base fields', () => {
    const prop = findProperty(ct, 'fullComponent');
    expect(prop, 'fullComponent not found').toBeTruthy();
    expect(prop.type).toBe('component');
    expect(prop.displayName).toBe('Full Component');
  });

  test('hiddenComponent — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenComponent');
    expect(prop, 'hiddenComponent not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 13: AutoContentAllFields ───────────────────────────────────────────

describe('AutoContentAllFields — content property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoContentAllFields');
    expect(ct, 'AutoContentAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoContentAllFields');
    expect(ct.displayName).toBe('Auto Content All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleContent — minimal content', () => {
    const prop = findProperty(ct, 'simpleContent');
    expect(prop, 'simpleContent not found').toBeTruthy();
    expect(prop.type).toBe('content');
  });

  test('fullContent — all fields + allowedTypes', () => {
    const prop = findProperty(ct, 'fullContent');
    expect(prop, 'fullContent not found').toBeTruthy();
    expect(prop.type).toBe('content');
    expect(prop.displayName).toBe('Full Content');

    const allowed = prop.allowedTypes ?? prop.contentType ?? [];
    expect(allowed.length).toBeGreaterThanOrEqual(1);
  });

  test('hiddenContent — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenContent');
    expect(prop, 'hiddenContent not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ─── Case 14: AutoArrayAllFields ─────────────────────────────────────────────

describe('AutoArrayAllFields — array property with all fields', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'AutoArrayAllFields');
    expect(ct, 'AutoArrayAllFields not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('AutoArrayAllFields');
    expect(ct.displayName).toBe('Auto Array All Fields');
    expect(ct.baseType).toBe('_component');
  });

  test('simpleArray — minimal array of strings', () => {
    const prop = findProperty(ct, 'simpleArray');
    expect(prop, 'simpleArray not found').toBeTruthy();
    expect(prop.type).toBe('array');

    const items = prop.items ?? prop.item;
    expect(items).toBeTruthy();
    const itemType = items.type ?? items;
    expect(itemType).toBe('string');
  });

  test('fullArray — all fields + minItems/maxItems', () => {
    const prop = findProperty(ct, 'fullArray');
    expect(prop, 'fullArray not found').toBeTruthy();
    expect(prop.type).toBe('array');
    expect(prop.displayName).toBe('Full Array');
    expect(prop.isRequired).toBe(true);

    const validation = prop.validation ?? prop;
    expect(validation.minItems ?? prop.minItems).toBe(1);
    expect(validation.maxItems ?? prop.maxItems).toBe(10);
  });

  test('intArray — array of integers', () => {
    const prop = findProperty(ct, 'intArray');
    expect(prop, 'intArray not found').toBeTruthy();
    expect(prop.type).toBe('array');

    const items = prop.items ?? prop.item;
    expect(items).toBeTruthy();
    const itemType = items.type ?? items;
    expect(itemType).toBe('integer');
  });

  test('hiddenArray — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenArray');
    expect(prop, 'hiddenArray not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});
