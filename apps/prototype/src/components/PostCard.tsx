import Image from 'next/image';
import Link from 'next/link';
import { categories } from '@/data/categories';
import { Post } from '@/data/types';
import { formatDate } from '@/lib/format';
import { Stars } from './post/Rating';

const metaFor = (post: Post) => {
  switch (post.kind) {
    case 'game':
      return `${post.engine} · ${post.years}`;
    case 'review':
      return post.platform;
    case 'article':
      return formatDate(post.publishedAt);
  }
};

export const PostCard = ({ post }: { post: Post }) => {
  return (
    <Link
      href={`/inlagg/${post.slug}`}
      className='group flex flex-col overflow-hidden rounded-md bg-default-box shadow-sm transition-shadow hover:shadow-md sm:flex-row'
    >
      <Image
        src={post.cover.src}
        alt=''
        width={1200}
        height={500}
        className='aspect-[12/5] w-full object-cover sm:aspect-auto sm:w-[44%]'
      />
      <div className='flex flex-1 flex-col gap-2 p-5 sm:p-6'>
        <p className='text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-800'>
          {categories[post.category].name}
        </p>
        <h2 className='text-[30px] font-bold leading-tight tracking-tight group-hover:text-accent-800'>
          {post.title}
        </h2>
        {post.kind === 'game' ? <p className='italic'>{post.subtitle}</p> : null}
        {post.kind === 'review' ? (
          <p className='flex items-center gap-3'>
            <Stars rating={post.rating} /> <span className='italic'>{post.verdict}</span>
          </p>
        ) : null}
        <p className='text-[16px] leading-relaxed text-muted'>{post.excerpt}</p>
        <p className='mt-auto pt-2 text-[14px] text-muted'>{metaFor(post)}</p>
      </div>
    </Link>
  );
};

export const PostList = ({ posts }: { posts: Post[] }) => {
  if(posts.length === 0) {
    return <p className='py-8 italic text-muted'>Inga inlägg här än.</p>;
  }

  return (
    <div className='flex flex-col gap-6'>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
};
