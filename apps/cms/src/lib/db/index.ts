import 'server-only';

import {
  createClient,
  type PostgrestError,
  type PostgrestSingleResponse,
} from '@supabase/supabase-js';

import type {Article, ArticleInput, CallToAction} from '@/lib/articles';
import type {Body} from '@/lib/body';
import {IMAGE_BUCKET, type Image} from '@/lib/images';
import type {Tag, TagInput} from '@/lib/tags';

// Service role key bypasses RLS, so this client must never reach the browser.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {auth: {persistSession: false}},
);

// Links to other documents, e.g. an article's tags, are stored in their own
// tables with a position.
type LinkRow<Key extends string> = Record<Key, string> & {position: number};

const toIds = <Key extends string>(rows: LinkRow<Key>[], key: Key) =>
  [...rows].sort((a, b) => a.position - b.position).map((row) => row[key]);

type SaveResult<T> =
  | {data: T; error: undefined}
  | {data: undefined; error: PostgrestError};

const ARTICLE_COLUMNS =
  'id, title, slug, intro, cta, published, published_at, cover_image, body, created_at, updated_at, article_tags!article_tags_article_id_fkey(tag_id, position)';

// The database uses null where the app uses undefined.
type ArticleRow = Omit<Article, 'cover_image' | 'cta' | 'tag_ids'> & {
  cover_image: Image | null;
  cta: CallToAction | null;
  article_tags: LinkRow<'tag_id'>[];
};

const toArticle = ({
  cover_image,
  cta,
  article_tags,
  ...row
}: ArticleRow): Article => ({
  ...row,
  ...(cover_image ? {cover_image} : {}),
  ...(cta ? {cta} : {}),
  tag_ids: toIds(article_tags, 'tag_id'),
});

// The tags are stored separately, see setArticleTags.
const toRow = (input: ArticleInput) => ({
  title: input.title,
  slug: input.slug,
  intro: input.intro,
  cta: input.cta ?? null,
  published: input.published,
  published_at: input.published_at,
  cover_image: input.cover_image ?? null,
  body: input.body,
});

// Replaces the article's tags and gives the article with the tags that were
// set, which leaves out tags that were deleted meanwhile.
const setArticleTags = async (
  {data, error}: PostgrestSingleResponse<ArticleRow>,
  tagIds: string[],
): Promise<SaveResult<Article>> => {
  if (error) {
    return {data: undefined, error};
  }
  const tags = await supabase.rpc('set_article_tags', {
    article_id: data.id,
    tag_ids: tagIds,
  });
  if (tags.error) {
    return {data: undefined, error: tags.error};
  }
  return {
    data: {...toArticle(data), tag_ids: tags.data as string[]},
    error: undefined,
  };
};

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
  return setArticleTags(
    await supabase
      .from('articles')
      .insert(toRow(input))
      .select(ARTICLE_COLUMNS)
      .single<ArticleRow>(),
    input.tag_ids,
  );
};

const updateArticle = async (id: string, input: ArticleInput) => {
  return setArticleTags(
    await supabase
      .from('articles')
      .update({...toRow(input), updated_at: new Date().toISOString()})
      .eq('id', id)
      .select(ARTICLE_COLUMNS)
      .single<ArticleRow>(),
    input.tag_ids,
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

const TAG_COLUMNS =
  'id, name, slug, description, created_at, updated_at, tag_parents!tag_parents_tag_id_fkey(parent_id, position)';

type TagRow = Omit<Tag, 'parent_ids'> & {
  description: Body;
  tag_parents: LinkRow<'parent_id'>[];
};

const toTag = ({tag_parents, ...row}: TagRow): Tag => ({
  ...row,
  parent_ids: toIds(tag_parents, 'parent_id'),
});

// The parents are stored separately, see setTagParents.
const toTagRow = (input: TagInput) => ({
  name: input.name,
  slug: input.slug,
  description: input.description,
});

// Replaces the tag's parents and gives the tag with the parents that were
// set. Fails with check_violation (23514) if a parent is one of the tag's
// descendants.
const setTagParents = async (
  {data, error}: PostgrestSingleResponse<TagRow>,
  parentIds: string[],
): Promise<SaveResult<Tag>> => {
  if (error) {
    return {data: undefined, error};
  }
  const parents = await supabase.rpc('set_tag_parents', {
    tag_id: data.id,
    parent_ids: parentIds,
  });
  if (parents.error) {
    return {data: undefined, error: parents.error};
  }
  return {
    data: {...toTag(data), parent_ids: parents.data as string[]},
    error: undefined,
  };
};

const listTags = async (): Promise<Tag[]> => {
  const {data, error} = await supabase
    .from('tags')
    .select(TAG_COLUMNS)
    .order('name')
    .overrideTypes<TagRow[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data.map(toTag);
};

const createTag = async (input: TagInput) => {
  return setTagParents(
    await supabase
      .from('tags')
      .insert(toTagRow(input))
      .select(TAG_COLUMNS)
      .single<TagRow>(),
    input.parent_ids,
  );
};

const updateTag = async (id: string, input: TagInput) => {
  return setTagParents(
    await supabase
      .from('tags')
      .update({...toTagRow(input), updated_at: new Date().toISOString()})
      .eq('id', id)
      .select(TAG_COLUMNS)
      .single<TagRow>(),
    input.parent_ids,
  );
};

// Moves the tag to the trash table, see db/004_tags.sql.
const deleteTag = async (id: string) => {
  return supabase.rpc('trash_tag', {tag_id: id});
};

export const db = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  uploadImage,
};
