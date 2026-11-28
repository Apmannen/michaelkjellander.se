import { mathUtils } from '@/lib/mathUtils';
import { FaMinus, FaRegStar, FaStar, FaStarHalfStroke } from 'react-icons/fa6';
import { MkLink } from '../standard/MkLink';
import { LuArrowRight, LuGamepad2 } from 'react-icons/lu';
import { FaPlus } from 'react-icons/fa';
import { IconType } from 'react-icons';

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
      className={`text-accent-800 inline-flex gap-1 ${className}`}
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

const ProConList = ({
  items,
  title,
  Icon,
}: {
  items: string[];
  title: string;
  Icon: IconType;
}) => {
  return (
    <div className=''>
      <div className='pb-2 font-semibold'>{title}</div>
      <ul className='space-y-2 text-[16px]'>
        {items.map((item, i) => (
          <li key={i} className='flex items-start'>
            <span className='mr-2 mt-1'>
              <Icon className='text-accent-800' />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Rating = ({
  rating10,
  playAlsoRather,
  pros,
  cons,
}: {
  rating10: number;
  playAlsoRather?: {
    href?: string;
    game: string;
    type: 'play_also' | 'play_rather';
  };
  pros: string[];
  cons: string[];
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
    <div className='bg-accent-100 border-accent-300 rounded-md border px-4 py-3 sm:px-6 sm:py-4'>
      {pros.length || cons.length ? (
        <div className='border-accent-300 mb-5 grid grid-cols-2 gap-4 border-b pb-3 text-[16px] sm:text-[18px]'>
          <ProConList items={pros} title='Plus' Icon={FaPlus} />
          <ProConList items={cons} title='Minus' Icon={FaMinus} />
        </div>
      ) : null}
      <div className='flex items-center gap-6'>
        <Stars rating5={rating10 / 2} className='text-[20px] sm:text-[24px]' />
        <span className='bg-accent-300 h-8 w-px' />
        <span className='text-[20px] italic sm:text-[24px]'>{verdict}</span>
      </div>
      {playAlsoRather ? (
        <div className='border-accent-300 mt-5 border-t pt-3 text-[16px] sm:text-[18px]'>
          <MkLink
            href={playAlsoRather.href}
            className={{ all: 'group flex items-center gap-2' }}
          >
            <>
              <LuGamepad2
                aria-hidden
                className='text-accent-800 shrink-0 text-[22px] sm:text-[24px]'
              />
              <span className='flex-1'>
                <span className='text-accent-800 pr-[2px] font-semibold'>
                  Spela även:{' '}
                </span>
                <span
                  className={`${playAlsoRather.href ? 'group-hover:underline' : ''}`}
                >
                  {playAlsoRather.game}
                </span>
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
