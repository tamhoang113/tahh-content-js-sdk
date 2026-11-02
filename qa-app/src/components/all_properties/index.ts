import { SharedBaseContract } from './_shared-contract';

// ── Page types (_page) ──────────────────────────────────────────────────────
import PageStringPropertyComponent, { PageStringProperty } from './PageStringProperty';
import PageBooleanPropertyComponent, { PageBooleanProperty } from './PageBooleanProperty';
import PageIntegerPropertyComponent, { PageIntegerProperty } from './PageIntegerProperty';
import PageFloatPropertyComponent, { PageFloatProperty } from './PageFloatProperty';
import PageDateTimePropertyComponent, { PageDateTimeProperty } from './PageDateTimeProperty';
import PageRichTextPropertyComponent, { PageRichTextProperty } from './PageRichTextProperty';
import PageUrlPropertyComponent, { PageUrlProperty } from './PageUrlProperty';
import PageLinkPropertyComponent, { PageLinkProperty } from './PageLinkProperty';
import PageJsonPropertyComponent, { PageJsonProperty } from './PageJsonProperty';
import PageContentRefPropertyComponent, { PageContentRefProperty } from './PageContentRefProperty';
import PageContentAreaPropertyComponent, { PageContentAreaProperty } from './PageContentAreaProperty';
import PageContentItemPropertyComponent, { PageContentItemProperty } from './PageContentItemProperty';

// ── Block types (_component) ────────────────────────────────────────────────
import BlockStringPropertyComponent, { BlockStringProperty } from './BlockStringProperty';
import BlockBooleanPropertyComponent, { BlockBooleanProperty } from './BlockBooleanProperty';
import BlockIntegerPropertyComponent, { BlockIntegerProperty } from './BlockIntegerProperty';
import BlockFloatPropertyComponent, { BlockFloatProperty } from './BlockFloatProperty';
import BlockDateTimePropertyComponent, { BlockDateTimeProperty } from './BlockDateTimeProperty';
import BlockRichTextPropertyComponent, { BlockRichTextProperty } from './BlockRichTextProperty';
import BlockUrlPropertyComponent, { BlockUrlProperty } from './BlockUrlProperty';
import BlockLinkPropertyComponent, { BlockLinkProperty } from './BlockLinkProperty';
import BlockJsonPropertyComponent, { BlockJsonProperty } from './BlockJsonProperty';
import BlockContentRefPropertyComponent, { BlockContentRefProperty } from './BlockContentRefProperty';
import BlockContentAreaPropertyComponent, { BlockContentAreaProperty } from './BlockContentAreaProperty';
import BlockContentItemPropertyComponent, { BlockContentItemProperty } from './BlockContentItemProperty';

// ── Experience types (_experience) ──────────────────────────────────────────
import ExpStringPropertyComponent, { ExpStringProperty } from './ExpStringProperty';
import ExpBooleanPropertyComponent, { ExpBooleanProperty } from './ExpBooleanProperty';
import ExpIntegerPropertyComponent, { ExpIntegerProperty } from './ExpIntegerProperty';
import ExpFloatPropertyComponent, { ExpFloatProperty } from './ExpFloatProperty';
import ExpDateTimePropertyComponent, { ExpDateTimeProperty } from './ExpDateTimeProperty';
import ExpRichTextPropertyComponent, { ExpRichTextProperty } from './ExpRichTextProperty';
import ExpUrlPropertyComponent, { ExpUrlProperty } from './ExpUrlProperty';
import ExpLinkPropertyComponent, { ExpLinkProperty } from './ExpLinkProperty';
import ExpJsonPropertyComponent, { ExpJsonProperty } from './ExpJsonProperty';
import ExpContentRefPropertyComponent, { ExpContentRefProperty } from './ExpContentRefProperty';
import ExpContentAreaPropertyComponent, { ExpContentAreaProperty } from './ExpContentAreaProperty';
import ExpContentItemPropertyComponent, { ExpContentItemProperty } from './ExpContentItemProperty';

