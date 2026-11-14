import { ArticlePayload } from '@/lib/db/payload.types';
import Image from 'next/image';
import { storage } from '@/lib/db/storage';
import { MkLink } from '../standard/MkLink';
import { paths } from '@/lib/paths';
import { dateUtils } from '@/lib/dateUtils';

export const ArticleCard = ({
  article,
}: {
  article: Pick<
    ArticlePayload,
    | 'title'
    | 'cover_image'
    | 'tags'
    | 'slug'
    | 'intro'
    | 'body'
    | 'published_at'
  >;
}) => {
  const { title, cover_image, intro, body, tags, published_at } = article;

  const paragraph = body.find((part) => part.type === 'paragraph')?.text;
  const split = paragraph?.split(' ');
  let maxLength = 100;
  let excerpt = '';
  if (paragraph?.length && split) {
    if (paragraph?.length <= maxLength) {
      excerpt = paragraph;
    } else {
      for (let i = 0; i < split.length; i++) {
        const word = split[i];
        if (i > 0) {
          excerpt += ' ';
        }
        excerpt += word;
        if (excerpt.length > maxLength) {
          break;
        }
      }
      if (excerpt && !excerpt.endsWith('.')) {
        excerpt += '...';
      }
    }
  }
  const mainTag = tags?.at(0);

  return (
    <MkLink
      className={{
        all: 'bg-default-box mb-6 shadow-sm rounded-lg overflow-hidden flex group hover:outline-2 outline-accent-800',
      }}
      href={paths.article(article)}
    >
      <div className='w-4/10 overflow-hidden'>
        {cover_image ? (
          <Image
            src={storage.getPublicUrl(cover_image.path)}
            alt=''
            width={400}
            height={225}
            className='w-full h-[225px] object-cover group-hover:scale-110 transition-transform duration-200 ease-out '
          />
        ) : null}
      </div>
      <div className='px-5 py-5 sm:px-6 flex-1 flex gap-1.5 flex-col'>
        <p className='text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-800'>
          {mainTag?.singular_name || mainTag?.name}
        </p>
        <h3 className='text-[30px] font-bold leading-none tracking-tight group-hover:text-accent-800'>
          {title}
        </h3>
        <h4 className='italic'>{intro}</h4>
        <p className='overflow-hidden text-muted'>{excerpt}</p>
        <div className='flex-1 flex items-end'>
          <p className='text-muted text-[14px]'>
            {dateUtils.formatDate(published_at)}
          </p>
        </div>
      </div>
    </MkLink>
  );
};
