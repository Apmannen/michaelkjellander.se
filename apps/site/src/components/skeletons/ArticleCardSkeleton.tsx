import { Bone } from './Bone';

/** Placeholder matching the layout of ArticleCard. */
export const ArticleCardSkeleton = () => {
  return (
    <div className='bg-default-box mb-6 shadow-sm rounded-lg overflow-hidden flex'>
      <div className='w-4/10'>
        <Bone className='w-full h-[225px] rounded-none' />
      </div>
      <div className='px-5 py-5 sm:px-6 flex-1 flex gap-1.5 flex-col'>
        {/* Tag */}
        <Bone className='h-[13px] w-20 mt-1' />
        {/* Title */}
        <Bone className='h-[30px] w-4/5 mt-1' />
        {/* Intro */}
        <Bone className='h-4 w-3/5 mt-1' />
        {/* Excerpt */}
        <div className='space-y-2 mt-2'>
          <Bone className='h-3.5 w-full' />
          <Bone className='h-3.5 w-11/12' />
        </div>
        {/* Date */}
        <div className='flex-1 flex items-end'>
          <Bone className='h-3.5 w-24' />
        </div>
      </div>
    </div>
  );
};

/** A list of card placeholders, for use as a Suspense fallback. */
export const ArticleCardListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div role='status' aria-label='Laddar inlägg' className='pt-8 w-full'>
      {Array.from({ length: count }, (_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
};
