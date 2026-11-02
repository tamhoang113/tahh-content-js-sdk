/**
 * CLI Push — all_properties/ Content Type Verification
 *
 * Pushes content types from qa-app/src/components/all_properties/ to CMS,
 * then verifies via Integration API that all property fields are preserved.
 *
 * Covers 12 scalar property types × 3 base types (Page/Block/Exp),
 * 10 array property types × 3 base types, plus SharedBaseContract,
 * ComponentProperty (×3), and SectionMixedProperty.
 *
 * Content type definitions: qa-app/src/components/all_properties/
 *
 * Prerequisites:
 *   - .env with OPTIMIZELY_CMS_URL, CLIENT_ID, CLIENT_SECRET
 *
 * Run:
 *   pnpm test:cli -- push-all-properties
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { runCli, resolveProjectDir } from '../../helpers/cli-runner.js';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentType } from '../../helpers/cms-api.js';
import type { SiteConfig } from '../../helpers/types.js';

const config: SiteConfig = loadSiteConfig('qa-app');
const projectDir = resolveProjectDir('qa-app');

// ─── Push once before all tests ──────────────────────────────────────────────

beforeAll(() => {
  const result = runCli('config push --force', projectDir);
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

// ─── Base type matrix ───────────────────────────────────────────────────────

const BASE_TYPES = [
  { prefix: 'Page', baseType: '_page' },
  { prefix: 'Block', baseType: '_component' },
  { prefix: 'Exp', baseType: '_experience' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT
// ═══════════════════════════════════════════════════════════════════════════

describe('SharedBaseContract — contract exists on CMS', () => {
  test('contract type found', async () => {
    const ct = await getContentType(config, 'SharedBaseContract');
    expect(ct, 'SharedBaseContract not found on CMS').toBeTruthy();
    expect(ct.key).toBe('SharedBaseContract');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. STRING PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix StringProperty — string property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}StringProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} String Property`);
    expect(ct.baseType).toBe(baseType);
  });

  test('extends SharedBaseContract', () => {
    const contracts = ct.contracts ?? ct.extends ?? [];
    expect(contracts).toContain('SharedBaseContract');
  });

  test('simpleString — minimal string', () => {
    const prop = findProperty(ct, 'simpleString');
    expect(prop, 'simpleString not found').toBeTruthy();
    expect(prop.type).toBe('string');
  });

  test('fullString — all base fields + string-specific fields', () => {
    const prop = findProperty(ct, 'fullString');
    expect(prop, 'fullString not found').toBeTruthy();
    expect(prop.type).toBe('string');
    expect(prop.displayName).toBe('Full String');
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(true);

    const validation = prop.validation ?? prop;
    expect(validation.minLength ?? prop.minLength).toBe(1);
    expect(validation.maxLength ?? prop.maxLength).toBe(500);
    expect(validation.pattern ?? prop.pattern).toBe('^[A-Za-z0-9 \\-_]+$');
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

  test('contractField — inherited from SharedBaseContract', () => {
    const prop = findProperty(ct, 'contractField');
    expect(prop, 'contractField not found — contract extends broken').toBeTruthy();
    expect(prop.type).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BOOLEAN PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix BooleanProperty — boolean property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}BooleanProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Boolean Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(true);
    expect(prop.indexingType).toMatch(/queryable/i);
  });

  test('hiddenBool — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenBool');
    expect(prop, 'hiddenBool not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. INTEGER PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix IntegerProperty — integer property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}IntegerProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Integer Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
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

// ═══════════════════════════════════════════════════════════════════════════
// 4. FLOAT PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix FloatProperty — float property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}FloatProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Float Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
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

// ═══════════════════════════════════════════════════════════════════════════
// 5. DATETIME PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix DateTimeProperty — dateTime property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}DateTimeProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} DateTime Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
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

// ═══════════════════════════════════════════════════════════════════════════
// 6. RICHTEXT PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix RichTextProperty — richText property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}RichTextProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} RichText Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
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

// ═══════════════════════════════════════════════════════════════════════════
// 7. URL PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix UrlProperty — url property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}UrlProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Url Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(true);
  });

  test('hiddenUrl — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenUrl');
    expect(prop, 'hiddenUrl not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. LINK PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix LinkProperty — link property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}LinkProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Link Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(true);
  });

  test('hiddenLink — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenLink');
    expect(prop, 'hiddenLink not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. JSON PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix JsonProperty — json property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}JsonProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Json Property`);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(true);
  });

  test('hiddenJson — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenJson');
    expect(prop, 'hiddenJson not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. CONTENT REFERENCE PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix ContentRefProperty — contentReference property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}ContentRefProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    const expectedDisplay = prefix === 'Exp' ? `${prefix} ContentRef Property` : `${prefix} ContentReference Property`;
    expect(ct.displayName).toBe(expectedDisplay);
    expect(ct.baseType).toBe(baseType);
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
    expect(prop.isRequired).toBe(false);

    const allowed = prop.allowedTypes ?? [];
    expect(allowed).toContain('_page');
    expect(allowed).toContain('_image');
  });

  test('hiddenRef — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenRef');
    expect(prop, 'hiddenRef not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. CONTENT AREA PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix ContentAreaProperty — ContentArea (array of content)', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}ContentAreaProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} ContentArea Property`);
    expect(ct.baseType).toBe(baseType);
  });

  test('simpleContentArea — minimal contentArea', () => {
    const prop = findProperty(ct, 'simpleContentArea');
    expect(prop, 'simpleContentArea not found').toBeTruthy();
    expect(prop.type).toBe('array');

    const items = prop.items ?? prop.item;
    expect(items).toBeTruthy();
    expect(items.type).toBe('content');
  });

  test('contentAreaWithAllowed — items with allowedTypes', () => {
    const prop = findProperty(ct, 'contentAreaWithAllowed');
    expect(prop, 'contentAreaWithAllowed not found').toBeTruthy();
    expect(prop.type).toBe('array');
    expect(prop.displayName).toBe('ContentArea with AllowedTypes');

    const items = prop.items ?? prop.item;
    expect(items).toBeTruthy();
    expect(items.type).toBe('content');

    const allowed = items.allowedTypes ?? [];
    expect(allowed).toContain('_page');
    expect(allowed).toContain('_component');

    const validation = prop.validation ?? prop;
    expect(validation.maxItems ?? prop.maxItems).toBe(20);
  });

  test('contentAreaWithRestricted — items with restrictedTypes', () => {
    const prop = findProperty(ct, 'contentAreaWithRestricted');
    expect(prop, 'contentAreaWithRestricted not found').toBeTruthy();
    expect(prop.type).toBe('array');

    const items = prop.items ?? prop.item;
    expect(items).toBeTruthy();
    expect(items.type).toBe('content');

    const restricted = items.restrictedTypes ?? [];
    expect(restricted).toContain('_folder');
    expect(restricted).toContain('_media');
  });

  test('hiddenContentArea — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenContentArea');
    expect(prop, 'hiddenContentArea not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CONTENT ITEM PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix ContentItemProperty — ContentItem (type: content)', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}ContentItemProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} ContentItem Property`);
    expect(ct.baseType).toBe(baseType);
  });

  test('simpleContent — minimal content item', () => {
    const prop = findProperty(ct, 'simpleContent');
    expect(prop, 'simpleContent not found').toBeTruthy();
    expect(prop.type).toBe('content');
  });

  test('fullContent — all fields + allowedTypes', () => {
    const prop = findProperty(ct, 'fullContent');
    expect(prop, 'fullContent not found').toBeTruthy();
    expect(prop.type).toBe('content');
    const expectedFullDisplay = prefix === 'Page' ? 'Full ContentItem' : 'Full ContentAreaItem';
    expect(prop.displayName).toBe(expectedFullDisplay);
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(false);

    const allowed = prop.allowedTypes ?? [];
    expect(allowed).toContain('_page');
    expect(allowed).toContain('_component');
  });

  test('contentWithRestricted — restrictedTypes', () => {
    const prop = findProperty(ct, 'contentWithRestricted');
    expect(prop, 'contentWithRestricted not found').toBeTruthy();
    expect(prop.type).toBe('content');
    const expectedRestrictedDisplay = prefix === 'Page' ? 'ContentItem with RestrictedTypes' : 'ContentAreaItem with RestrictedTypes';
    expect(prop.displayName).toBe(expectedRestrictedDisplay);

    const restricted = prop.restrictedTypes ?? [];
    expect(restricted).toContain('_folder');
    expect(restricted).toContain('_media');
  });

  test('hiddenContent — displayMode hidden', () => {
    const prop = findProperty(ct, 'hiddenContent');
    expect(prop, 'hiddenContent not found').toBeTruthy();
    expect(prop.displayMode ?? prop.editorSettings?.displayMode).toMatch(/hidden/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. COMPONENT PROPERTY (Page / Block / Exp)
// ═══════════════════════════════════════════════════════════════════════════

describe.each(BASE_TYPES)('$prefix ComponentProperty — component property', ({ prefix, baseType }) => {
  let ct: any;
  const key = `${prefix}ComponentProperty`;

  beforeAll(async () => {
    ct = await getContentType(config, key);
    expect(ct, `${key} not found on CMS after push`).toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe(key);
    expect(ct.displayName).toBe(`${prefix} Component Property`);
    expect(ct.baseType).toBe(baseType);
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

// ═══════════════════════════════════════════════════════════════════════════
// 14. SECTION MIXED PROPERTY (_section)
// ═══════════════════════════════════════════════════════════════════════════

describe('SectionMixedProperty — section with mixed properties', () => {
  let ct: any;

  beforeAll(async () => {
    ct = await getContentType(config, 'SectionMixedProperty');
    expect(ct, 'SectionMixedProperty not found on CMS after push').toBeTruthy();
  });

  test('content type metadata', () => {
    expect(ct.key).toBe('SectionMixedProperty');
    expect(ct.displayName).toBe('Section Mixed Property');
    expect(ct.baseType).toBe('_section');
  });

  test('pString — string property', () => {
    const prop = findProperty(ct, 'pString');
    expect(prop, 'pString not found').toBeTruthy();
    expect(prop.type).toBe('string');
  });

  test('pRichText — richText property', () => {
    const prop = findProperty(ct, 'pRichText');
    expect(prop, 'pRichText not found').toBeTruthy();
    expect(prop.type).toBe('richText');
  });

  test('pContentReference — contentReference property', () => {
    const prop = findProperty(ct, 'pContentReference');
    expect(prop, 'pContentReference not found').toBeTruthy();
    expect(prop.type).toBe('contentReference');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. ARRAY TYPES (Page / Block / Exp × 10 item types)
// ═══════════════════════════════════════════════════════════════════════════

const ARRAY_ITEM_TYPES = [
  { suffix: 'String', itemType: 'string', fullDisplayName: 'Full String Array' },
  { suffix: 'Boolean', itemType: 'boolean', fullDisplayName: 'Full Boolean Array' },
  { suffix: 'Integer', itemType: 'integer', fullDisplayName: 'Full Integer Array' },
  { suffix: 'Float', itemType: 'float', fullDisplayName: 'Full Float Array' },
  { suffix: 'DateTime', itemType: 'dateTime', fullDisplayName: 'Full DateTime Array' },
  { suffix: 'RichText', itemType: 'richText', fullDisplayName: 'Full RichText Array' },
  { suffix: 'Url', itemType: 'url', fullDisplayName: 'Full Url Array' },
  { suffix: 'Link', itemType: 'link', fullDisplayName: 'Full Link Array' },
] as const;

const ARRAY_REF_TYPES = [
  { suffix: 'ContentRef', itemType: 'contentReference', fullDisplayName: 'Full ContentRef Array' },
  { suffix: 'Content', itemType: 'content', fullDisplayName: 'Full Content Array' },
] as const;

// Simple array types (string, boolean, integer, float, dateTime, richText, url, link)
describe.each(BASE_TYPES)('$prefix Array types — simple item types', ({ prefix, baseType }) => {
  describe.each(ARRAY_ITEM_TYPES)(`array of $itemType`, ({ suffix, itemType, fullDisplayName }) => {
    let ct: any;
    const key = `${prefix}Array${suffix}Property`;

    beforeAll(async () => {
      ct = await getContentType(config, key);
      expect(ct, `${key} not found on CMS after push`).toBeTruthy();
    });

    test('content type metadata', () => {
      expect(ct.key).toBe(key);
      expect(ct.baseType).toBe(baseType);
    });

    test('simpleArray — minimal array', () => {
      const prop = findProperty(ct, 'simpleArray');
      expect(prop, 'simpleArray not found').toBeTruthy();
      expect(prop.type).toBe('array');

      const items = prop.items ?? prop.item;
      expect(items).toBeTruthy();
      const resolved = items.type ?? items;
      expect(resolved).toBe(itemType);
    });

    test('fullArray — all fields + minItems/maxItems', () => {
      const prop = findProperty(ct, 'fullArray');
      expect(prop, 'fullArray not found').toBeTruthy();
      expect(prop.type).toBe('array');
      expect(prop.displayName).toBe(fullDisplayName);
      expect(prop.isRequired).toBe(false);

      const items = prop.items ?? prop.item;
      expect(items).toBeTruthy();
      const resolved = items.type ?? items;
      expect(resolved).toBe(itemType);

      const validation = prop.validation ?? prop;
      expect(validation.minItems ?? prop.minItems).toBe(1);
      expect(validation.maxItems ?? prop.maxItems).toBe(10);
    });
  });
});

// Reference array types (contentReference, content) — these have allowedTypes
describe.each(BASE_TYPES)('$prefix Array types — reference item types', ({ prefix, baseType }) => {
  describe.each(ARRAY_REF_TYPES)(`array of $itemType`, ({ suffix, itemType, fullDisplayName }) => {
    let ct: any;
    const key = `${prefix}Array${suffix}Property`;

    beforeAll(async () => {
      ct = await getContentType(config, key);
      expect(ct, `${key} not found on CMS after push`).toBeTruthy();
    });

    test('content type metadata', () => {
      expect(ct.key).toBe(key);
      expect(ct.baseType).toBe(baseType);
    });

    test('simpleArray — minimal array with allowedTypes', () => {
      const prop = findProperty(ct, 'simpleArray');
      expect(prop, 'simpleArray not found').toBeTruthy();
      expect(prop.type).toBe('array');

      const items = prop.items ?? prop.item;
      expect(items).toBeTruthy();
      expect(items.type).toBe(itemType);
      expect(items.allowedTypes).toContain('_page');
    });

    test('fullArray — all fields + extended allowedTypes + minItems/maxItems', () => {
      const prop = findProperty(ct, 'fullArray');
      expect(prop, 'fullArray not found').toBeTruthy();
      expect(prop.type).toBe('array');
      expect(prop.displayName).toBe(fullDisplayName);
      expect(prop.isRequired).toBe(false);

      const items = prop.items ?? prop.item;
      expect(items).toBeTruthy();
      expect(items.type).toBe(itemType);

      const allowed = items.allowedTypes ?? [];
      expect(allowed.length).toBeGreaterThanOrEqual(2);

      const validation = prop.validation ?? prop;
      expect(validation.minItems ?? prop.minItems).toBe(1);
      expect(validation.maxItems ?? prop.maxItems).toBe(10);
    });
  });
});
