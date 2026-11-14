import 'server-only';

import { Article } from '@/components/Article';
import { MainShell } from '@/components/shells/MainShell';
import { db } from '@/lib/db';

//TODO: temporary?
export const instant = false;

export default async function Home() {
  const articles = await db.articles({});

  return (
    <MainShell>
      {/* <h1>Artiklar</h1> */}
      {articles.map((article, i) => (
        <Article key={i} article={article} isMain={false} />
      ))}
    </MainShell>
  );
}
