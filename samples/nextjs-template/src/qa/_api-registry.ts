import { BlankExperienceContentType, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { LandingPageContentType } from '@/components/Landing';
import { LandingSectionContentType } from '@/components/LandingSection';
import { SmallFeatureGridContentType } from '@/components/SmallFeatureGrid';
import { SmallFeatureContentType } from '@/components/SmallFeature';
import { VideoFeatureContentType } from '@/components/VideoFeature';
import { HeroContentType } from '@/components/Hero';
import { ArticleContentType } from '@/components/Article';
import { LandingExperienceContentType } from '@/components/LandingExperience';
import { CallToActionContentType } from '@/components/CallToAction';
import { BlogExperienceContentType } from '@/components/BlogExperience';
import { BlogCardContentType } from '@/components/BlogCard';
import { BannerContentType } from '@/components/Banner';
import { TileContentType } from '@/components/Tile';
import { AboutExperienceContentType } from '@/components/AboutExperience';
import { AboutUsContentType } from '@/components/AboutUs';
import { MonthlySpecialContentType } from '@/components/MonthlySpecial';
import { OfficeContentType } from '@/components/OfficeLocations';
import { LocationContentType } from '@/components/Location';
import { FAQContentType } from '@/components/FAQ';
import { QA_CONTENT_TYPES } from '@/qa/_registry';

const APP_CONTENT_TYPES = [
  BlankExperienceContentType,
  LandingSectionContentType,
  LandingPageContentType,
  SmallFeatureGridContentType,
  SmallFeatureContentType,
  VideoFeatureContentType,
  HeroContentType,
  ArticleContentType,
  LandingExperienceContentType,
  CallToActionContentType,
  BlogExperienceContentType,
  BlogCardContentType,
  BannerContentType,
  TileContentType,
  AboutExperienceContentType,
  AboutUsContentType,
  MonthlySpecialContentType,
  OfficeContentType,
  LocationContentType,
  FAQContentType,
];

export function ensureContentTypesRegistered() {
  initContentTypeRegistry([...APP_CONTENT_TYPES, ...QA_CONTENT_TYPES]);
}
