type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** PostgREST caps each response (1000 rows by default); this pages through `.range()` until everything is read. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAll<T = any>(page: (from: number, to: number) => Page<T>, size = 1000, maxPages = 30) {
  const out: T[] = [];
  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await page(i * size, i * size + size - 1);
    if (error) return { data: null as T[] | null, error };
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return { data: out as T[] | null, error: null as { message: string } | null };
}
