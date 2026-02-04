export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type StripOptionalAndUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

export type NonEmptyArray<T> = [T, ...T[]]

/**
 *
 * type which allows you to to the following
 *
 * ```typescript
 * type A = {
 *   p: string
 *   a: string
 * }
 *
 * type B = {
 *   p: string
 *   b: string
 * }
 *
 * type C = A | B
 *
 * type D = DistributedOmit<C, 'p'>
 * ```
 *
 * Where `type D` is now correctly: `{a: string} | {b: string}`
 *
 */
export type DistributedOmit<T, K extends keyof T> = T extends Record<string, unknown> ? Omit<T, K> : never
