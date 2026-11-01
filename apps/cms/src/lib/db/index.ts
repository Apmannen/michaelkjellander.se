import 'server-only';

import {createClient} from '@supabase/supabase-js';

import type {Article, ArticleInput} from '@/lib/articles';

// Service role key bypasses RLS, so this client must never reach the browser.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {auth: {persistSession: false}},
);

const ARTICLE_COLUMNS = 
  'id, title, slug, published, body, created_at, updated_at';

const listArticles = async (): Promise<Article[]> => {
  const {data, error} = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .order('updated_at', {ascending: false});

  if (error) {
    throw error;
  }

  return data;
};

const getArticle = async (id: string): Promise<Article | null> => {
  const {data, error} = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const createArticle = async (input: ArticleInput) => {
  return supabase
    .from('articles')
    .insert(input)
    .select(ARTICLE_COLUMNS)
    .single<Article>();
};

const updateArticle = async (id: string, input: ArticleInput) => {
  return supabase
    .from('articles')
    .update({...input, updated_at: new Date().toISOString()})
    .eq('id', id)
    .select(ARTICLE_COLUMNS)
    .single<Article>();
};

export const db = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
};
