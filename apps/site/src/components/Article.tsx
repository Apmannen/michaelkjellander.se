import {
  ArticleBodyPartPayload,
  ArticlePayload,
  BodyMarkPayload,
} from '@/lib/db/payload.types';
import { MkLink } from './MkLink';
import { storage } from '@/lib/storage';
import Image from 'next/image';

const logPrefix = '[Article]';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title' | 'body' | 'cover_image'>;
  isMain: boolean;
}) => {
  const Heading = isMain ? 'h1' : 'h2';
  return (
    <article className='bg-white mb-12 shadow-sm max-w-[825px]'>
      {article.cover_image ? (
        <Image
          src={storage.getPublicUrl(article.cover_image?.path)}
          alt=''
          width={825 * 1.0}
          height={510 * 1.0}
          className='w-full h-auto'
          loading='eager'
        />
      ) : null}
      <div className='px-12 py-12 text-[18px]'>
        <Heading
          className='font-bold tracking-[-3.5px] font-georgia'
          style={{ fontSize: 'clamp(52px,7.5vw,90px)' }}
        >
          {article.title}
        </Heading>
        <div className=''>
          {article.body.map((part, i) => (
            <div key={i} className='py-2'>
              {part.type === 'paragraph' ? (
                <Paragraph part={part} />
              ) : part.type === 'quote' ? (
                <Quote part={part} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

const Paragraph = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'marks'>;
}) => {
  const { text = '', marks = [] } = part;

  const breaks = Array.from(
    new Set([0, ...(marks.map((mark) => [mark.start, mark.end]).flat() ?? [])]),
  ).sort((a, b) => a - b);

  const textParts: { text: string; activeMarks: BodyMarkPayload[] }[] = []; //text?.split('\n');
  for (let i = 0; i < breaks.length; i++) {
    const breakIndex = breaks[i];
    const nextBreakIndex = breaks.at(i + 1);
    const sliced = text.slice(
      breakIndex,
      nextBreakIndex !== undefined ? nextBreakIndex : -1,
    );

    const activeMarks: BodyMarkPayload[] = [];
    marks.forEach((aMark) => {
      if (breakIndex >= aMark.start && breakIndex < aMark.end) {
        activeMarks.push(aMark);
      }
    });

    textParts.push({ text: sliced, activeMarks });
  }

  //TODO: only external links in blank

  return (
    <p className=''>
      {textParts?.map((textPart) => {
        const markTypes = textPart.activeMarks.map((m) => m.type);
        const lines = textPart.text.split('\n');
        return lines.map((line, i2) => (
          <MkLink
            enabled={markTypes.includes('link')}
            className={{
              all: `${markTypes.includes('bold') ? 'font-bold' : ''} ${markTypes.includes('underline') ? 'underline' : ''}`,
              link: 'underline hover:text-gray-600 hover:no-underline',
            }}
            key={i2}
            href={textPart.activeMarks.find((m) => m.type === 'link')?.href}
            target='_blank'
          >
            {i2 > 0 ? <br /> : null}
            {line}
          </MkLink>
        ));
      })}
    </p>
  );
};

const Quote = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'author' | 'href'>;
}) => {
  const { text, author, href } = part;
  return (
    <div className='py-1'>
      <div className='border-l-4 border-gray-600 pl-4'>
        <p className='italic text-neutral-600 text-[20px] leading-9'>{text}</p>
        <cite className='not-italic pt-3 pb-1 block'>
          <MkLink
            enabled={!!href}
            href={href}
            className={{
              link: 'underline hover:text-gray-600 hover:no-underline',
            }}
            target='_blank'
          >
            {author}
          </MkLink>
        </cite>
      </div>
    </div>
  );
};
