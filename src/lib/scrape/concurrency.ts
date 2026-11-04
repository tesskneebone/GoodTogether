/**
 * Runs `fn` over `items` with at most `limit` in flight at once, instead
 * of either fully sequential (await in a for-loop, slow) or fully
 * parallel (Promise.all, which can hammer a source or a rate-limited API
 * like Unsplash's all at once).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
