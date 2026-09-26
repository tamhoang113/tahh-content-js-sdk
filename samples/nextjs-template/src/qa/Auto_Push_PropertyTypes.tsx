import { contentType, contract } from '@optimizely/cms-sdk';

// ─── Auto Test Content Types for CLI Push verification ───────────────────────
// Prefix: Auto — used exclusively by _qa/ automation tests.
// DO NOT create content from these types manually.

// A contract used by AutoStringAllFields to test extends
export const AutoBaseContract = contract({
  key: 'AutoBaseContract',
  displayName: 'Auto Base Contract',
  properties: {
    contractField: { type: 'string', displayName: 'Contract Field' },
  },
});

/**
 * Case 1: string property — exercises ALL available fields
 */
export const AutoStringAllFields = contentType({
  key: 'AutoStringAllFields',
  displayName: 'Auto String All Fields',
  baseType: '_component',
  extends: [AutoBaseContract],
  properties: {
    simpleString: {
      type: 'string',
    },

    fullString: {
      type: 'string',
      displayName: 'Full String',
      description: 'A string property with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 10,
      indexingType: 'searchable',
      displayMode: 'available',
      minLength: 1,
      maxLength: 500,
      pattern: '^[A-Za-z0-9 ]+$',
    },

    enumString: {
      type: 'string',
      displayName: 'Enum String',
      enum: [
        { value: 'option_a', displayName: 'Option A' },
        { value: 'option_b', displayName: 'Option B' },
        { value: 'option_c', displayName: 'Option C' },
      ],
    },

    hiddenString: {
      type: 'string',
      displayMode: 'hidden',
    },

    queryableString: {
      type: 'string',
      indexingType: 'queryable',
    },

    noIndexString: {
      type: 'string',
      indexingType: 'disabled',
    },
  },
});

/**
 * Case 2: boolean property — exercises ALL available fields
 */