// ── Page array types (_page) ────────────────────────────────────────────────
import PageArrayStringPropertyComponent, { PageArrayStringProperty } from './PageArrayStringProperty';
import PageArrayRichTextPropertyComponent, { PageArrayRichTextProperty } from './PageArrayRichTextProperty';
import PageArrayBooleanPropertyComponent, { PageArrayBooleanProperty } from './PageArrayBooleanProperty';
import PageArrayIntegerPropertyComponent, { PageArrayIntegerProperty } from './PageArrayIntegerProperty';
import PageArrayFloatPropertyComponent, { PageArrayFloatProperty } from './PageArrayFloatProperty';
import PageArrayDateTimePropertyComponent, { PageArrayDateTimeProperty } from './PageArrayDateTimeProperty';
import PageArrayUrlPropertyComponent, { PageArrayUrlProperty } from './PageArrayUrlProperty';
import PageArrayLinkPropertyComponent, { PageArrayLinkProperty } from './PageArrayLinkProperty';
import PageArrayContentRefPropertyComponent, { PageArrayContentRefProperty } from './PageArrayContentRefProperty';
import PageArrayContentPropertyComponent, { PageArrayContentProperty } from './PageArrayContentProperty';

// ── Block array types (_component) ──────────────────────────────────────────
import BlockArrayStringPropertyComponent, { BlockArrayStringProperty } from './BlockArrayStringProperty';
import BlockArrayRichTextPropertyComponent, { BlockArrayRichTextProperty } from './BlockArrayRichTextProperty';
import BlockArrayBooleanPropertyComponent, { BlockArrayBooleanProperty } from './BlockArrayBooleanProperty';
import BlockArrayIntegerPropertyComponent, { BlockArrayIntegerProperty } from './BlockArrayIntegerProperty';
import BlockArrayFloatPropertyComponent, { BlockArrayFloatProperty } from './BlockArrayFloatProperty';
import BlockArrayDateTimePropertyComponent, { BlockArrayDateTimeProperty } from './BlockArrayDateTimeProperty';
import BlockArrayUrlPropertyComponent, { BlockArrayUrlProperty } from './BlockArrayUrlProperty';
import BlockArrayLinkPropertyComponent, { BlockArrayLinkProperty } from './BlockArrayLinkProperty';
import BlockArrayContentRefPropertyComponent, { BlockArrayContentRefProperty } from './BlockArrayContentRefProperty';
import BlockArrayContentPropertyComponent, { BlockArrayContentProperty } from './BlockArrayContentProperty';

// ── Experience array types (_experience) ────────────────────────────────────
import ExpArrayStringPropertyComponent, { ExpArrayStringProperty } from './ExpArrayStringProperty';
import ExpArrayRichTextPropertyComponent, { ExpArrayRichTextProperty } from './ExpArrayRichTextProperty';
import ExpArrayBooleanPropertyComponent, { ExpArrayBooleanProperty } from './ExpArrayBooleanProperty';
import ExpArrayIntegerPropertyComponent, { ExpArrayIntegerProperty } from './ExpArrayIntegerProperty';
import ExpArrayFloatPropertyComponent, { ExpArrayFloatProperty } from './ExpArrayFloatProperty';
import ExpArrayDateTimePropertyComponent, { ExpArrayDateTimeProperty } from './ExpArrayDateTimeProperty';
import ExpArrayUrlPropertyComponent, { ExpArrayUrlProperty } from './ExpArrayUrlProperty';
import ExpArrayLinkPropertyComponent, { ExpArrayLinkProperty } from './ExpArrayLinkProperty';
import ExpArrayContentRefPropertyComponent, { ExpArrayContentRefProperty } from './ExpArrayContentRefProperty';
import ExpArrayContentPropertyComponent, { ExpArrayContentProperty } from './ExpArrayContentProperty';

