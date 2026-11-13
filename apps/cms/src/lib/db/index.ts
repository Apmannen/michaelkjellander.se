import 'server-only';

import {
  createClient,
  type PostgrestError,
  type PostgrestSingleResponse,
} from '@supabase/supabase-js';

import type {
  Article,
  ArticleInput,
  ArticleSummary,
  CallToAction,
} from '@/lib/articles';
import type {Body} from '@/lib/body';
import type {
  FieldDefinition,
  FieldDefinitionInput,
  FieldValue,
} from '@/lib/fields';
import {IMAGE_BUCKET, type Image} from '@/lib/images';
import type {Board, Issue, IssueColumn, IssueInput} from '@/lib/issues';
import type {NewSiteInput, Site, SiteInput} from '@/lib/sites';
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
  'id, title, slug, intro, cta, published, published_at, cover_image, body, created_at, updated_at, article_tags!article_tags_article_id_fkey(tag_id, position), article_field_values!article_field_values_article_id_fkey(field_id, position, text, href, target_article_id)';

// The database uses null where the app uses undefined.
type FieldValueRow = {
  field_id: string;
  text: string;
  href: string | null;
  target_article_id: string | null;
};

const toFieldValue = ({
  field_id,
  text,
  href,
  target_article_id,
}: FieldValueRow): FieldValue => ({
  field_id,
  text,
  ...(href ? {href} : {}),
  ...(target_article_id ? {target_article_id} : {}),
});

type ArticleRow = Omit<
  Article,
  'cover_image' | 'cta' | 'tag_ids' | 'field_values'
> & {
  cover_image: Image | null;
  cta: CallToAction | null;
  article_tags: LinkRow<'tag_id'>[];
  article_field_values: (FieldValueRow & {position: number})[];
};

const toArticle = ({
  cover_image,
  cta,
  article_tags,
  article_field_values,
  ...row
}: ArticleRow): Article => ({
  ...row,
  ...(cover_image ? {cover_image} : {}),
  ...(cta ? {cta} : {}),
  tag_ids: toIds(article_tags, 'tag_id'),
  field_values: [...article_field_values]
    .sort((a, b) => a.position - b.position)
    .map(toFieldValue),
});

// The tags and field values are stored separately, see setArticleLinks.
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

// Replaces the article's tags and field values, and gives the article with
// the ones that were set, which leaves out e.g. tags that were deleted
// meanwhile. Each of them is replaced in one transaction.
const setArticleLinks = async (
  {data, error}: PostgrestSingleResponse<ArticleRow>,
  input: ArticleInput,
): Promise<SaveResult<Article>> => {
  if (error) {
    return {data: undefined, error};
  }
  const tags = await supabase.rpc('set_article_tags', {
    article_id: data.id,
    tag_ids: input.tag_ids,
  });
  if (tags.error) {
    return {data: undefined, error: tags.error};
  }
  const fieldValues = await supabase.rpc('set_article_field_values', {
    article_id: data.id,
    field_values: input.field_values,
  });
  if (fieldValues.error) {
    return {data: undefined, error: fieldValues.error};
  }
  return {
    data: {
      ...toArticle(data),
      tag_ids: tags.data as string[],
      field_values: (fieldValues.data as FieldValueRow[]).map(toFieldValue),
    },
    error: undefined,
  };
};

