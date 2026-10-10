export function safeJsonParse<T = any>(value: any, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string') {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
