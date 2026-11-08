import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostPage } from '@/components/post/PostPage';
import { getAllPosts, getPostBySlug } from '@/data/posts';

export const generateStaticParams = () => {
  return getAllPosts().map((post) => ({ slug: post.slug }));
};

export const generateMetadata = async (props: PageProps<'/inlagg/[slug]'>): Promise<Metadata> => {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  return { title: post?.title, description: post?.excerpt };
};

export default async function Page(props: PageProps<'/inlagg/[slug]'>) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);

  if(!post) {
    notFound();
  }

  return <PostPage post={post} />;
}
