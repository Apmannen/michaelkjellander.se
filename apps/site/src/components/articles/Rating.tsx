import { mathUtils } from '@/lib/mathUtils';
import { FaRegStar, FaStar, FaStarHalfStroke } from 'react-icons/fa6';

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

export const Rating = ({ rating10 }: { rating10: number }) => {
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
    <div className='flex items-center gap-6 rounded-md bg-accent-100 px-6 py-3'>
      <Stars rating5={rating10} className='text-[24px]' />
      <span className='h-8 w-px bg-accent-300' />
      <span className='text-[28px] italic'>{verdict}</span>
    </div>
  );
};
