'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuSearch } from 'react-icons/lu';

const navItems = [
  { href: '/', label: 'Inlägg', matches: ['/', '/inlagg', '/kategori'] },
  { href: '/spel', label: 'Spel', matches: ['/spel'] },
  { href: '/projekt', label: 'Projekt', matches: ['/projekt'] },
  { href: '/om', label: 'Om', matches: ['/om'] },
];

const isActive = (pathname: string, matches: string[]) => {
  return matches.some((match) => {
    if(match === '/') {
      return pathname === '/';
    }
    return pathname === match || pathname.startsWith(`${match}/`);
  });
};

export const SiteHeader = () => {
  const pathname = usePathname();

  return (
    <header className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line py-5'>
      <Link href='/' className='text-[22px] font-bold tracking-tight'>
        Michael Kjellander
      </Link>
      <nav className='flex items-center gap-5 sm:gap-7 text-[17px]'>
        {navItems.map((item) => {
          const active = isActive(pathname, item.matches);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative py-1 hover:text-accent-800 ${active ? 'after:absolute after:-bottom-[21px] after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-accent-700' : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link href='/sok' aria-label='Sök' className='hover:text-accent-800'>
          <LuSearch className='text-[20px]' />
        </Link>
      </nav>
    </header>
  );
};