// ── Component property types ────────────────────────────────────────────────
import PageComponentPropertyComponent, { PageComponentProperty } from './PageComponentProperty';
import BlockComponentPropertyComponent, { BlockComponentProperty } from './BlockComponentProperty';
import ExpComponentPropertyComponent, { ExpComponentProperty } from './ExpComponentProperty';

// ── Section type (_section) ─────────────────────────────────────────────────
import SectionMixedPropertyComponent, { SectionMixedProperty } from './SectionMixedProperty';

export const ALL_PROPERTY_TYPES: any[] = [
  SharedBaseContract,
  // Page
  PageStringProperty, PageBooleanProperty, PageIntegerProperty, PageFloatProperty,
  PageDateTimeProperty, PageRichTextProperty, PageUrlProperty, PageLinkProperty,
  PageJsonProperty, PageContentRefProperty, PageContentAreaProperty, PageContentItemProperty,
  // Block
  BlockStringProperty, BlockBooleanProperty, BlockIntegerProperty, BlockFloatProperty,
  BlockDateTimeProperty, BlockRichTextProperty, BlockUrlProperty, BlockLinkProperty,
  BlockJsonProperty, BlockContentRefProperty, BlockContentAreaProperty, BlockContentItemProperty,
  // Experience
  ExpStringProperty, ExpBooleanProperty, ExpIntegerProperty, ExpFloatProperty,
  ExpDateTimeProperty, ExpRichTextProperty, ExpUrlProperty, ExpLinkProperty,
  ExpJsonProperty, ExpContentRefProperty, ExpContentAreaProperty, ExpContentItemProperty,
  // Page arrays
  PageArrayStringProperty, PageArrayBooleanProperty, PageArrayIntegerProperty, PageArrayFloatProperty,
  PageArrayDateTimeProperty, PageArrayRichTextProperty, PageArrayUrlProperty, PageArrayLinkProperty,
  PageArrayContentRefProperty, PageArrayContentProperty,
  // Block arrays
  BlockArrayStringProperty, BlockArrayBooleanProperty, BlockArrayIntegerProperty, BlockArrayFloatProperty,
  BlockArrayDateTimeProperty, BlockArrayRichTextProperty, BlockArrayUrlProperty, BlockArrayLinkProperty,
  BlockArrayContentRefProperty, BlockArrayContentProperty,
  // Experience arrays
  ExpArrayStringProperty, ExpArrayBooleanProperty, ExpArrayIntegerProperty, ExpArrayFloatProperty,
  ExpArrayDateTimeProperty, ExpArrayRichTextProperty, ExpArrayUrlProperty, ExpArrayLinkProperty,
  ExpArrayContentRefProperty, ExpArrayContentProperty,
  // Component property
  PageComponentProperty, BlockComponentProperty, ExpComponentProperty,
  // Section
  SectionMixedProperty,
];

