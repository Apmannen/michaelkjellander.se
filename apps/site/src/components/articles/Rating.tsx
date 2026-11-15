import { mathUtils } from '@/lib/mathUtils';
import { FaRegStar, FaStar, FaStarHalfStroke } from 'react-icons/fa6';
import { Divider } from '../standard/Divider';
import { MkLink } from '../standard/MkLink';
import { LuArrowRight, LuGamepad2 } from 'react-icons/lu';

export const Stars = ({
  rating5,
  className = '',
}: {
  rating5: number;
  className?: string;
}) => {
  rating5 = mathUtils.clamp(rating5, 0, 5);
  return (
    <span
      className={`inline-flex gap-1 text-accent-800 ${className}`}
      aria-label={`${rating5} av 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        if (rating5 >= n) {
          return <FaStar key={n} />;
        }
        if (rating5 >= n - 0.5) {
          return <FaStarHalfStroke key={n} />;
        }
        return <FaRegStar key={n} />;
      })}
    </span>
  );
};

export const Rating = ({
  rating10,
  playAlso = 'Luddes Äventyr',
}: {
  rating10: number;
  playAlso?: string;
}) => {
  rating10 = mathUtils.clamp(rating10, 1, 10);

  let verdict = (() => {
    switch (rating10) {
      case 1:
        return 'Ospelbart';
      case 2:
        return 'Mycket dåligt';
      case 3:
        return 'Dåligt';
      case 4:
        return 'Ganska dåligt';
      case 5:
        return 'Medelmåttigt';
      case 6:
        return 'Ganska bra';
      case 7:
        return 'Bra';
      case 8:
        return 'Mycket bra';
      case 9:
        return 'Fantastiskt';
      case 10:
        return 'Mästerverk';
    }
    return '';
  })();

  return (
    <div className='rounded-md bg-accent-100  px-4 sm:px-6 py-3 sm:py-4 border border-accent-300'>
      <div className='flex items-center gap-6'>
        <Stars rating5={rating10 / 2} className='text-[20px] sm:text-[24px]' />
        <span className='h-8 w-px bg-accent-300' />
        <span className='text-[20px] sm:text-[24px] italic'>{verdict}</span>
      </div>
      {playAlso ? (
        <div className='border-t border-accent-300 mt-5 pt-3 text-[16px] sm:text-[18px]'>
          <MkLink
            href={'#'}
            className={{ all: 'group flex items-center gap-2' }}
          >
            <>
              <LuGamepad2
                aria-hidden
                className='shrink-0 text-accent-800 text-[22px] sm:text-[24px]'
              />
              <span className='flex-1'>
                <span className='font-semibold text-accent-800 pr-[2px]'>
                  Spela även:{' '}
                </span>
                <span className=''>{playAlso}</span>
              </span>
              <LuArrowRight
                aria-hidden
                className='text-accent-800 transition-transform group-hover:translate-x-1'
              />
            </>
          </MkLink>
        </div>
      ) : null}
    </div>
  );
};
