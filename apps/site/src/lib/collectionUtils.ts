const uniqueArrayOnProp = <T>(
  values: (T | undefined)[] | undefined,
  getProp: (value: T) => string | number,
): T[] => {
  const uniquePropValues = new Set<string | number>();
  const filteredItems: T[] = [];
  values?.forEach((obj) => {
    if (obj === undefined) {
      return;
    }
    const propValue = getProp(obj);
    if (uniquePropValues.has(propValue)) {
      return;
    }
    uniquePropValues.add(propValue);
    filteredItems.push(obj);
  });
  return filteredItems;
};

export const collectionUtils = {
  uniqueArrayOnProp,
};
