import {
  ArticleBodyPartPayload,
  ArticlePayload,
  BodyMarkPayload,
} from '@/lib/db/payload.types';

const logPrefix = '[Article]';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title' | 'body'>;
  isMain: boolean;
}) => {
  console.log('***ART', article.body);
  const ngClass = {
    title: 'font-bold',
  };
  const Heading = isMain ? 'h1' : 'h2';
  return (
    <article className='px-12 py-12 bg-white mb-12 shadow-sm'>
      <Heading className={ngClass.title}>{article.title}</Heading>
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

  console.log('***MARKS', marks);
  console.log('***PARTS', JSON.stringify(textParts, null, 2));
  //TODO: links
  //TODO: br

  return (
    <p className='pt-3'>
      {textParts?.map((textPart, i) => {
        const markTypes = textPart.activeMarks.map((m) => m.type);
        return (
          <span
            className={`${markTypes.includes('bold') ? 'font-bold' : ''} ${markTypes.includes('underline') ? 'underline' : ''}`}
            key={i}
          >
            {/* {i > 0 ? <br /> : null} */}
            {textPart.text}
          </span>
        );
      })}
    </p>
  );
};

const Quote = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'author'>;
}) => {
  const { text, author } = part;
  return (
    <div className='pt-3'>
      <div className='border-l-4 border-gray-600 pl-4'>
        <p className='italic text-gray-600'>{text}</p>
        <cite className='not-italic pt-3 pb-1 block'>{author}</cite>
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
