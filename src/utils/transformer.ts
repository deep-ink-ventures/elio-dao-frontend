export type CamelCase<S extends string> = S extends `${infer A}_${infer B}`
  ? `${Lowercase<A>}${Capitalize<CamelCase<B>>}`
  : Lowercase<S>;

export type CamelCaseObject<T extends Record<string, any>> = {
  // @ts-ignore
  [K in keyof T as CamelCase<K>]: T[K] extends any[]
    ? CamelCaseObject<T[K][number]>[]
    : T[K] extends Date
    ? T[K]
    : T[K] extends Record<any, any>
    ? CamelCaseObject<T[K]>
    : T[K];
};

export const keysToCamelCase = <T extends Record<any, any>>(
  input: T
): CamelCaseObject<T> =>
  Object.entries(input).reduce((acc, [key, value]) => {
    const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    return {
      ...acc,
      [camelCaseKey]: value,
    };
  }, {} as CamelCaseObject<T>);

export type SnakeCase<S extends string> = S extends `${infer A}${infer B}`
  ? `${A extends Capitalize<A> ? '_' : ''}${Lowercase<A>}${SnakeCase<B>}`
  : S;

export type SnakeCaseObject<T extends Record<string, any>> = {
  // @ts-ignore
  [K in keyof T as SnakeCase<K>]: T[K] extends any[]
    ? SnakeCaseObject<T[K][number]>[]
    : T[K] extends Date
    ? T[K]
    : T[K] extends Record<any, any>
    ? SnakeCaseObject<T[K]>
    : T[K];
};

export const keysToSnakeCase = <T extends Record<string, any>>(
  input: T
): SnakeCaseObject<T> =>
  Object.entries(input).reduce((acc, [key, value]) => {
    const snakeCaseKey = key
      .replace(/([a-z])([A-Z])/g, (_, lower, upper) => `${lower}_${upper}`)
      .toLowerCase();

    return {
      ...acc,
      [snakeCaseKey as keyof SnakeCaseObject<T>]: value,
    };
  }, {} as Partial<SnakeCaseObject<T>>) as unknown as SnakeCaseObject<T>;

export const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
