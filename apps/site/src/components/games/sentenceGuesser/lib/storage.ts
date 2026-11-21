const KEY = 'sggdata_v1';

type SavedGameData = { level: number; isDone: boolean; letters: string[] };

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
      if (
        typeof jsonObj.isDone === 'boolean' &&
        jsonObj.letters.length &&
        typeof jsonObj.level === 'number'
      ) {
        savedDatas.push(jsonObj);
      }
    });
    return savedDatas;
  } catch {
    return [];
  }
};

export const gameStorage = {
  get,
  save,
};
