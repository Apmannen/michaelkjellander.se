export type TriggerInput = {
  name: string;
  label: string;
  suggestions: readonly string[];
};

export type Trigger = {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  input?: TriggerInput;
};

export const CACHE_KEYS = ['articles'] as const;

export const triggers: Trigger[] = [
  {
    id: 'clear-site-cache',
    label: 'Rensa sajtcache',
    description: 'Tömmer sajtens cache för en nyckel så att ändringar syns direkt.',
    endpoint: '/api/cms/revalidate-cache-tag',
    input: { name: 'tag', label: 'Cache-nyckel', suggestions: CACHE_KEYS },
  },
];

export const getTrigger = (id: string) =>
  triggers.find((trigger) => trigger.id === id);
