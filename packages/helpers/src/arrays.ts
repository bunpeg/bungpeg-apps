export const reorder = <T = any>(arr: T[], { from, to }: { from : number; to: number }): T[] => {
  if (arr.at(from) === undefined || arr.at(to) === undefined) {
    return arr;
  }

  if (from === to) {
    return arr;
  }

  const cloned = [...arr];
  const item = arr[from]!;
  cloned.splice(from, 1);
  cloned.splice(to, 0, item);
  return cloned;
};

export const append = <T = any>(arr: T[], ...items: T[]) => arr.concat(items);

export const prepend = <T = any>(arr: T[], ...items: T[]) => items.concat(arr);

export const insert = <T = any>(arr: T[], index: number, ...items: T[]) => arr.slice(0, index).concat(items, arr.slice(index));

export const apply = <T = any>(arr: T[], fn: (item: T, index?: number) => T) => arr.map((item, index) => fn(item, index));

export const remove = <T = any>(arr: T[], ...indices: number[]) => arr.filter((_, index) => !indices.includes(index))

export const applyWhere = <T = any>(
  arr: T[],
  condition: (item: T, index: number) => boolean,
  fn: (item: T, index: number) => T
) => arr.map((item, index) => (condition(item, index) ? fn(item, index) : item))

