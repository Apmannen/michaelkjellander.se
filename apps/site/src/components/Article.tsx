import {
  ArticleBodyPartPayload,
  ArticlePayload,
  BodyMarkPayload,
} from '@/lib/db/payload.types';
import { MkLink } from './MkLink';
import { storage } from '@/lib/storage';
import Image from 'next/image';
import { Divider } from './Divider';
import { Quote } from './bodyParts/Quote';
import { Paragraph } from './bodyParts/Paragraph';

const logPrefix = '[Article]';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title' | 'body' | 'cover_image' | 'intro'>;
  isMain: boolean;
}) => {
  const Heading = isMain ? 'h1' : 'h2';
  const SecondaryHeading = isMain ? 'h2' : 'h3';
  return (
    <article className='bg-default-box mb-12 shadow-sm max-w-[825px] py-12'>
      <div className='px-12 h-[400px]'>
        {article.cover_image ? (
          <Image
            src={storage.getPublicUrl(article.cover_image?.path)}
            alt=''
            width={729}
            height={400}
            className='w-full rounded-lg object-cover h-full'
            loading='eager'
          />
        ) : null}
      </div>
      <div className='px-12 text-[20px]'>
        <Heading
          className='font-bold tracking-[-3.5px] leading-[1.00] pt-3 pb-1'
          style={{ fontSize: 'clamp(52px,7.5vw,90px)' }}
        >
          {article.title}
        </Heading>
        <SecondaryHeading className='text-[24px] italic'>
          {article.intro}
        </SecondaryHeading>
        <Divider />
        <div className='space-y-4'>
          {article.body.map((part, i) => (
            <div key={i} className=''>
              {part.type === 'paragraph' ? (
                <Paragraph part={part} />
              ) : part.type === 'quote' ? (
                <Quote part={part} />
              ) : part.type === 'divider' ? (
                <Divider />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
