import { ArticlePayload } from '@/lib/db/payload.types';
import Image from 'next/image';
import { Divider } from '../standard/Divider';
import { Quote } from '../richText/Quote';
import { Paragraph } from '../richText/Paragraph';
import { Heading } from '../richText/Heading';
import { List } from '../richText/List';
import { Button } from '../standard/Button';
import { storage } from '@/lib/db/storage';
import { MkLink } from '../standard/MkLink';
import { Rating } from './Rating';
import { LuArrowLeft } from 'react-icons/lu';
import { paths } from '@/lib/paths';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<
    ArticlePayload,
    | 'title'
    | 'body'
    | 'cover_image'
    | 'intro'
    | 'cta'
    | 'fields'
    | 'tags'
    | 'rating'
  >;
  isMain: boolean;
}) => {
  const { fields, cta, tags, rating } = article;
  const devYears = fields?.find((f) => f.field.key === 'dev_years')?.text;
  const devTool = fields?.find((f) => f.field.key === 'dev_tool')?.text;
  const playAlso = fields?.find((f) => f.field.key === 'play_also');
  const platforms = tags?.filter((t) => t.type === 'game_platform') || [];
  const H = isMain ? 'h1' : 'h2';
  const SecondaryH = isMain ? 'h2' : 'h3';

  const mainTag = tags?.at(0);
  const mainTagParent = mainTag?.tag_parents?.at(0);

  return (
    <article className='bg-default-box mb-12 shadow-sm'>
      <nav
        aria-label='Brödsmulor'
        className='flex items-center gap-3 text-[16px] px-default-box pt-6 pb-4'
      >
        <MkLink
          href='/'
          className={{ all: 'flex items-center gap-2 hover:text-accent-800' }}
        >
          <LuArrowLeft aria-hidden /> Inlägg
        </MkLink>
        {mainTagParent ? (
          <>
            <span className='text-muted'>/</span>
            <MkLink
              href={paths.tag(mainTagParent)}
              className={{ all: 'hover:text-accent-800' }}
            >
              {mainTagParent.name}
            </MkLink>
          </>
        ) : null}
        {mainTag ? (
          <>
            <span className='text-muted'>/</span>
            <MkLink
              href={paths.tag(mainTag)}
              className={{ all: 'hover:text-accent-800' }}
            >
              {mainTag.name}
            </MkLink>
          </>
        ) : null}
      </nav>
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
      <div className='px-default-box text-[18px] sm:text-[20px]'>
        <H
          className='font-bold tracking-[-3.5px] leading-[1.00] pt-3 pb-1'
          style={{ fontSize: 'clamp(52px,7.5vw,90px)' }}
        >
          {article.title}
        </H>
        <SecondaryH className='text-[24px] italic'>{article.intro}</SecondaryH>
        <Divider className={{ container: 'py-4' }} />
        {devYears || devTool || cta || platforms.length || rating != null ? (
          <>
            <div className='flex sm:items-center flex-col sm:flex-row gap-2'>
              <div className='text-[16px]'>
                {devYears ? <div>Utvecklingsår: {devYears}</div> : null}
                {devTool ? <div>Utvecklat i: {devTool}</div> : null}
                {rating != null ? (
                  <div className='font-bold'>Recension</div>
                ) : null}
                {platforms.length ? (
                  <div>
                    Testat på:{' '}
                    {platforms.map((p, i) => (
                      <MkLink
                        key={i}
                        href='#'
                        className={{ link: 'hover:underline' }}
                      >
                        {p.name}
                      </MkLink>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className='flex-1 flex items-center sm:justify-end'>
                {cta ? (
                  <Button href={cta.href} target='_blank' iconName={cta.icon}>
                    {cta.text}
                  </Button>
                ) : null}
              </div>
            </div>
            <Divider className={{ container: 'py-4' }} />
          </>
        ) : null}

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
          {rating != null ? (
            <div className='pt-2'>
              <Rating
                rating10={rating}
                playAlsoRather={
                  playAlso
                    ? {
                        game: playAlso.text,
                        type: 'play_also',
                        href: playAlso.target_article ? paths.article(playAlso.target_article) : undefined,
                      }
                    : undefined
                }
              />
            </div>
          ) : null}
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
