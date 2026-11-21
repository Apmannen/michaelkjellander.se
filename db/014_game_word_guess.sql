-- The word guess game, see apps/cms/src/lib/word-guess.ts. A site has
-- questions, and levels that each have a sentence and any number of the
-- questions.
create table if not exists public.game_word_guess_questions (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  emoji text not null,
  -- E.g. 'Inte natt'.
  clue text not null,
  -- E.g. 'dag'.
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint game_word_guess_questions_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict
);

create index if not exists game_word_guess_questions_site_idx
  on public.game_word_guess_questions (site_id);

create table if not exists public.game_word_guess_levels (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  -- E.g. 'Morgonstund har guld i mund'.
  sentence text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint game_word_guess_levels_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict
);

create index if not exists game_word_guess_levels_site_idx
  on public.game_word_guess_levels (site_id);

-- A level's questions. position keeps the order they were picked in.
create table if not exists public.game_word_guess_level_questions (
  level_id uuid not null,
  question_id uuid not null,
  position int not null default 0,

  primary key (level_id, question_id),
  constraint game_word_guess_level_questions_level_id_fkey
    foreign key (level_id) references public.game_word_guess_levels (id)
      on delete cascade,
  constraint game_word_guess_level_questions_question_id_fkey
    foreign key (question_id) references public.game_word_guess_questions (id)
      on delete cascade
);

create index if not exists game_word_guess_level_questions_question_idx
  on public.game_word_guess_level_questions (question_id);

-- RLS on: the cms uses the service role key (bypasses RLS), the site uses the
-- anon key. Nothing here has a published state, so all of it is readable.
alter table public.game_word_guess_questions enable row level security;
alter table public.game_word_guess_levels enable row level security;
alter table public.game_word_guess_level_questions enable row level security;

drop policy if exists "Word guess questions are readable by everyone"
  on public.game_word_guess_questions;
create policy "Word guess questions are readable by everyone"
  on public.game_word_guess_questions for select
  to anon
  using (true);

drop policy if exists "Word guess levels are readable by everyone"
  on public.game_word_guess_levels;
create policy "Word guess levels are readable by everyone"
  on public.game_word_guess_levels for select
  to anon
  using (true);

drop policy if exists "Word guess level questions are readable by everyone"
  on public.game_word_guess_level_questions;
create policy "Word guess level questions are readable by everyone"
  on public.game_word_guess_level_questions for select
  to anon
  using (true);

-- Replaces a level's questions in one transaction, in the given order. Ids of
-- questions that don't exist, e.g. ones deleted meanwhile, or that belong to
-- another site are skipped. Returns the question ids that were set.
create or replace function public.set_game_word_guess_level_questions(
  level_id uuid,
  question_ids uuid[]
)
returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result uuid[];
begin
  delete from public.game_word_guess_level_questions
    where game_word_guess_level_questions.level_id =
      set_game_word_guess_level_questions.level_id;

  insert into public.game_word_guess_level_questions
    (level_id, question_id, position)
    select
      set_game_word_guess_level_questions.level_id,
      ids.question_id,
      min(ids.position)
    from unnest(question_ids) with ordinality as ids (question_id, position)
    join public.game_word_guess_questions questions
      on questions.id = ids.question_id
    join public.game_word_guess_levels levels
      on levels.id = set_game_word_guess_level_questions.level_id
        and levels.site_id = questions.site_id
    group by ids.question_id;

  select coalesce(
      array_agg(links.question_id order by links.position), '{}'
    )
    into result
    from public.game_word_guess_level_questions links
    where links.level_id = set_game_word_guess_level_questions.level_id;

  return result;
end;
$$;

revoke execute on function
  public.set_game_word_guess_level_questions(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function
  public.set_game_word_guess_level_questions(uuid, uuid[])
  to service_role;

-- Moves a question to the trash in one transaction, see db/002_trash.sql. Its
-- links to levels are deleted along with it, so they're kept in the trashed
-- data as level_ids, for a restore to put back. Returns false if there was no
-- question with that id.
create or replace function public.trash_game_word_guess_question(
  question_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trashed jsonb;
begin
  select to_jsonb(questions) || jsonb_build_object(
      'level_ids', coalesce((
        select jsonb_agg(links.level_id)
          from public.game_word_guess_level_questions links
          where links.question_id = questions.id
      ), '[]'::jsonb)
    )
    into trashed
    from public.game_word_guess_questions questions
    where questions.id = trash_game_word_guess_question.question_id;

  if trashed is null then
    return false;
  end if;

  delete from public.game_word_guess_questions
    where id = trash_game_word_guess_question.question_id;

  insert into public.trash (document_type, document_id, data)
    values (
      'game_word_guess_question',
      trash_game_word_guess_question.question_id,
      trashed
    );

  return true;
end;
$$;

revoke execute on function public.trash_game_word_guess_question(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_game_word_guess_question(uuid)
  to service_role;

-- Moves a level to the trash in one transaction, see db/002_trash.sql. Its
-- questions are kept in the trashed data as question_ids. Returns false if
-- there was no level with that id.
create or replace function public.trash_game_word_guess_level(level_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trashed jsonb;
begin
  select to_jsonb(levels) || jsonb_build_object(
      'question_ids', coalesce((
        select jsonb_agg(links.question_id order by links.position)
          from public.game_word_guess_level_questions links
          where links.level_id = levels.id
      ), '[]'::jsonb)
    )
    into trashed
    from public.game_word_guess_levels levels
    where levels.id = trash_game_word_guess_level.level_id;

  if trashed is null then
    return false;
  end if;

  delete from public.game_word_guess_levels
    where id = trash_game_word_guess_level.level_id;

  insert into public.trash (document_type, document_id, data)
    values (
      'game_word_guess_level',
      trash_game_word_guess_level.level_id,
      trashed
    );

  return true;
end;
$$;

revoke execute on function public.trash_game_word_guess_level(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_game_word_guess_level(uuid)
  to service_role;
