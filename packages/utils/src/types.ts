export type NonEmptyArray<T> = [T, ...T[]]

export const excludeUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null
