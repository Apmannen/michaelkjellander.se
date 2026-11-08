import type { Metadata } from 'next';
import { PageTitle } from '@/components/PageTitle';
import { PostList } from '@/components/PostCard';
import { getAllPosts } from '@/data/posts';

export const metadata: Metadata = { title: 'Spel' };

export default function Page() {
  const posts = getAllPosts();
  const ownGames = posts.filter((post) => post.kind === 'game');
  const reviews = posts.filter((post) => post.kind === 'review');

  return (
    <>
      <PageTitle title='Spel' intro='Det jag har byggt själv, och det jag har spelat.' />
      <h2 className='pb-4 pt-2 text-[28px] font-bold tracking-tight'>Mina spel</h2>
      <PostList posts={ownGames} />
      <h2 className='pb-4 pt-12 text-[28px] font-bold tracking-tight'>Recenserade spel</h2>
      <PostList posts={reviews} />
    </>
  );
}
