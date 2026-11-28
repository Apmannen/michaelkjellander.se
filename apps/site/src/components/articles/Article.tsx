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
import { LuArrowLeft, LuCalendar, LuTag } from 'react-icons/lu';
import { paths } from '@/lib/paths';
import { dateUtils } from '@/lib/dateUtils';
import { collectionUtils } from '@/lib/collectionUtils';
import { urlUtils } from '@/lib/urlUtils';

export const Article = ({
  article,
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
    | 'published_at'
  >;
}) => {
  const { fields, cta, tags, rating, body, cover_image, title, published_at } =
    article;
  const devYears = fields?.find((f) => f.field.key === 'dev_years')?.text;
  const devTool = fields?.find((f) => f.field.key === 'dev_tool')?.text;
  const playAlso = fields?.find((f) => f.field.key === 'play_also');
  const platforms = tags.filter((t) => t.type === 'game_platform') || [];

  const mainTag = tags[0];
  const mainTagParent = mainTag.tag_parents?.at(0);

  const allParentTags = tags.map((t) => t.tag_parents || []).flat();
  const allTags = collectionUtils.uniqueArrayOnProp(
    [...tags, ...allParentTags],
    (t) => t.id,
  );

  return (
    <article className='bg-default-box sm:mb-12 sm:shadow-sm'>
      <nav
        aria-label='Brödsmulor'
        className='px-default-box flex items-center gap-3 pb-4 pt-6 text-[16px]'
      >
        <MkLink
          href='/'
          className={{ all: 'hover:text-accent-800 flex items-center gap-2' }}
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
        <span className='text-muted'>/</span>
        <MkLink
          href={paths.tag(mainTag)}
          className={{ all: 'hover:text-accent-800' }}
        >
          {mainTag.name}
        </MkLink>
      </nav>
      <div className='sm:px-default-box sm:h-[400px]'>
        {cover_image ? (
          <Image
            src={storage.getPublicUrl(cover_image?.path)}
            alt=''
            width={729}
            height={400}
            className='h-full w-full object-cover sm:rounded-lg'
            loading='eager'
          />
        ) : null}
      </div>
      <div className='px-default-box text-[18px] sm:text-[20px]'>
        <h1
          className='pb-1 pt-3 font-bold leading-[1.00] tracking-[-3.5px]'
          style={{ fontSize: 'clamp(52px,7.5vw,70px)' }}
        >
          {title}
        </h1>
        <h2 className='text-[24px] italic'>{article.intro}</h2>
        <Divider className={{ container: 'py-4' }} />
        {devYears || devTool || cta || platforms.length || rating != null ? (
          <>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div className='text-[16px]'>
                {devYears ? <div>Utvecklingsår: {devYears}</div> : null}
                {devTool ? <div>Utvecklat i: {devTool}</div> : null}
                {rating != null ? (
                  <div className='text-[13px] font-bold uppercase tracking-[0.1em]'>
                    Recension
                  </div>
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
              <div className='flex flex-1 items-center sm:justify-end'>
                {cta ? (
                  <Button
                    href={cta.href}
                    target={
                      urlUtils.isExternalLink(cta.href) ? '_blank' : undefined
                    }
                    iconName={cta.icon}
                  >
                    {cta.text}
                  </Button>
                ) : null}
              </div>
            </div>
            <Divider className={{ container: 'py-4' }} />
          </>
        ) : null}

        <div className='space-y-4'>
          {body.map((part, i) => (
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
                        href: paths.field(playAlso),
                      }
                    : undefined
                }
              />
            </div>
          ) : null}
        </div>
        <footer className='border-line mt-10 flex flex-wrap items-center justify-between gap-4 border-t pb-12 pt-6 text-[16px]'>
          <p className='text-muted flex items-center gap-2'>
            <LuCalendar aria-hidden />
            <span>{dateUtils.formatDate(published_at)}</span>
          </p>
          <div className='flex items-center gap-3'>
            <span className='sr-only'>Taggar:</span>
            <div className='flex flex-wrap gap-1'>
              {allTags.map((tag, i) => (
                <MkLink
                  key={i}
                  className={{
                    all: 'border-accent-300 bg-accent-100 text-accent-800 hover:bg-accent-800 hover:border-accent-800 rounded-lg border px-2 py-0.5 text-[14px] hover:text-white',
                  }}
                  href={paths.tag(tag)}
                >
                  {tag.name}
                </MkLink>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
};
