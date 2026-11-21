import { buildPuzzle, type PuzzleDefinition } from './puzzle';

const definitions: PuzzleDefinition[] = [
  {
    id: 'morgonstund',
    quote: 'Morgonstund har guld i mund',
    clues: [
      { emoji: '☀️', clue: 'Inte natt', answer: 'DAG' },
      { emoji: '🐘', clue: 'Inte liten', answer: 'STOR' },
      { emoji: '👴', clue: 'Inte ung', answer: 'GAMMAL' },
      { emoji: '🧠', clue: 'Inte dum', answer: 'SMART' },
    ],
    revealed: ['M', 'O', 'R'],
  },
  {
    id: 'applet',
    quote: 'Äpplet faller inte långt från trädet',
    clues: [
      { emoji: '🦒', clue: 'Inte kort', answer: 'LÅNG' },
      { emoji: '🪙', clue: 'Inte rik', answer: 'FATTIG' },
      { emoji: '🌸', clue: 'Inte ful', answer: 'FIN' },
      { emoji: '👎', clue: 'Inte bra', answer: 'DÅLIG' },
    ],
    revealed: ['T', 'E'],
  },
  {
    id: 'den-som-vantar',
    quote: 'Den som väntar på något gott väntar aldrig för länge',
    clues: [
      { emoji: '🏜️', clue: 'Inte våt', answer: 'TORR' },
      { emoji: '🔓', clue: 'Inte stängd', answer: 'ÖPPEN' },
      { emoji: '🪶', clue: 'Inte tung', answer: 'LÄTT' },
      { emoji: '🐓', clue: 'Inte sen', answer: 'TIDIG' },
    ],
    revealed: ['N', 'A'],
  },
];

export const puzzles = definitions.map(buildPuzzle);
