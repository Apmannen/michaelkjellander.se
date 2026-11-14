import { Divider } from '../standard/Divider';
import { Bone } from './Bone';

const paragraphWidths = [
  ['w-full', 'w-full', 'w-11/12', 'w-2/3'],
  ['w-full', 'w-10/12', 'w-full', 'w-1/2'],
  ['w-full', 'w-full', 'w-3/4'],
];

/** Placeholder matching the layout of Article. */
export const ArticleSkeleton = () => {
  return (
    <article
      role='status'
      aria-label='Laddar inlägg'
      className='bg-default-box mb-12 shadow-sm pt-12'
    >
      {/* Cover image */}
      <div className='sm:px-12 h-[220px] sm:h-[400px]'>
        <Bone className='w-full h-full rounded-none sm:rounded-lg' />
      </div>

      <div className='px-4 sm:px-12'>
        {/* Title */}
        <div className='pt-4 pb-2'>
          <Bone
            className='w-4/5'
            style={{ height: 'clamp(44px,6.5vw,78px)' }}
          />
        </div>
        {/* Intro */}
        <Bone className='h-6 w-3/5 mt-2' />

        <Divider className={{ container: 'py-4' }} />

        {/* Body */}
        <div className='space-y-6'>
          {paragraphWidths.map((lines, i) => (
            <div key={i} className='space-y-3'>
              {lines.map((w, j) => (
                <Bone key={j} className={`h-4 sm:h-5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
        <div className='h-12' />
      </div>
    </article>
  );
};
