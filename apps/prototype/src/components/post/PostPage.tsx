import Image from 'next/image';
import Link from 'next/link';
import { LuArrowLeft, LuArrowRight, LuGamepad2 } from 'react-icons/lu';
import { categories } from '@/data/categories';
import { Post, ReviewPost } from '@/data/types';
import { Divider } from '../Divider';
import { PostBody } from './PostBody';
import { PostMeta } from './PostMeta';
import { ArticleHeader, GameHeader, ReviewHeader } from './PostHeaders';

export const PostPage = ({ post }: { post: Post }) => {
  const category = categories[post.category];

  return (
    <article className='pt-5'>
      <nav aria-label='Brödsmulor' className='flex items-center gap-3 text-[16px]'>
        <Link href='/' className='flex items-center gap-2 hover:text-accent-800'>
          <LuArrowLeft aria-hidden /> Inlägg
        </Link>
        <span className='text-muted'>/</span>
        <Link href={`/kategori/${category.id}`} className='hover:text-accent-800'>
          {category.name}
        </Link>
      </nav>

      <Image
        src={post.cover.src}
        alt={post.cover.alt}
        width={1200}
        height={500}
        priority
        className='mt-5 aspect-[12/5] w-full rounded-md object-cover shadow-sm'
      />

      <div className='px-1 pt-8 text-[19px] leading-[1.6] sm:px-4'>
        {post.kind === 'game' ? <GameHeader post={post} /> : null}
        {post.kind === 'review' ? <ReviewHeader post={post} /> : null}
        {post.kind === 'article' ? <ArticleHeader post={post} /> : null}

        {post.kind !== 'review' ? <Divider /> : <div className='pt-6' />}

        <p className='drop-cap pb-5'>{post.lead}</p>
        <PostBody blocks={post.body} />

        {post.kind === 'review' && post.alsoPlay ? <AlsoPlay alsoPlay={post.alsoPlay} /> : null}

        <PostMeta post={post} />
      </div>
    </article>
  );
};

const AlsoPlay = ({ alsoPlay }: { alsoPlay: NonNullable<ReviewPost['alsoPlay']> }) => {
  const href = alsoPlay.slug ? `/inlagg/${alsoPlay.slug}` : alsoPlay.href;
  const content = (
    <>
      <LuGamepad2 aria-hidden className='shrink-0 text-[26px] text-accent-800' />
      <span className='flex-1 text-[24px]'>
        <span className='font-bold text-accent-800'>Spela även: </span>
        <span className='italic'>{alsoPlay.title}</span>
      </span>
      {href ? <LuArrowRight aria-hidden className='text-[26px] text-accent-800 transition-transform group-hover:translate-x-1' /> : null}
    </>
  );

  return (
    <div className='mt-8 border-y border-line py-5'>
      {href ? (
        <Link href={href} className='group flex items-center gap-4'>
          {content}
        </Link>
      ) : (
        <div className='flex items-center gap-4'>{content}</div>
      )}
    </div>
  );
};
