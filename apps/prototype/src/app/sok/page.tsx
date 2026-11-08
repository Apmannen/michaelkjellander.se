import type { Metadata } from 'next';
import { PageTitle } from '@/components/PageTitle';
import { getAllPosts } from '@/data/posts';
import { SearchPosts } from './SearchPosts';

export const metadata: Metadata = { title: 'Sök' };

export default function Page() {
  return (
    <>
      <PageTitle title='Sök' />
      <SearchPosts posts={getAllPosts()} />
    </>
  );
}
