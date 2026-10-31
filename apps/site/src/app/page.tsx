import 'server-only';

import { dbArticles } from '@/lib/db/articles';
import { Article } from '@/components/Article';
import { MainShell } from '@/components/shells/MainShell';

//TODO: temporary?
export const instant = false;

export default async function Home() {
  const articles = await dbArticles.latest();

  return (
    <MainShell>
      <h1>Artiklar</h1>
      {articles.map((article, i) => (
        <Article key={i} article={article} isMain={false} />
      ))}
    </MainShell>
  );
}
