import { FaItchIo, FaSteam } from 'react-icons/fa6';
import { LuArrowUpRight, LuBox, LuCalendar, LuGlobe } from 'react-icons/lu';
import { ArticlePost, GamePost, ReviewPost, StoreLink } from '@/data/types';
import { RatingBox } from './Rating';

const titleClass = 'font-bold leading-none tracking-[-0.03em] text-[clamp(48px,9vw,80px)]';

const storeLabels: Record<StoreLink['platform'], { label: string; Icon: typeof FaSteam }> = {
  steam: { label: 'Spela på Steam', Icon: FaSteam },
  itch: { label: 'Spela på itch.io', Icon: FaItchIo },
  web: { label: 'Spela i webbläsaren', Icon: LuGlobe },
};

export const GameHeader = ({ post }: { post: GamePost }) => {
  const store = post.store ? storeLabels[post.store.platform] : undefined;

  return (
    <header>
      <h1 className={titleClass}>{post.title}</h1>
      <p className='pt-2 text-[24px] italic'>{post.subtitle}</p>
      <div className='flex flex-wrap items-center justify-between gap-4 pt-6'>
        <ul className='flex gap-8 text-[17px]'>
          <li className='flex items-center gap-2'>
            <LuCalendar aria-hidden /> {post.years}
          </li>
          <li className='flex items-center gap-2'>
            <LuBox aria-hidden /> {post.engine}
          </li>
        </ul>
        {post.store && store ? (
          <a
            href={post.store.href}
            target='_blank'
            rel='noreferrer'
            className='flex items-center gap-2 rounded-md bg-accent-800 px-5 py-2.5 text-[17px] text-white shadow-sm hover:bg-accent-900'
          >
            <store.Icon className='text-[20px]' /> {store.label} <LuArrowUpRight />
          </a>
        ) : null}
      </div>
    </header>
  );
};

export const ReviewHeader = ({ post }: { post: ReviewPost }) => {
  return (
    <header>
      <h1 className={titleClass}>{post.title}</h1>
      <p className='pt-3 text-[16px] font-semibold uppercase tracking-[0.12em] text-accent-800'>
        Recension · {post.platform}
      </p>
      <div className='mt-6 border-t border-line pt-6'>
        <RatingBox rating={post.rating} verdict={post.verdict} />
      </div>
    </header>
  );
};

export const ArticleHeader = ({ post }: { post: ArticlePost }) => {
  return (
    <header>
      <h1 className={titleClass}>{post.title}</h1>
    </header>
  );
};
