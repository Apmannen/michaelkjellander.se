import { SLUG_PATTERN } from '@/lib/slug';

export type Site = {
  // Picked when the site is created, e.g. 'mk'. Can't be changed afterwards.
  id: string;
  name: string;
  // Where the site runs, e.g. 'https://example.com'. Empty until set.
  url: string;
  // Sent as a bearer token when running triggers. Empty until set.
  api_secret: string;
  created_at: string;
  updated_at: string;
};

export type SiteInput = Pick<Site, 'name' | 'url' | 'api_secret'>;

// The id is only given when creating a site.
export type NewSiteInput = SiteInput & Pick<Site, 'id'>;

// Remembers the last picked site, so the cms's start page can go straight to
// it.
export const SITE_COOKIE = 'cms-site';

// Taken by the cms's own routes, which are siblings of the sites' routes.
const RESERVED_SITE_IDS = new Set(['sites']);

// Undefined if the id is valid. Same format as slugs.
export const validateSiteId = (id: string): string | undefined => {
  if (!id) {
    return 'ID måste anges.';
  }
  if (!SLUG_PATTERN.test(id)) {
    return 'ID får bara innehålla a–z, 0–9 och bindestreck.';
  }
  if (RESERVED_SITE_IDS.has(id)) {
    return `ID:t ”${id}” är upptaget av CMS:et.`;
  }
  return undefined;
};

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateSite = (input: SiteInput): string | undefined => {
  if (!input.name.trim()) {
    return 'Namn måste anges.';
  }
  if (input.url && !isValidUrl(input.url)) {
    return 'Adressen måste börja med http:// eller https://.';
  }
  return undefined;
};

// The sections of a site in the cms, shown on its start page.
export const SITE_SECTIONS = [
  {
    path: 'articles',
    title: 'Artiklar',
    description: 'Skapa och redigera artiklar.',
  },
  {
    path: 'tags',
    title: 'Taggar',
    description: 'Skapa och redigera taggar som artiklar kan kopplas till.',
  },
  {
    path: 'triggers',
    title: 'Triggers',
    description: 'Kör åtgärder på sajten, t.ex. rensa cache.',
  },
  {
    path: 'settings',
    title: 'Sajtinställningar',
    description: 'Namn, adress och API-nyckel för sajten.',
  },
] as const;
