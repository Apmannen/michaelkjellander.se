import { ArticlePayload } from '@/lib/db/payload.types';
import { storage } from '@/lib/storage';
import Image from 'next/image';
import { Divider } from './standard/Divider';
import { Quote } from './bodyParts/Quote';
import { Paragraph } from './bodyParts/Paragraph';
import { Heading } from './bodyParts/Heading';
import { List } from './bodyParts/List';
import { Button } from './standard/Button';

//const logPrefix = '[Article]';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<
    ArticlePayload,
    'title' | 'body' | 'cover_image' | 'intro' | 'cta' | 'fields'
  >;
  isMain: boolean;
}) => {
  const { fields } = article;
  const devYears = fields?.find((f) => f.field.key === 'dev_years')?.text;
  const devTool = fields?.find((f) => f.field.key === 'dev_tool')?.text;
  //TODO: can remove this since we won't display full articles in a feed
  const H = isMain ? 'h1' : 'h2';
  const SecondaryH = isMain ? 'h2' : 'h3';
  return (
    <article className='bg-default-box mb-12 shadow-sm max-w-[825px] pt-12'>
      <div className='sm:px-12 sm:h-[400px]'>
        {article.cover_image ? (
          <Image
            src={storage.getPublicUrl(article.cover_image?.path)}
            alt=''
            width={729}
            height={400}
            className='w-full sm:rounded-lg object-cover h-full'
            loading='eager'
          />
        ) : null}
      </div>
      <div className='px-4 sm:px-12 text-[20px]'>
        <H
          className='font-bold tracking-[-3.5px] leading-[1.00] pt-3 pb-1'
          style={{ fontSize: 'clamp(52px,7.5vw,90px)' }}
        >
          {article.title}
        </H>
        <SecondaryH className='text-[24px] italic'>{article.intro}</SecondaryH>
        <Divider className={{ container: 'py-4' }} />
        <div className='flex sm:items-center flex-col sm:flex-row gap-2'>
          <div className='text-[16px]'>
            {devYears ? <div>Utvecklat i: {devYears}</div> : null}
            {devTool ? <div>Utvecklingsår: {devTool}</div> : null}
          </div>
          <div className='flex-1 flex items-center sm:justify-end'>
            {article.cta ? (
              <Button
                href={article.cta.href}
                target='_blank'
                iconName={article.cta.icon}
              >
                {article.cta.text}
              </Button>
            ) : null}
          </div>
        </div>
        <Divider className={{ container: 'py-4' }} />
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
                <Divider className={{ container: 'py-4' }} />
              ) : part.type === 'list' ? (
                <List part={part} />
              ) : null}
            </div>
          ))}
        </div>
        <div className='h-12'></div>
        {/* <Divider className={{ container: 'py-8' }} /> */}
      </div>
      {/* <div className='px-12 flex justify-start pb-12  text-muted'>
        Publicerad 2026-01-03
      </div> */}
      {/* <footer className='mt-8 border-t border-[#E8DBCF] py-6'>
        <div className='px-12 text-muted'>2026-01-03</div>
      </footer> */}
      {/* <footer className='mt-0 py-12'>
        <div className='h-' />
        <div className='px-12 flex justify-start'>Publicerad 2026-01-03</div>
        <div className='h' />
      </footer>  */}
    </article>
  );
};
