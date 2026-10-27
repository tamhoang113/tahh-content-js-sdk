import Link from 'next/link';
import { Logo } from './Logo';
import { getNavigationItems, type NavigationItem } from '../../../lib/navigation';

const excludeOverview = (item: NavigationItem) => item.displayName !== 'Overview';

const matchesPattern = (text: string, patterns: string[]) =>
  patterns.some(pattern => text.toLowerCase().includes(pattern));

const findByPattern = (items: NavigationItem[], patterns: string[]) =>
  items.find(item => matchesPattern(item.displayName, patterns));

const filterChildren = (
  items: NavigationItem[] | null | undefined,
  excludeKey?: string,
) => items?.filter(item => (!excludeKey || item.key !== excludeKey) && excludeOverview(item)) ?? [];

export const Footer = async () => {
  const navigationItems = await getNavigationItems();

  const products = navigationItems.filter(item => !item.items?.length);
  const aboutSection = findByPattern(navigationItems, ['about']);
  const newsEventsSection = aboutSection?.items
    ? findByPattern(aboutSection.items, ['news', 'events'])
    : undefined;

  const companyItems = filterChildren(aboutSection?.items, newsEventsSection?.key);
  const resourceItems = filterChildren(newsEventsSection?.items);

  return (
    <footer className='pt-20 pb-12 bg-background md:px-12'>
      <div className='container mx-auto'>
        <Link href='/'>
          <Logo className='h-5' />
        </Link>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-12 pt-16 text-sm text-foreground2'>
          <div className='col-span-1 md:col-span-1'>
            <div className='space-y-2'>
              <p className='font-bold text-foreground uppercase text-xs tracking-wider mb-2'>
                Stride
              </p>
              <p>100 Market St</p>
              <p>San Francisco, CA 94103, USA</p>
              <p className='mt-4'>Contact us</p>
              <p>Phone: +1 415 555 0123</p>
            </div>
          </div>

          <div className='col-span-1'>
            <h4 className='font-bold text-foreground uppercase text-xs tracking-wider mb-4'>
              Products
            </h4>
            <ul className='space-y-2'>
              {products.map(item => (
                <li key={item.key}>
                  <Link href={item.url} className='hover:text-foreground'>
                    {item.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className='col-span-1'>
            <h4 className='font-bold text-foreground uppercase text-xs tracking-wider mb-4'>
              Resources
            </h4>
            <ul className='space-y-2'>
              {resourceItems.map(item => (
                <li key={item.key}>
                  <Link href={item.url} className='hover:text-foreground'>
                    {item.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className='col-span-1'>
            <h4 className='font-bold text-foreground uppercase text-xs tracking-wider mb-4'>
              Company
            </h4>
            <ul className='space-y-2'>
              {companyItems.map(item => (
                <li key={item.key}>
                  <Link href={item.url} className='hover:text-foreground'>
                    {item.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className='border-t border-white/5 mt-12 pt-8 text-center text-sm text-foreground2 flex gap-1 items-center justify-center'>
          <p className='opacity-50'>Powered by</p>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='28'
            height='28'
            viewBox='0 0 28 28'
            fill='none'
          >
            <path
              d='M17.6923 10.9231V22M22 10.9231H6M6.0275 14.6154H14M6.0275 18.3077H14M8 6C6.9 6 6 6.9 6 8V20C6 21.1 6.9 22 8 22H20C21.1 22 22 21.1 22 20V8C22 6.9 21.1 6 20 6H8Z'
              stroke='currentColor'
              strokeMiterlimit='10'
            />
          </svg>
          <p>Optimizely CMS</p>
        </div>
      </div>
    </footer>
  );
};
