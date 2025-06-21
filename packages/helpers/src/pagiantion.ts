export const ITEMS_PER_PAGE_LIMIT = 5;

export function calculateTotal(count: number, pageSize: number) {
  if (count % pageSize !== 0) {
    return Math.floor((count / pageSize) + 1);
  }
  return Math.floor(count / pageSize);
}
