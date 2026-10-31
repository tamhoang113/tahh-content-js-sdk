/**
 * QA Content Type Registry — single source of truth.
 *
 * layout.tsx reads QA_CONTENT_TYPES and QA_RESOLVERS from here.
 * No _api-registry.ts needed — this app has no "app types" to merge with.
 *
 * Adding a new ticket:
 *   1. Create/import content type in this file
 *   2. Add to QA_CONTENT_TYPES (all types + contracts)
 *   3. Add to QA_RESOLVERS (renderable types only — NOT contracts)
 */

import { BlankExperienceContentType } from '@optimizely/cms-sdk';
import BlankExperience from './BlankExperience';
import BlankSection from './BlankSection';
import AboutExperience, { AboutExperienceContentType } from './AboutExperience';
import LandingExperience, { LandingExperienceContentType } from './LandingExperience';
import { HeroContentType } from './Hero';
import Banner, { BannerContentType } from './Banner';

import {
  AutoBaseContract,
  AutoStringAllFields,
  AutoBooleanAllFields,
  AutoIntegerAllFields,
  AutoFloatAllFields,
  AutoDateTimeAllFields,
  AutoRichTextAllFields,
  AutoUrlAllFields,
  AutoLinkAllFields,
  AutoJsonAllFields,
  AutoContentRefAllFields,
  AutoContentAreaAllFields,
  AutoContentItemAllFields,
  AutoComponentAllFields,
  AutoArrayAllFields,
  AutoArrayItemValidation,
  AutoPageBaseType,
  AutoExperienceBaseType,
  AutoSectionBaseType,
  AutoFolderBaseType,
  AutoComponentElementEnabled,
  AutoComponentSectionEnabled,
  AutoComponentBothBehaviors,
} from './Auto_Push_PropertyTypes';
import { AutoNoContent } from './Auto_PushOnly_Verify';
import AutoStringAllFieldsComponent from './Auto_StringAllFields_Component';

import CMS49490MapPageComponent, {
  CMS49490MapPage,
  CMS49490ArticlePage,
  CMS49490MapBlock,
  CMS49490ArticlePageComponent,
  CMS49490MapBlockComponent,
} from './CMS_49490_CircularFragmentFix';
import CMS54651PageWithContentArrayComponent, {
  CMS54651TeaserContract,
  CMS54651AnotherContract,
  CMS54651PageWithMultipleContracts,
  CMS54651CardContentType,
  CMS54651PageWithContentArray,
  CMS54651PageWithMultipleContractsComponent,
  CMS54651CardContentTypeComponent,
} from './CMS_54651_MultiContract';
import CMS54844HeroSectionComponent, {
  CMS54844HeroSection,
  CMS54844HeroElement,
  CMS54844HeroElementComponent,
} from './CMS_54844_SectionPropertiesFlat';
import CMS54935CardContainerComponent, {
  CMS54935CommonCardContract,
  CMS54935CardComponentA,
  CMS54935CardComponentB,
  CMS54935CardContainer,
  CMS54935CardComponentAComponent,
  CMS54935CardComponentBComponent,
} from './CMS_54935_ArrayContractExpansion';
import CMS56217TaxonomyPageComponent, {
  CMS56217TaxonomyPage,
} from './CMS_56217_TaxonomyCategories';

// ── Reusable Auto* types (always present) ──────────────────────────────────

export const QA_CONTENT_TYPES: any[] = [
  BlankExperienceContentType,
  AboutExperienceContentType,
  LandingExperienceContentType,
  HeroContentType,
  BannerContentType,

  AutoBaseContract,
  AutoStringAllFields,
  AutoBooleanAllFields,
  AutoIntegerAllFields,
  AutoFloatAllFields,
  AutoDateTimeAllFields,
  AutoRichTextAllFields,
  AutoUrlAllFields,
  AutoLinkAllFields,
  AutoJsonAllFields,
  AutoContentRefAllFields,
  AutoContentAreaAllFields,
  AutoContentItemAllFields,
  AutoComponentAllFields,
  AutoArrayAllFields,
  AutoArrayItemValidation,
  AutoPageBaseType,
  AutoExperienceBaseType,
  AutoSectionBaseType,
  AutoFolderBaseType,
  AutoComponentElementEnabled,
  AutoComponentSectionEnabled,
  AutoComponentBothBehaviors,
  AutoNoContent,

  // ── Ticket-specific types ─────────────────────────────────────────────
  CMS49490MapPage,
  CMS49490ArticlePage,
  CMS49490MapBlock,
  CMS54651TeaserContract,
  CMS54651AnotherContract,
  CMS54651PageWithMultipleContracts,
  CMS54651CardContentType,
  CMS54651PageWithContentArray,
  CMS54844HeroSection,
  CMS54844HeroElement,
  CMS54935CommonCardContract,
  CMS54935CardComponentA,
  CMS54935CardComponentB,
  CMS54935CardContainer,
  CMS56217TaxonomyPage,
];

export const QA_RESOLVERS: Record<string, any> = {
  BlankExperience,
  BlankSection,
  AboutExperience,
  LandingExperience,
  Banner,

  AutoStringAllFields: AutoStringAllFieldsComponent,

  // ── Ticket-specific resolvers ─────────────────────────────────────────
  CMS49490MapPage: CMS49490MapPageComponent,
  CMS49490ArticlePage: CMS49490ArticlePageComponent,
  CMS49490MapBlock: CMS49490MapBlockComponent,
  CMS54651PageWithMultipleContracts: CMS54651PageWithMultipleContractsComponent,
  CMS54651CardContentType: CMS54651CardContentTypeComponent,
  CMS54651PageWithContentArray: CMS54651PageWithContentArrayComponent,
  CMS54844HeroSection: CMS54844HeroSectionComponent,
  CMS54844HeroElement: CMS54844HeroElementComponent,
  CMS54935CardComponentA: CMS54935CardComponentAComponent,
  CMS54935CardComponentB: CMS54935CardComponentBComponent,
  CMS54935CardContainer: CMS54935CardContainerComponent,
  CMS56217TaxonomyPage: CMS56217TaxonomyPageComponent,
};