export const ALL_PROPERTY_RESOLVERS: Record<string, any> = {
  // Page
  PageStringProperty: PageStringPropertyComponent,
  PageBooleanProperty: PageBooleanPropertyComponent,
  PageIntegerProperty: PageIntegerPropertyComponent,
  PageFloatProperty: PageFloatPropertyComponent,
  PageDateTimeProperty: PageDateTimePropertyComponent,
  PageRichTextProperty: PageRichTextPropertyComponent,
  PageUrlProperty: PageUrlPropertyComponent,
  PageLinkProperty: PageLinkPropertyComponent,
  PageJsonProperty: PageJsonPropertyComponent,
  PageContentRefProperty: PageContentRefPropertyComponent,
  PageContentAreaProperty: PageContentAreaPropertyComponent,
  PageContentItemProperty: PageContentItemPropertyComponent,
  // Block
  BlockStringProperty: BlockStringPropertyComponent,
  BlockBooleanProperty: BlockBooleanPropertyComponent,
  BlockIntegerProperty: BlockIntegerPropertyComponent,
  BlockFloatProperty: BlockFloatPropertyComponent,
  BlockDateTimeProperty: BlockDateTimePropertyComponent,
  BlockRichTextProperty: BlockRichTextPropertyComponent,
  BlockUrlProperty: BlockUrlPropertyComponent,
  BlockLinkProperty: BlockLinkPropertyComponent,
  BlockJsonProperty: BlockJsonPropertyComponent,
  BlockContentRefProperty: BlockContentRefPropertyComponent,
  BlockContentAreaProperty: BlockContentAreaPropertyComponent,
  BlockContentItemProperty: BlockContentItemPropertyComponent,
  // Experience
  ExpStringProperty: ExpStringPropertyComponent,
  ExpBooleanProperty: ExpBooleanPropertyComponent,
  ExpIntegerProperty: ExpIntegerPropertyComponent,
  ExpFloatProperty: ExpFloatPropertyComponent,
  ExpDateTimeProperty: ExpDateTimePropertyComponent,
  ExpRichTextProperty: ExpRichTextPropertyComponent,
  ExpUrlProperty: ExpUrlPropertyComponent,
  ExpLinkProperty: ExpLinkPropertyComponent,
  ExpJsonProperty: ExpJsonPropertyComponent,
  ExpContentRefProperty: ExpContentRefPropertyComponent,
  ExpContentAreaProperty: ExpContentAreaPropertyComponent,
  ExpContentItemProperty: ExpContentItemPropertyComponent,
  // Page arrays
  PageArrayStringProperty: PageArrayStringPropertyComponent,
  PageArrayBooleanProperty: PageArrayBooleanPropertyComponent,
  PageArrayIntegerProperty: PageArrayIntegerPropertyComponent,
  PageArrayFloatProperty: PageArrayFloatPropertyComponent,
  PageArrayDateTimeProperty: PageArrayDateTimePropertyComponent,
  PageArrayRichTextProperty: PageArrayRichTextPropertyComponent,
  PageArrayUrlProperty: PageArrayUrlPropertyComponent,
  PageArrayLinkProperty: PageArrayLinkPropertyComponent,
  PageArrayContentRefProperty: PageArrayContentRefPropertyComponent,
  PageArrayContentProperty: PageArrayContentPropertyComponent,
  // Block arrays
  BlockArrayStringProperty: BlockArrayStringPropertyComponent,
  BlockArrayBooleanProperty: BlockArrayBooleanPropertyComponent,
  BlockArrayIntegerProperty: BlockArrayIntegerPropertyComponent,
  BlockArrayFloatProperty: BlockArrayFloatPropertyComponent,
  BlockArrayDateTimeProperty: BlockArrayDateTimePropertyComponent,
  BlockArrayRichTextProperty: BlockArrayRichTextPropertyComponent,
  BlockArrayUrlProperty: BlockArrayUrlPropertyComponent,
  BlockArrayLinkProperty: BlockArrayLinkPropertyComponent,
  BlockArrayContentRefProperty: BlockArrayContentRefPropertyComponent,
  BlockArrayContentProperty: BlockArrayContentPropertyComponent,
  // Experience arrays
  ExpArrayStringProperty: ExpArrayStringPropertyComponent,
  ExpArrayBooleanProperty: ExpArrayBooleanPropertyComponent,
  ExpArrayIntegerProperty: ExpArrayIntegerPropertyComponent,
  ExpArrayFloatProperty: ExpArrayFloatPropertyComponent,
  ExpArrayDateTimeProperty: ExpArrayDateTimePropertyComponent,
  ExpArrayRichTextProperty: ExpArrayRichTextPropertyComponent,
  ExpArrayUrlProperty: ExpArrayUrlPropertyComponent,
  ExpArrayLinkProperty: ExpArrayLinkPropertyComponent,
  ExpArrayContentRefProperty: ExpArrayContentRefPropertyComponent,
  ExpArrayContentProperty: ExpArrayContentPropertyComponent,
  // Component property
  PageComponentProperty: PageComponentPropertyComponent,
  BlockComponentProperty: BlockComponentPropertyComponent,
  ExpComponentProperty: ExpComponentPropertyComponent,
  // Section
  SectionMixedProperty: SectionMixedPropertyComponent,
};
