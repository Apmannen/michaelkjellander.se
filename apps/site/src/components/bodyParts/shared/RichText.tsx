import { MkLink } from '@/components/standard/MkLink';
import { NamedIcon } from '@/components/standard/NamedIcon';
import { BodyMarkPayload } from '@/lib/db/payload.types';

type TextPart = {
  text: string;
  activeMarks: BodyMarkPayload[];
  inners: TextPart[];
};
type LinkMark = Extract<BodyMarkPayload, { type: 'link' }>;

const findLinkMark = (textPart: TextPart) =>
  textPart.activeMarks.find((m): m is LinkMark => m.type === 'link');

const TextPartContent = ({ textPart }: { textPart: TextPart }) => {
  const markTypes = textPart.activeMarks.map((m) => m.type);
  const lines = textPart.text.split('\n');
  const icon = textPart.activeMarks.find((m) => m.type === 'icon');

  return (
    <span
      className={`${markTypes.includes('bold') ? 'font-bold' : ''} ${markTypes.includes('underline') ? 'underline' : ''}`}
    >
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {icon ? <NamedIcon className='inline' iconName={icon.name} /> : line}
        </span>
      ))}
    </span>
  );
};

export const RichText = ({
  text,
  marks,
}: {
  text: string;
  marks: BodyMarkPayload[];
}) => {
  const breaks = Array.from(
    new Set([0, ...(marks.map((mark) => [mark.start, mark.end]).flat() ?? [])]),
  ).sort((a, b) => a - b);

  const textPartsInitial: TextPart[] = [];
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

    textPartsInitial.push({ text: sliced, activeMarks, inners: [] });
  }

  // Group the parts following a link part into it, as long as they belong to
  // the same link mark
  const textParts: TextPart[] = [];
  for (let i = 0; i < textPartsInitial.length; i++) {
    const textPart = textPartsInitial[i];
    textParts.push(textPart);

    const linkMark = findLinkMark(textPart);
    if (!linkMark) {
      continue;
    }

    while (
      i + 1 < textPartsInitial.length &&
      textPartsInitial[i + 1].activeMarks.includes(linkMark)
    ) {
      textPart.inners.push(textPartsInitial[i + 1]);
      i++;
    }
  }

  //TODO: only external links in blank

  return (
    <p className=''>
      {textParts.map((textPart, i1) => {
        const linkMark = findLinkMark(textPart);

        return (
          <MkLink
            enabled={linkMark !== undefined}
            className={{
              link: 'underline hover:text-accent-800',
            }}
            key={i1}
            href={linkMark?.href}
            target='_blank'
          >
            {[textPart, ...textPart.inners].map((innerPart, i2) => (
              <TextPartContent key={i2} textPart={innerPart} />
            ))}
          </MkLink>
        );
      })}
    </p>
  );
};
