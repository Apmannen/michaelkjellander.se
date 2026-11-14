import { ArticlePayload } from '@/lib/db/payload.types';
import Image from 'next/image';
import { storage } from '@/lib/db/storage';
import { MkLink } from '../standard/MkLink';
import { paths } from '@/lib/paths';

export const ArticleCard = ({
  article,
}: {
  article: Pick<ArticlePayload, 'title' | 'cover_image' | 'tags' | 'slug'>;
}) => {
  const { title, cover_image } = article;
  return (
    <MkLink
      className={{
        all: 'bg-default-box mb-6 shadow-sm rounded-lg overflow-hidden flex group',
      }}
      href={paths.article(article)}
    >
      {cover_image ? (
        <Image
          src={storage.getPublicUrl(cover_image.path)}
          alt=''
          width={400}
          height={210}
          className='w-4/10 h-[210px] object-cover'
        />
      ) : null}
      <div className='p-5 sm:p-6'>
        <h3 className='text-[30px] font-bold leading-tight tracking-tight group-hover:text-accent-800'>
          {title}
        </h3>
      </div>
    </MkLink>
  );
};
