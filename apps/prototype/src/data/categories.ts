import { Category, CategoryId } from './types';

export const categories: Record<CategoryId, Category> = {
  spelutveckling: {
    id: 'spelutveckling',
    name: 'Spelutveckling',
    description: 'Spel jag har gjort, och hur de kom till.',
  },
  recensioner: {
    id: 'recensioner',
    name: 'Recensioner',
    description: 'Spel jag har spelat och vad jag tyckte om dem.',
  },
  tankar: {
    id: 'tankar',
    name: 'Tankar',
    description: 'Lösa funderingar om spel och skapande.',
  },
};

export const categoryList = Object.values(categories);

export const isCategoryId = (value: string): value is CategoryId => {
  return value in categories;
};
