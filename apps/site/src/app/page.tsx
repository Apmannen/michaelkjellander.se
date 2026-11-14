import 'server-only';

import { MainShell } from '@/components/shells/MainShell';
import { db } from '@/lib/db';
import { ArticleCard } from '@/components/articles/ArticleCard';

//TODO: temporary?
export const instant = false;

export default async function Home() {
  const articles = await db.articles({});

  return (
    <MainShell>
      <div className='max-w-content mx-auto'>
        <h1 className='text-[48px] font-bold leading-none tracking-[-0.03em]'>
          Senaste inläggen
        </h1>
        <h2 className='pt-3 text-[19px] italic text-muted'>
          Min hemsida där jag postar inlägg om lite allt möjligt
        </h2>
        {/* <h1>Artiklar</h1> */}
        <div className='pt-8 w-full'>
          {articles.map((article, i) => (
            <div key={i}>
              <ArticleCard key={i} article={article} />
              {/* <Article article={article} isMain={false} /> */}
            </div>
          ))}
        </div>
      </div>
    </MainShell>
  );
}
