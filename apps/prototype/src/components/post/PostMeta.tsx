import { LuCalendar, LuTag } from 'react-icons/lu';
import { Post } from '@/data/types';
import { formatDate } from '@/lib/format';

/** Publiceringsdatum och taggar, längst ner på inläggssidan. */
export const PostMeta = ({ post }: { post: Post }) => {
  return (
    <footer className='mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[16px]'>
      <p className='flex items-center gap-2 text-muted'>
        <LuCalendar aria-hidden />
        <span>
          Publicerad <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </span>
      </p>
      {post.tags.length > 0 ? (
        <div className='flex items-center gap-3'>
          <LuTag aria-hidden className='text-muted' />
          <span className='sr-only'>Taggar:</span>
          <ul className='flex flex-wrap gap-2'>
            {post.tags.map((tag) => (
              <li
                key={tag}
                className='rounded-full border border-accent-200 bg-accent-100 px-3 py-0.5 text-[14px] text-accent-900'
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </footer>
  );
};
