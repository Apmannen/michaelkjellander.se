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
    <div className='bg-default-box mb-12 shadow-sm max-w-content rounded-lg overflow-hidden'>
      {cover_image ? (
        <Image
          src={storage.getPublicUrl(cover_image.path)}
          alt=''
          width={1200}
          height={500}
          className='aspect-[12/5] w-full object-cover sm:aspect-auto sm:w-[44%]'
        />
      ) : null}
    </div>
  );
};
