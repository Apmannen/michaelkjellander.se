import 'server-only';

import { MainShell } from '@/components/shells/MainShell';
import { db } from '@/lib/db';
import { ArticleCard } from '@/components/articles/ArticleCards';
import { Article } from '@/components/articles/Article';

//TODO: temporary?
export const instant = false;

export default async function Home() {
  const articles = await db.articles({});

  return (
    <MainShell>
      <h1 className='text-[48px] font-bold leading-none tracking-[-0.03em]'>
        Senaste inläggen
      </h1>
      {/* <h1>Artiklar</h1> */}
      {articles.map((article, i) => (
        <div key={i}>
          <ArticleCard key={i} article={article} />
          <Article article={article} isMain={false} />
        </div>
      ))}
    </MainShell>
  );
}
