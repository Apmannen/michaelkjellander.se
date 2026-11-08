import { CategoryFilter } from '@/components/CategoryFilter';
import { PageTitle } from '@/components/PageTitle';
import { PostList } from '@/components/PostCard';
import { getAllPosts } from '@/data/posts';

export default function Home() {
  return (
    <>
      <PageTitle title='Inlägg' intro='Spel jag har gjort, spel jag har spelat och annat jag funderar på.' />
      <CategoryFilter />
      <PostList posts={getAllPosts()} />
    </>
  );
}
