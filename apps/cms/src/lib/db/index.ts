import 'server-only';

import {createClient, type PostgrestSingleResponse} from '@supabase/supabase-js';

import type {Article, ArticleInput} from '@/lib/articles';
import {IMAGE_BUCKET, type Image} from '@/lib/images';

// Service role key bypasses RLS, so this client must never reach the browser.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {auth: {persistSession: false}},
);

const ARTICLE_COLUMNS =
  'id, title, slug, intro, published, published_at, cover_image, body, created_at, updated_at';

// The database uses null where the app uses undefined.
type ArticleRow = Omit<Article, 'cover_image'> & {cover_image: Image | null};

const toArticle = ({cover_image, ...row}: ArticleRow): Article =>
  cover_image ? {...row, cover_image} : row;

const toRow = (input: ArticleInput) => ({
  ...input,
  cover_image: input.cover_image ?? null,
});

const toArticleResult = ({data, error}: PostgrestSingleResponse<ArticleRow>) =>
  error
    ? {data: undefined, error}
    : {data: toArticle(data), error: undefined};

const listArticles = async (): Promise<Article[]> => {
  const {data, error} = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .order('updated_at', {ascending: false})
    .overrideTypes<ArticleRow[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data.map(toArticle);
};

const getArticle = async (id: string): Promise<Article | undefined> => {
  const {data, error} = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .eq('id', id)
    .maybeSingle<ArticleRow>();

  if (error) {
    throw error;
  }

  return data ? toArticle(data) : undefined;
};

const createArticle = async (input: ArticleInput) => {
  return toArticleResult(
    await supabase
      .from('articles')
      .insert(toRow(input))
      .select(ARTICLE_COLUMNS)
      .single<ArticleRow>(),
  );
};

const updateArticle = async (id: string, input: ArticleInput) => {
  return toArticleResult(
    await supabase
      .from('articles')
      .update({...toRow(input), updated_at: new Date().toISOString()})
      .eq('id', id)
      .select(ARTICLE_COLUMNS)
      .single<ArticleRow>(),
  );
};

const uploadImage = async (
  path: string,
  data: Uint8Array,
  contentType: string,
) => {
  return supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, data, {contentType, cacheControl: '31536000'});
};

// Moves the article to the trash table, see db/002_trash.sql.
const deleteArticle = async (id: string) => {
  return supabase.rpc('trash_article', {article_id: id});
};

export const db = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
};
