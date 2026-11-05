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
    <article className='bg-white mb-12 shadow-sm  max-w-[825px]'>
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
      <div className='px-12 py-12'>
        <Heading className='font-bold text-4xl'>{article.title}</Heading>
        {article.body.map((part, i) => {
          switch (part.type) {
            case 'paragraph':
              return <Paragraph key={i} part={part} />;
            case 'quote':
              return <Quote key={i} part={part} />;
          }
          console.warn(logPrefix, 'Unknown type:', part.type);
          return null;
        })}
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

  //console.log('***MARKS', marks);
  //console.log('***PARTS', JSON.stringify(textParts, null, 2));

  //TODO: br
  //TODO: only external links in blank

  return (
    <p className='pt-3'>
      {textParts?.map((textPart) => {
        const markTypes = textPart.activeMarks.map((m) => m.type);
        const lines = textPart.text.split('\n');
        //console.log('***LINE', lines);
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
    <div className='pt-3'>
      <div className='border-l-4 border-gray-600 pl-4'>
        <p className='italic text-gray-600'>{text}</p>
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

/*
[
  {
    "id": "ac294285-e78c-451b-b529-59b3344fcbfe",
    "text": "Min kommersiella 3D-debut. Ett collect-a-thon med vintertema där du iklär dig rollen som Ludde och samlar guldhundben. I takt med att du samlar dessa och mynt får du tillgång till fler prylar och utrustning. Till slut kan du utmana slutbossen.",
    "type": "paragraph",
    "marks": [
      {
        "end": 45,
        "type": "bold",
        "start": 27
      },
      {
        "end": 54,
        "type": "underline",
        "start": 39
      }
    ]
  },
  {
    "id": "3751efcf-95f8-413e-9e5d-63312690bd3b",
    "text": "Fokus har varit på upptäckarglädje, \nspelglädje och variation och utifrån responsen jag har fått från köpare, influerare och recensenter har jag lyckats där.",
    "type": "paragraph"
  }
]
*/
