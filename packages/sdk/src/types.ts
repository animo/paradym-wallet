export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type StripOptionalAndUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}
