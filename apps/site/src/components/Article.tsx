import { ArticlePayload } from '@/lib/db/payload.types';
import { storage } from '@/lib/storage';
import Image from 'next/image';
import { Divider } from './standard/Divider';
import { Quote } from './bodyParts/Quote';
import { Paragraph } from './bodyParts/Paragraph';
import { Heading } from './bodyParts/Heading';
import { List } from './bodyParts/List';

//const logPrefix = '[Article]';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title' | 'body' | 'cover_image' | 'intro'>;
  isMain: boolean;
}) => {
  const H = isMain ? 'h1' : 'h2';
  const SecondaryH = isMain ? 'h2' : 'h3';
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
        <H
          className='font-bold tracking-[-3.5px] leading-[1.00] pt-3 pb-1'
          style={{ fontSize: 'clamp(52px,7.5vw,90px)' }}
        >
          {article.title}
        </H>
        <SecondaryH className='text-[24px] italic'>{article.intro}</SecondaryH>
        <Divider />
        <div className='space-y-4'>
          {article.body.map((part, i) => (
            <div key={i} className=''>
              {part.type === 'heading' ? (
                <Heading part={part} />
              ) : part.type === 'paragraph' ? (
                <Paragraph part={part} />
              ) : part.type === 'quote' ? (
                <Quote part={part} />
              ) : part.type === 'divider' ? (
                <Divider />
              ) : part.type === 'list' ? (
                <List part={part} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
