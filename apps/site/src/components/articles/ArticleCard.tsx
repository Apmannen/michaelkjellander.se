import { ArticlePayload } from '@/lib/db/payload.types';
import { Article } from './Article';
import Image from 'next/image';
import { storage } from '@/lib/db/storage';

export const ArticleCard = ({
  article,
}: {
  article: Pick<ArticlePayload, 'title' | 'cover_image'>;
}) => {
  const { title, cover_image } = article;
  return (
    <div className='bg-default-box mb-12 shadow-sm rounded-lg overflow-hidden flex'>
      {cover_image ? (
        <Image
          src={storage.getPublicUrl(cover_image.path)}
          alt=''
          width={400}
          height={210}
          className='w-4/10 h-[210px]'
        />
      ) : null}
      <div className='p-5 sm:p-6'>
        <h3 className='text-[30px] font-bold leading-none'>{title}</h3>
      </div>
    </div>
  );
};
