import {
  ArticleBodyPartPayload,
  BodyMarkPayload,
} from '@/lib/db/payload.types';
import { MkLink } from '../standard/MkLink';

type TextPart = { text: string; activeMarks: BodyMarkPayload[] };
type TextPartWithInners = TextPart & { inners: TextPart[] };
export const Paragraph = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'marks'>;
}) => {
  const { text = '', marks = [] } = part;

  const breaks = Array.from(
    new Set([0, ...(marks.map((mark) => [mark.start, mark.end]).flat() ?? [])]),
  ).sort((a, b) => a - b);

  const textPartsInitial: TextPartWithInners[] = [];
  for (let i = 0; i < breaks.length; i++) {
    const breakIndex = breaks[i];
    const nextBreakIndex = breaks.at(i + 1);
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

    textPartsInitial.push({ text: sliced, activeMarks, inners: [] });
  }
  const textParts: (TextPart & { inner?: TextPart })[] = [];
  for (let i1 = 0; i1 < textPartsInitial.length; i1++) {
    const part = textPartsInitial[i1];
    if (part.activeMarks.some((m) => m.type === 'link')) {
      textParts.push(part);
      for (let i2 = i1 + 1; i2 < textPartsInitial.length; i2++) {
        i1 = i2;
        if (!part.activeMarks.some((m) => m.type === 'link')) {
          break;
        }
        //part.inners.push(textPartsInitial[i2]);
      }
    } else {
      textParts.push(part);
    }
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
