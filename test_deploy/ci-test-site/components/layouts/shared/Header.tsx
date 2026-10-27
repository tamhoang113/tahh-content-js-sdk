import { HeaderClient } from './Header.client';
import { getMobileNavigationItems, getNavigationItems } from '../../../lib/navigation';
import { getAllSearchableContent } from '../../../lib/search';

export const Header = async () => {
  const navigationItems = await getNavigationItems();
  const mobileNavItems = await getMobileNavigationItems();
  const searchableContent = await getAllSearchableContent();

  return (
    <HeaderClient
      navigationItems={navigationItems}
      mobileNavItems={mobileNavItems}
      searchableContent={searchableContent}
    />
  );
};