const listArticles = async (siteId: string): Promise<Article[]> => {
  const {data, error} = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .eq('site_id', siteId)
    .order('updated_at', {ascending: false})
    .overrideTypes<ArticleRow[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data.map(toArticle);
};

const getArticle = async (
  siteId: string,
  id: string,
): Promise<Article | undefined> => {
  const {data, error} = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .eq('site_id', siteId)
    .eq('id', id)
    .maybeSingle<ArticleRow>();

  if (error) {
    throw error;
  }

  return data ? toArticle(data) : undefined;
};

// The articles that link fields can link to.
const listArticleSummaries = async (
  siteId: string,
): Promise<ArticleSummary[]> => {
  const {data, error} = await supabase
    .from('articles')
    .select('id, title, published')
    .eq('site_id', siteId)
    .order('title')
    .overrideTypes<ArticleSummary[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data;
};

const createArticle = async (siteId: string, input: ArticleInput) => {
  return setArticleLinks(
    await supabase
      .from('articles')
      .insert({...toRow(input), site_id: siteId})
      .select(ARTICLE_COLUMNS)
      .single<ArticleRow>(),
    input,
  );
};

const updateArticle = async (
  siteId: string,
  id: string,
  input: ArticleInput,
) => {
  return setArticleLinks(
    await supabase
      .from('articles')
      .update({...toRow(input), updated_at: new Date().toISOString()})
      .eq('site_id', siteId)
      .eq('id', id)
      .select(ARTICLE_COLUMNS)
      .single<ArticleRow>(),
    input,
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

const listTags = async (siteId: string): Promise<Tag[]> => {
  const {data, error} = await supabase
    .from('tags')
    .select(TAG_COLUMNS)
    .eq('site_id', siteId)
    .order('name')
    .overrideTypes<TagRow[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data.map(toTag);
};

const createTag = async (siteId: string, input: TagInput) => {
  return setTagParents(
    await supabase
      .from('tags')
      .insert({...toTagRow(input), site_id: siteId})
      .select(TAG_COLUMNS)
      .single<TagRow>(),
    input.parent_ids,
  );
};

const updateTag = async (siteId: string, id: string, input: TagInput) => {
  return setTagParents(
    await supabase
      .from('tags')
      .update({...toTagRow(input), updated_at: new Date().toISOString()})
      .eq('site_id', siteId)
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

const FIELD_DEFINITION_COLUMNS =
  'id, key, label, type, multiple, description, created_at, updated_at';

const listFieldDefinitions = async (
  siteId: string,
): Promise<FieldDefinition[]> => {
  const {data, error} = await supabase
    .from('field_definitions')
    .select(FIELD_DEFINITION_COLUMNS)
    .eq('site_id', siteId)
    .order('label')
    .overrideTypes<FieldDefinition[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data;
};

const createFieldDefinition = async (
  siteId: string,
  input: FieldDefinitionInput,
) => {
  return supabase
    .from('field_definitions')
    .insert({
      site_id: siteId,
      key: input.key,
      label: input.label,
      type: input.type,
      multiple: input.multiple,
      description: input.description,
    })
    .select(FIELD_DEFINITION_COLUMNS)
    .single<FieldDefinition>();
};

// The type can't be changed, so it's left out.
const updateFieldDefinition = async (
  siteId: string,
  id: string,
  input: Omit<FieldDefinitionInput, 'type'>,
) => {
  return supabase
    .from('field_definitions')
    .update({
      key: input.key,
      label: input.label,
      multiple: input.multiple,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', id)
    .select(FIELD_DEFINITION_COLUMNS)
    .single<FieldDefinition>();
};

// Moves the field definition, and its values, to the trash table, see
// db/007_fields.sql.
const deleteFieldDefinition = async (id: string) => {
  return supabase.rpc('trash_field_definition', {field_id: id});
};

const SITE_COLUMNS = 'id, name, url, api_secret, created_at, updated_at';

const listSites = async (): Promise<Site[]> => {
  const {data, error} = await supabase
    .from('sites')
    .select(SITE_COLUMNS)
    .order('name')
    .overrideTypes<Site[], {merge: false}>();

  if (error) {
    throw error;
  }

  return data;
};

const getSite = async (id: string): Promise<Site | undefined> => {
  const {data, error} = await supabase
    .from('sites')
    .select(SITE_COLUMNS)
    .eq('id', id)
    .maybeSingle<Site>();

  if (error) {
    throw error;
  }

  return data ?? undefined;
};

const toSiteRow = (input: SiteInput) => ({
  name: input.name,
  url: input.url,
  api_secret: input.api_secret,
});

const createSite = async (input: NewSiteInput) => {
  return supabase
    .from('sites')
    .insert({...toSiteRow(input), id: input.id})
    .select(SITE_COLUMNS)
    .single<Site>();
};

const updateSite = async (id: string, input: SiteInput) => {
  return supabase
    .from('sites')
    .update({...toSiteRow(input), updated_at: new Date().toISOString()})
    .eq('id', id)
    .select(SITE_COLUMNS)
    .single<Site>();
};

const ISSUE_COLUMN_COLUMNS = 'id, name, position, created_at, updated_at';

const ISSUE_COLUMNS =
  'id, number, column_id, position, title, text, created_at, updated_at';

const getBoard = async (siteId: string): Promise<Board> => {
  const [columns, issues] = await Promise.all([
    supabase
      .from('issue_columns')
      .select(ISSUE_COLUMN_COLUMNS)
      .eq('site_id', siteId)
      .order('position')
      .overrideTypes<IssueColumn[], {merge: false}>(),
    supabase
      .from('issues')
      .select(ISSUE_COLUMNS)
      .eq('site_id', siteId)
      .order('position')
      .overrideTypes<Issue[], {merge: false}>(),
  ]);

  if (columns.error) {
    throw columns.error;
  }
  if (issues.error) {
    throw issues.error;
  }

  return {columns: columns.data, issues: issues.data};
};

const getIssue = async (
  siteId: string,
  number: number,
): Promise<Issue | undefined> => {
  const {data, error} = await supabase
    .from('issues')
    .select(ISSUE_COLUMNS)
    .eq('site_id', siteId)
    .eq('number', number)
    .maybeSingle<Issue>();

  if (error) {
    throw error;
  }

  return data ?? undefined;
};

// Added last on the board, see db/006_issues.sql.
const createIssueColumn = async (siteId: string, name: string) => {
  return supabase
    .rpc('create_issue_column', {site_id: siteId, name})
    .single<IssueColumn>();
};

const renameIssueColumn = async (siteId: string, id: string, name: string) => {
  return supabase
    .from('issue_columns')
    .update({name, updated_at: new Date().toISOString()})
    .eq('site_id', siteId)
    .eq('id', id)
    .select(ISSUE_COLUMN_COLUMNS)
    .single<IssueColumn>();
};

// position is counted among the other columns.
const moveIssueColumn = async (id: string, position: number) => {
  return supabase.rpc('move_issue_column', {
    column_id: id,
    new_position: position,
  });
};

// Fails with foreign_key_violation (23503) if the column has issues.
const deleteIssueColumn = async (id: string) => {
  return supabase.rpc('delete_issue_column', {column_id: id});
};

// Added last in the column, with the site's next number. Fails with
// foreign_key_violation (23503) if the column isn't on the site's board.
const createIssue = async (
  siteId: string,
  columnId: string,
  input: IssueInput,
) => {
  return supabase
    .rpc('create_issue', {
      site_id: siteId,
      column_id: columnId,
      title: input.title,
      text: input.text,
    })
    .single<Issue>();
};

const updateIssue = async (siteId: string, id: string, input: IssueInput) => {
  return supabase
    .from('issues')
    .update({
      title: input.title,
      text: input.text,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', id)
    .select(ISSUE_COLUMNS)
    .single<Issue>();
};

// position is counted among the column's other issues. Fails with
// foreign_key_violation (23503) if the column isn't on the issue's site's
// board.
const moveIssue = async (id: string, columnId: string, position: number) => {
  return supabase.rpc('move_issue', {
    issue_id: id,
    column_id: columnId,
    new_position: position,
  });
};

// Moves the issue to the trash table, see db/006_issues.sql.
const deleteIssue = async (id: string) => {
  return supabase.rpc('trash_issue', {issue_id: id});
};

export const db = {
  listSites,
  getSite,
  createSite,
  updateSite,
  listArticles,
  getArticle,
  listArticleSummaries,
  createArticle,
  updateArticle,
  deleteArticle,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  listFieldDefinitions,
  createFieldDefinition,
  updateFieldDefinition,
  deleteFieldDefinition,
  getBoard,
  getIssue,
  createIssueColumn,
  renameIssueColumn,
  moveIssueColumn,
  deleteIssueColumn,
  createIssue,
  updateIssue,
  moveIssue,
  deleteIssue,
  uploadImage,
};
