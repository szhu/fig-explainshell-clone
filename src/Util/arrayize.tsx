export default function arrayize<T>(x: undefined | T | T[]): T[] {
  if (x == null) {
    return [];
  } else if (Array.isArray(x)) {
    return [...x];
  } else {
    return [x];
  }
}