export const AutoBooleanAllFields = contentType({
  key: 'AutoBooleanAllFields',
  displayName: 'Auto Boolean All Fields',
  baseType: '_component',
  properties: {
    simpleBool: {
      type: 'boolean',
    },

    fullBool: {
      type: 'boolean',
      displayName: 'Full Boolean',
      description: 'A boolean with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 20,
      indexingType: 'queryable',
      displayMode: 'available',
    },

    hiddenBool: {
      type: 'boolean',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 3: integer property — min/max, enum
 */
export const AutoIntegerAllFields = contentType({
  key: 'AutoIntegerAllFields',
  displayName: 'Auto Integer All Fields',
  baseType: '_component',
  properties: {
    simpleInt: {
      type: 'integer',
    },

    fullInt: {
      type: 'integer',
      displayName: 'Full Integer',
      description: 'An integer with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 30,
      indexingType: 'searchable',
      displayMode: 'available',
      minimum: 0,
      maximum: 1000,
    },

    enumInt: {
      type: 'integer',
      displayName: 'Enum Integer',
      enum: [
        { value: 1, displayName: 'One' },
        { value: 2, displayName: 'Two' },
        { value: 3, displayName: 'Three' },
      ],
    },

    hiddenInt: {
      type: 'integer',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 4: float property — min/max, enum
 */
export const AutoFloatAllFields = contentType({
  key: 'AutoFloatAllFields',
  displayName: 'Auto Float All Fields',
  baseType: '_component',
  properties: {
    simpleFloat: {
      type: 'float',
    },

    fullFloat: {
      type: 'float',
      displayName: 'Full Float',
      description: 'A float with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 40,
      indexingType: 'queryable',
      displayMode: 'available',
      minimum: 0.0,
      maximum: 99.99,
    },

    enumFloat: {
      type: 'float',
      displayName: 'Enum Float',
      enum: [
        { value: 0.5, displayName: 'Half' },
        { value: 1.0, displayName: 'One' },
        { value: 1.5, displayName: 'One and Half' },
      ],
    },

    hiddenFloat: {
      type: 'float',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 5: dateTime property — min/max dates
 */
export const AutoDateTimeAllFields = contentType({
  key: 'AutoDateTimeAllFields',
  displayName: 'Auto DateTime All Fields',
  baseType: '_component',
  properties: {
    simpleDateTime: {
      type: 'dateTime',
    },

    fullDateTime: {
      type: 'dateTime',
      displayName: 'Full DateTime',
      description: 'A dateTime with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 50,
      indexingType: 'queryable',
      displayMode: 'available',
      minimum: '2020-01-01T00:00:00Z',
      maximum: '2030-12-31T23:59:59Z',
    },

    hiddenDateTime: {
      type: 'dateTime',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 6: richText property — editor presets
 */
export const AutoRichTextAllFields = contentType({
  key: 'AutoRichTextAllFields',
  displayName: 'Auto RichText All Fields',
  baseType: '_component',
  properties: {
    simpleRichText: {
      type: 'richText',
    },

    fullRichText: {
      type: 'richText',
      displayName: 'Full RichText',
      description: 'A richText with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 60,
      indexingType: 'searchable',
      displayMode: 'available',
      editorSettings: { preset: 'expanded' },
    },

    minimalRichText: {
      type: 'richText',
      displayName: 'Minimal RichText',
      editorSettings: { preset: 'minimal' },
    },

    hiddenRichText: {
      type: 'richText',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 7: url property
 */
export const AutoUrlAllFields = contentType({
  key: 'AutoUrlAllFields',
  displayName: 'Auto Url All Fields',
  baseType: '_component',
  properties: {
    simpleUrl: {
      type: 'url',
    },

    fullUrl: {
      type: 'url',
      displayName: 'Full Url',
      description: 'A url with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 70,
      displayMode: 'available',
    },

    hiddenUrl: {
      type: 'url',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 8: link property
 */
export const AutoLinkAllFields = contentType({
  key: 'AutoLinkAllFields',
  displayName: 'Auto Link All Fields',
  baseType: '_component',
  properties: {
    simpleLink: {
      type: 'link',
    },

    fullLink: {
      type: 'link',
      displayName: 'Full Link',
      description: 'A link with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 80,
      displayMode: 'available',
    },

    hiddenLink: {
      type: 'link',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 9: json property
 */
export const AutoJsonAllFields = contentType({
  key: 'AutoJsonAllFields',
  displayName: 'Auto Json All Fields',
  baseType: '_component',
  properties: {
    simpleJson: {
      type: 'json',
    },

    fullJson: {
      type: 'json',
      displayName: 'Full Json',
      description: 'A json with every field set',
      isRequired: true,
      isLocalized: true,
      group: 'Content',
      sortOrder: 90,
      indexingType: 'queryable',
      displayMode: 'available',
    },

    hiddenJson: {
      type: 'json',
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 10: contentReference property — allowedTypes
 */
export const AutoContentRefAllFields = contentType({
  key: 'AutoContentRefAllFields',
  displayName: 'Auto ContentReference All Fields',
  baseType: '_component',
  properties: {
    simpleRef: {
      type: 'contentReference',
      allowedTypes: ['_page'],
    },

    fullRef: {
      type: 'contentReference',
      displayName: 'Full ContentReference',
      description: 'A contentReference with every field set',
      isRequired: true,
      isLocalized: false,
      group: 'Content',
      sortOrder: 110,
      displayMode: 'available',
      allowedTypes: ['_page', '_image'],
    },

    hiddenRef: {
      type: 'contentReference',
      displayMode: 'hidden',
      allowedTypes: ['_page'],
    },
  },
});

/**
 * Case 12: component property
 */
export const AutoComponentAllFields = contentType({
  key: 'AutoComponentAllFields',
  displayName: 'Auto Component All Fields',
  baseType: '_component',
  properties: {
    simpleComponent: {
      type: 'component',
      contentType: AutoBooleanAllFields,
    },

    fullComponent: {
      type: 'component',
      contentType: AutoBooleanAllFields,
      displayName: 'Full Component',
      description: 'A component property with fields set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 120,
      displayMode: 'available',
    },

    hiddenComponent: {
      type: 'component',
      contentType: AutoBooleanAllFields,
      displayMode: 'hidden',
    },
  },
});

/**
 * Case 13: content property — allowedTypes
 */
export const AutoContentAllFields = contentType({
  key: 'AutoContentAllFields',
  displayName: 'Auto Content All Fields',
  baseType: '_component',
  properties: {
    simpleContent: {
      type: 'content',
      allowedTypes: ['_page'],
    },

    fullContent: {
      type: 'content',
      displayName: 'Full Content',
      description: 'A content property with every field set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 130,
      displayMode: 'available',
      allowedTypes: ['_page', '_component'],
    },

    hiddenContent: {
      type: 'content',
      displayMode: 'hidden',
      allowedTypes: ['_page'],
    },
  },
});

/**
 * Case 14: array property — items with type, minItems/maxItems
 */
export const AutoArrayAllFields = contentType({
  key: 'AutoArrayAllFields',
  displayName: 'Auto Array All Fields',
  baseType: '_component',
  properties: {
    simpleArray: {
      type: 'array',
      items: { type: 'string' },
    },

    fullArray: {
      type: 'array',
      displayName: 'Full Array',
      description: 'An array with every field set',
      isRequired: true,
      isLocalized: false,
      group: 'Content',
      sortOrder: 140,
      displayMode: 'available',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
    },

    intArray: {
      type: 'array',
      displayName: 'Integer Array',
      items: { type: 'integer' },
    },

    hiddenArray: {
      type: 'array',
      displayMode: 'hidden',
      items: { type: 'string' },
    },
  },
});

/**
 * Case 14b: array items with item-level validation constraints
 * - string items: minLength, maxLength, pattern
 * - integer items: minimum, maximum
 * - float items: minimum, maximum
 * - contentReference items: allowedTypes
 * - content items: allowedTypes
 */
export const AutoArrayItemValidation = contentType({
  key: 'AutoArrayItemValidation',
  displayName: 'Auto Array Item Validation',
  baseType: '_component',
  properties: {
    stringArrayWithValidation: {
      type: 'array',
      displayName: 'String Array With Validation',
      items: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: '^[a-z]+$',
      },
      minItems: 1,
      maxItems: 5,
    },

    intArrayWithValidation: {
      type: 'array',
      displayName: 'Integer Array With Validation',
      items: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
      },
    },

    floatArrayWithValidation: {
      type: 'array',
      displayName: 'Float Array With Validation',
      items: {
        type: 'float',
        minimum: 0.0,
        maximum: 10.0,
      },
    },

    contentRefArray: {
      type: 'array',
      displayName: 'ContentReference Array',
      items: {
        type: 'contentReference',
        allowedTypes: ['_image'],
      },
    },

    contentArray: {
      type: 'array',
      displayName: 'Content Array',
      items: {
        type: 'content',
        allowedTypes: ['_page'],
      },
      maxItems: 5,
    },
  },
});

// ─── baseType variants ────────────────────────────────────────────────────────

/**
 * Case 15: baseType _page — routable content page
 */
export const AutoPageBaseType = contentType({
  key: 'AutoPageBaseType',
  displayName: 'Auto Page Base Type',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      isRequired: true,
      indexingType: 'searchable',
    },
    metaDescription: {
      type: 'string',
      displayName: 'Meta Description',
      indexingType: 'disabled',
    },
  },
});

/**
 * Case 16: baseType _experience — Visual Builder page
 */
export const AutoExperienceBaseType = contentType({
  key: 'AutoExperienceBaseType',
  displayName: 'Auto Experience Base Type',
  baseType: '_experience',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      isRequired: true,
    },
    hideFromNav: {
      type: 'boolean',
      displayName: 'Hide from Navigation',
    },
  },
});

/**
 * Case 17: baseType _section — grid section used inside experiences
 */
export const AutoSectionBaseType = contentType({
  key: 'AutoSectionBaseType',
  displayName: 'Auto Section Base Type',
  baseType: '_section',
  properties: {
    backgroundColor: {
      type: 'string',
      displayName: 'Background Color',
    },
    padding: {
      type: 'string',
      displayName: 'Padding',
    },
  },
});

/**
 * Case 18: baseType _folder — content organization
 */
export const AutoFolderBaseType = contentType({
  key: 'AutoFolderBaseType',
  displayName: 'Auto Folder Base Type',
  baseType: '_folder',
  mayContainTypes: ['_self'],
  properties: {
    description: {
      type: 'string',
      displayName: 'Description',
    },
  },
});

/**
 * Case 19: _component with compositionBehaviors
 * - elementEnabled: can be used as element in Visual Builder
 * - sectionEnabled: can be used as section in Visual Builder
 */
export const AutoComponentElementEnabled = contentType({
  key: 'AutoComponentElementEnabled',
  displayName: 'Auto Component Element Enabled',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
      isRequired: true,
    },
    body: {
      type: 'richText',
      displayName: 'Body',
    },
  },
});

export const AutoComponentSectionEnabled = contentType({
  key: 'AutoComponentSectionEnabled',
  displayName: 'Auto Component Section Enabled',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    backgroundColor: {
      type: 'string',
      displayName: 'Background Color',
    },
  },
});

export const AutoComponentBothBehaviors = contentType({
  key: 'AutoComponentBothBehaviors',
  displayName: 'Auto Component Both Behaviors',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
  properties: {
    label: {
      type: 'string',
      displayName: 'Label',
    },
  },
});
