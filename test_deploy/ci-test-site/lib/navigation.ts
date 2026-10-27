import { getClient } from '@optimizely/cms-sdk';
import { getContext } from '@optimizely/cms-sdk/react/server';
import { cache } from 'react';

export type NavigationItem = {
  key: string;
  displayName: string;
  url: string;
  isActive: boolean;
  items: NavigationItem[] | null;
};

type RawNavigationItem = {
  _metadata?: {
    key: string;
    displayName?: string;
    locale?: string;
    types: string[];
    url?: {
      default?: string;
    };
  };
};

const fetchChildItems = async (
  parentKey: string,
  parentUrl: string,
  locale: string,
  activeKey: string,
  isRoot: boolean = false,
  skipOverview: boolean = true,
): Promise<NavigationItem[]> => {
  const items = await getClient().getItems({ key: parentKey, locale });

  if (!items?.length) return [];

  const filteredItems = items.filter(
    (item: RawNavigationItem) =>
      item._metadata && !item._metadata.types.includes('BlankExperience'),
  );

  const childItems = await Promise.all(
    filteredItems.map(async (item: RawNavigationItem) => {
      const metadata = item._metadata!;
      const grandchildItems = await fetchChildItems(
        metadata.key,
        metadata.url?.default || '',
        locale,
        activeKey,
        false,
        skipOverview,
      );

      return {
        key: metadata.key,
        displayName: metadata.displayName || '',
        url: metadata.url?.default || '',
        isActive: metadata.key === activeKey,
        items: grandchildItems.length > 0 ? grandchildItems : null,
      };
    }),
  );

  if (!isRoot && childItems.length > 0 && !skipOverview) {
    return [
      {
        key: parentKey,
        displayName: 'Overview',
        url: parentUrl,
        isActive: parentKey === activeKey,
        items: null,
      },
      ...childItems,
    ];
  }

  return childItems;
};

export const getNavigationItems = cache(async (skipOverview: boolean = true) => {
  const context = getContext();

  if (!context?.key || !context?.locale) {
    return [];
  }

  const path = await getClient().getPath({ key: context.key, locale: context.locale });
  if (!path?.length) return [];

  const rootUrl = path[0]._metadata?.url?.default || '';
  const rootKey = path[0]._metadata?.key;
  if (!rootKey || !rootUrl) return [];

  return fetchChildItems(
    rootKey,
    rootUrl,
    context.locale,
    context.key,
    true,
    skipOverview,
  );
});

export const getMobileNavigationItems = cache(() => getNavigationItems(false));
