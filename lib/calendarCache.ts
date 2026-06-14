const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 5 * 60 * 1000;

export function getCached<T = unknown>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function deleteCached(key: string): void {
  cache.delete(key);
}
