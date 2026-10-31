import 'server-only';

import { db } from '@/lib/db';
import Image from 'next/image';
import { dbArticles } from '@/lib/db/articles';
import { Article } from '@/components/Article';

//TODO: temporary?
export const instant = false;

export default async function Home() {
  const articles = await dbArticles.latest();

  return (
    <div>
      <main>
        <h1>Artiklar</h1>
        {articles.map((article, i) => (
          <Article key={i} article={article} isMain={false} />
        ))}
      </main>
    </div>
  );
}
