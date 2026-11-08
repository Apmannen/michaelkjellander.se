import { FaRegStar, FaStar, FaStarHalfStroke } from 'react-icons/fa6';

export const Stars = ({ rating, className = '' }: { rating: number; className?: string }) => {
  return (
    <span className={`inline-flex gap-1 text-accent-800 ${className}`} aria-label={`${rating} av 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        if(rating >= n) {
          return <FaStar key={n} />;
        }
        if(rating >= n - 0.5) {
          return <FaStarHalfStroke key={n} />;
        }
        return <FaRegStar key={n} />;
      })}
    </span>
  );
};

export const RatingBox = ({ rating, verdict }: { rating: number; verdict: string }) => {
  return (
    <div className='flex items-center gap-6 rounded-md bg-accent-100 px-6 py-3'>
      <Stars rating={rating} className='text-[24px]' />
      <span className='h-8 w-px bg-accent-300' />
      <span className='text-[28px] italic'>{verdict}</span>
    </div>
  );
};
