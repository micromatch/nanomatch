export declare interface MatchOptions {
  basename?: boolean;
  bash?: boolean;
  cache?: boolean;
  dot?: boolean;
  failglob?: boolean;
  ignore?: string | string[];
  matchBase?: boolean;
  nocase?: boolean;
  nodupes?: boolean;
  nonegate?: boolean;
  noglobstar?: boolean;
  nonull?: boolean;
  nullglob?: boolean;
  slash?: string | (() => string);
  star?: string | (() => string);
  snapdragon?: object;
  sourcemap?: boolean;
  unescape?: boolean;
  unixify?: boolean;
}

/**
 * The main function takes a list of strings and one or more
 * glob patterns to use for matching.
 */
declare function nanomatch(
  list: string[],
  patterns: string | string[],
  options?: MatchOptions
): string[];
declare namespace nanomatch {
  /**
   * Similar to the main function, but `pattern` must be a string.
   */
  export function match(
    list: string[],
    pattern: string,
    options?: MatchOptions
  ): string[];
  /**
   * Returns true if the specified `string` matches the given glob `pattern`.
   */
  export function isMatch(
    str: string,
    pattern: string,
    options?: MatchOptions
  ): boolean;
  /**
   * Returns true if some of the elements in the given `list` match any of the
   * given glob `patterns`.
   */
  export function some(
    list: string | string[],
    patterns: string | string[],
    options?: MatchOptions
  ): boolean;
  /**
   * Returns true if every element in the given `list` matches
   * at least one of the given glob `patterns`.
   */
  export function every(
    list: string | string[],
    patterns: string | string[],
    options?: MatchOptions
  ): boolean;
  /**
   * Returns true if **any** of the given glob `patterns`
   * match the specified `string`.
   */
  export function any(
    str: string | string[],
    patterns: string | string[],
    options?: MatchOptions
  ): boolean;
  /**
   * Returns true if **all** of the given `patterns`
   * match the specified string.
   */
  export function all(
    str: string | string[],
    patterns: string | string[],
    options?: MatchOptions
  ): boolean;
  /**
   * Returns a list of strings that _**do not match any**_ of the given `patterns`.
   */
  export function not(
    list: string[],
    patterns: string | string[],
    options?: MatchOptions
  ): string[];
  /**
   * Returns true if the given `string` contains the given pattern. Similar
   * to [.isMatch](#isMatch) but the pattern can match any part of the string.
   */
  export function contains(
    str: string,
    patterns: string | string[],
    options?: MatchOptions
  ): boolean;
  /**
   * Filter the keys of the given object with the given `glob` pattern
   * and `options`. Does not attempt to match nested keys. If you need this feature,
   * use [glob-object][] instead.
   */
  export function matchKeys<
    T extends Record<string, unknown> = Record<string, unknown>
  >(obj: T, patterns: string | string[], options?: MatchOptions): Partial<T>;
  /**
   * Returns a memoized matcher function from the given glob `pattern` and `options`.
   * The returned function takes a string to match as its only argument and returns
   * true if the string is a match.
   */
  export function matcher(
    pattern: string,
    options?: MatchOptions
  ): (str: string) => boolean;
  /**
   * Returns an array of matches captured by `pattern` in `string, or
   * `null` if the pattern did not match.
   */
  export function capture(
    pattern: string,
    str: string,
    options?: MatchOptions
  ): string[] | null;
  /**
   * Create a regular expression from the given glob `pattern`.
   */
  export function makeRe(pattern: string, options?: MatchOptions): RegExp;
  /**
   * Parses the given glob `pattern` and returns an object with the compiled `output`
   * and optional source `map`.
   */
  export function create(pattern: string, options?: MatchOptions): any;
  /**
   * Parse the given `str` with the given `options`.
   */
  export function parse(pattern: string, options?: MatchOptions): any;
  /**
   * Compile the given `ast` or string with the given `options`.
   */
  export function compile(ast: any, options?: MatchOptions): any;
  /**
   * Clear the regex cache.
   */
  export function clearCache(): void;
}

export = nanomatch;
