-- The number of a word guess level, e.g. 3 for the site's third level, see
-- apps/cms/src/lib/word-guess.ts. Set in the cms and unique within a site.
-- Existing levels are numbered in the order they were created.
-- trash_game_word_guess_level keeps it in the trashed data through
-- to_jsonb(levels).
alter table public.game_word_guess_levels
  add column if not exists number int;

update public.game_word_guess_levels levels
  set number = numbered.number
  from (
    select
      id,
      row_number() over (partition by site_id order by created_at, id) as number
    from public.game_word_guess_levels
  ) numbered
  where levels.id = numbered.id
    and levels.number is null;

alter table public.game_word_guess_levels
  alter column number set not null;

alter table public.game_word_guess_levels
  drop constraint if exists game_word_guess_levels_number_positive;

alter table public.game_word_guess_levels
  add constraint game_word_guess_levels_number_positive
    check (number >= 1);

alter table public.game_word_guess_levels
  drop constraint if exists game_word_guess_levels_site_id_number_key;

alter table public.game_word_guess_levels
  add constraint game_word_guess_levels_site_id_number_key
    unique (site_id, number);
