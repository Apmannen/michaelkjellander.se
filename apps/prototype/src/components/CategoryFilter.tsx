import Link from 'next/link';
import { categoryList } from '@/data/categories';
import { CategoryId } from '@/data/types';

export const CategoryFilter = ({ active }: { active?: CategoryId }) => {
  const items = [{ id: undefined, name: 'Alla', href: '/' }, ...categoryList.map((c) => ({ id: c.id, name: c.name, href: `/kategori/${c.id}` }))];

  return (
    <nav aria-label='Kategorier' className='flex flex-wrap gap-2 pb-6'>
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full border px-4 py-1 text-[15px] ${isActive ? 'border-accent-800 bg-accent-800 text-white' : 'border-line hover:border-accent-800 hover:text-accent-800'}`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};
