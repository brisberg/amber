/** Utility package for hasing string contents */

/**
 * Fast has function to convert a string to a hash number for cache checking.
 *
 * Source: https://stackoverflow.com/a/7616484
 */
export function hashCode(input: string) {
  let hash = 0;
  if (input.length === 0) {
    return hash;
  }
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    // tslint:disable-next-line: no-bitwise
    hash = ((hash << 5) - hash) + chr;
    // tslint:disable-next-line: no-bitwise
    hash |= 0;  // Convert to 32bit integer
  }
  return hash;
}
