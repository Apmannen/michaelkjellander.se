const ROWS = ['QWERTYUIOPÅ', 'ASDFGHJKLÖÄ', 'ZXCVBNM'];

type Props = {
  disabled: boolean;
  onLetter: (letter: string) => void;
  onHint: () => void;
};

export function Keyboard({ disabled, onLetter, onHint }: Props) {
  return (
    <div className='flex flex-col gap-1.5'>
      {ROWS.map((row, rowIndex) => (
        <div key={row} className='flex justify-center gap-1'>
          {[...row].map((letter) => (
            <button
              key={letter}
              type='button'
              disabled={disabled}
              onClick={() => onLetter(letter)}
              className='h-11 max-w-10 flex-1 rounded-md bg-default-box text-base font-bold text-ink shadow-sm ring-1 ring-line active:bg-accent-100 disabled:opacity-40 sm:h-12'
            >
              {letter}
            </button>
          ))}
          {rowIndex === ROWS.length - 1 && (
            <button
              type='button'
              disabled={disabled}
              onClick={onHint}
              className='h-11 flex-[2.5] max-w-28 rounded-md bg-accent-700 px-2 text-sm font-semibold text-white shadow-sm active:bg-accent-800 disabled:opacity-40 sm:h-12'
            >
              💡 Ledtråd
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
