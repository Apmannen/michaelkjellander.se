import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PageTitle } from '@/components/PageTitle';
import { PostList } from '@/components/PostCard';
import { categories, categoryList, isCategoryId } from '@/data/categories';
import { getPostsByCategory } from '@/data/posts';

export const generateStaticParams = () => {
  return categoryList.map((category) => ({ category: category.id }));
};

export const generateMetadata = async (props: PageProps<'/kategori/[category]'>): Promise<Metadata> => {
  const { category } = await props.params;
  return { title: isCategoryId(category) ? categories[category].name : undefined };
};

export default async function Page(props: PageProps<'/kategori/[category]'>) {
  const { category: categoryId } = await props.params;

  if(!isCategoryId(categoryId)) {
    notFound();
  }

  const category = categories[categoryId];

  return (
    <>
      <PageTitle title={category.name} intro={category.description} />
      <CategoryFilter active={category.id} />
      <PostList posts={getPostsByCategory(category.id)} />
    </>
  );
}
