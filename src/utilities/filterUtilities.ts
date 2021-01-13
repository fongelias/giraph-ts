// Type Guard for filters: https://github.com/microsoft/TypeScript/issues/20707
export function notNull<T>(x: T | null): x is T {
  return x !== null;
}
