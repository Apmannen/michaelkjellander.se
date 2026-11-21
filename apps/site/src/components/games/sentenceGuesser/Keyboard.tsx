const ROWS = ['QWERTYUIOPÅ', 'ASDFGHJKLÖÄ', 'ZXCVBNM'];

type Props = {
  disabled: boolean;
  onLetter: (letter: string) => void;
};

export function Keyboard({ disabled, onLetter }: Props) {
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
        </div>
      ))}
    </div>
  );
}
