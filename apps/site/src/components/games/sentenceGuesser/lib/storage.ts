const KEY = 'sggdata_v1';

export type SavedGameData = {
  level: number;
  isDone: boolean;
  letters: string[];
  mistakes: number;
};

const save = (levelData: SavedGameData) => {
  const datas = get().filter((obj) => obj.level !== levelData.level);
  datas.push(levelData);
  localStorage.setItem(KEY, JSON.stringify(datas));
};

const get = (): SavedGameData[] => {
  try {
    const str = localStorage.getItem(KEY);
    const json: SavedGameData[] = str ? JSON.parse(str) : [];
    const savedDatas: SavedGameData[] = [];

    json.forEach((jsonObj) => {
      if (typeof jsonObj.level !== 'number' || !jsonObj.level) {
        return;
      }
      const parsedData: SavedGameData = {
        isDone: jsonObj.isDone === true,
        letters: jsonObj.letters
          .map((l) => (typeof l === 'string' ? l : undefined))
          .filter((l) => l !== undefined),
        level: jsonObj.level,
        mistakes:
          typeof jsonObj.mistakes === 'number' ? jsonObj.mistakes || 0 : 0,
      };
      savedDatas.push(parsedData);
    });
    return savedDatas;
  } catch {
    return [];
  }
};

const clear = () => {
  localStorage.removeItem(KEY);
};

export const gameStorage = {
  get,
  save,
  clear,
};
