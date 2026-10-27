import { getClient } from '@optimizely/cms-sdk';
import { unstable_cache } from 'next/cache';
import { getNavigationItems, type NavigationItem } from './navigation';

export type SearchableContent = {
  key: string;
  displayName: string;
  url: string;
  type: string;
  heading?: string;
  intro?: string;
  body?: string;
  locale: string;
};

type RawSearchableItem = {
  _metadata?: {
    key: string;
    displayName?: string;
    locale?: string;
    types: string[];
    url?: {
      default?: string;
    };
  };
  heading?: string;
  intro?: {
    text?: string;
  };
  body?: {
    text?: string;
  };
};

const extractSearchableText = (item: RawSearchableItem | null) => {
  if (!item) return { heading: undefined, intro: undefined, body: undefined };

  return {
    heading: item.heading,
    intro: item.intro?.text,
    body: item.body?.text,
  };
};

const flattenNavigation = (items: NavigationItem[]): Array<{ displayName: string; url: string }> =>
  items
    .filter(item => item.displayName !== 'Overview')
    .flatMap(item => [
      { displayName: item.displayName, url: item.url },
      ...(item.items?.length ? flattenNavigation(item.items) : []),
    ]);

const createFallbackContent = (page: { displayName: string; url: string }): SearchableContent => ({
  key: '',
  displayName: page.displayName,
  url: page.url,
  type: 'Page',
  heading: page.displayName,
  intro: undefined,
  body: undefined,
  locale: 'en',
});

const fetchAllSearchableContent = async (): Promise<SearchableContent[]> => {
  try {
    const navigationItems = await getNavigationItems();
    const pages = flattenNavigation(navigationItems);

    const contentPromises = pages.map(async page => {
      try {
        const fullContent = await getClient().getContentByPath(page.url);

        if (fullContent?.length > 0) {
          const content = fullContent[0];
          const searchableText = extractSearchableText(content);

          return {
            key: content._metadata?.key || '',
            displayName: page.displayName,
            url: page.url,
            type: content._metadata?.types?.[0] || 'Page',
            heading: searchableText.heading || page.displayName,
            intro: searchableText.intro,
            body: searchableText.body,
            locale: content._metadata?.locale || 'en',
          };
        }
        return createFallbackContent(page);
      } catch {
        return createFallbackContent(page);
      }
    });

    return await Promise.all(contentPromises);
  } catch (error) {
    console.error('Error fetching searchable content:', error);
    return [];
  }
};

export const getAllSearchableContent = unstable_cache(
  fetchAllSearchableContent,
  ['searchable-content'],
  { revalidate: 3600 },
);

type SearchableContentWithLowercase = SearchableContent & {
  _lower: {
    displayName: string;
    heading: string;
    intro: string;
    body: string;
    url: string;
  };
};

const addLowercaseFields = (item: SearchableContent): SearchableContentWithLowercase => ({
  ...item,
  _lower: {
    displayName: item.displayName.toLowerCase(),
    heading: (item.heading || '').toLowerCase(),
    intro: (item.intro || '').toLowerCase(),
    body: (item.body || '').toLowerCase(),
    url: item.url.toLowerCase(),
  },
});

export const searchContent = (
  content: SearchableContent[],
  query: string,
): Array<SearchableContent & { score: number }> => {
  const searchTerm = query.toLowerCase();
  const contentWithLower = content.map(addLowercaseFields);

  const scoredResults = contentWithLower.map(item => {
    let score = 0;

    if (item._lower.displayName === searchTerm) score += 10;
    else if (item._lower.displayName.includes(searchTerm)) score += 5;

    if (item._lower.heading === searchTerm) score += 10;
    else if (item._lower.heading.includes(searchTerm)) score += 5;

    if (item._lower.intro.includes(searchTerm)) score += 3;
    if (item._lower.body.includes(searchTerm)) score += 2;
    if (item._lower.url.includes(searchTerm)) score += 1;

    const { _lower, ...itemWithoutLower } = item;
    return { ...itemWithoutLower, score };
  });

  return scoredResults.filter(item => item.score > 0).sort((a, b) => b.score - a.score);
};

