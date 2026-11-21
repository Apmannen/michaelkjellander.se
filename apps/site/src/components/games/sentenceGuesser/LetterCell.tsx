import { Cell } from './lib/puzzle';

type Props = {
  cell: Cell;
  solved: boolean;
  selected: boolean;
  related: boolean;
  wrongLetter: string | undefined;
  onSelect: (cell: Cell) => void;
};

export function LetterCell({
  cell,
  solved,
  selected,
  related,
  wrongLetter,
  onSelect,
}: Props) {
  let boxClass = 'border-ink/70';
  if (selected) {
    boxClass = 'border-accent-700 bg-accent-200';
  } else if (related) {
    boxClass = 'border-ink/70 bg-accent-100';
  }

  let content: string | undefined = undefined;
  let letterClass = 'text-accent-700';
  if (wrongLetter !== undefined) {
    content = wrongLetter;
    letterClass = 'text-red-600 animate-shake';
  } else if (solved) {
    content = cell.letter;
  }

  return (
    <button
      type='button'
      onClick={() => onSelect(cell)}
      disabled={solved}
      aria-label={
        solved
          ? `Ruta ${cell.number}: ${cell.letter}`
          : `Ruta ${cell.number}, tom`
      }
      className='flex w-7 shrink-0 flex-col items-center disabled:cursor-default sm:w-9'
    >
      <span
        className={`flex h-8 w-full items-end justify-center rounded-t border-b-2 pb-0.5 text-xl leading-none font-extrabold transition-colors sm:h-10 sm:text-2xl ${boxClass}`}
      >
        <span className={letterClass}>{content}</span>
      </span>
      <span className='mt-1 text-[11px] leading-none text-muted tabular-nums sm:text-xs'>
        {cell.number}
      </span>
    </button>
  );
}
