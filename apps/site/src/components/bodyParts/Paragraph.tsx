import {
  ArticleBodyPartPayload,
  BodyMarkPayload,
} from '@/lib/db/payload.types';
import { MkLink } from '../standard/MkLink';
import { NamedIcon } from '../standard/NamedIcon';

type TextPart = { text: string; activeMarks: BodyMarkPayload[] };
export const Paragraph = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'marks'>;
}) => {
  const { text = '', marks = [] } = part;

  const breaks = Array.from(
    new Set([
      0,
      ...(marks
        .map((mark) => (mark.type !== 'icon' ? [mark.start, mark.end] : []))
        .flat() ?? []),
    ]),
  ).sort((a, b) => a - b);

  const textParts: TextPart[] = [];
  for (let i = 0; i < breaks.length; i++) {
    const breakIndex = breaks[i];
    let nextBreakIndex = breaks.at(i + 1);

    const sliced = text.slice(
      breakIndex,
      nextBreakIndex !== undefined ? nextBreakIndex : Number.MAX_SAFE_INTEGER,
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

        const tmpIcon = textPart.activeMarks.find((m) => m.type === 'icon');

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
            {tmpIcon ? <NamedIcon iconName={tmpIcon.name} /> : null}

            {line}
          </MkLink>
        ));
      })}
    </p>
  );
};
