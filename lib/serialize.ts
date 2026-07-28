import { Decimal } from '@prisma/client/runtime/client'

/**
 * Mirrors what `serialize` actually does to a value at runtime: `bigint`,
 * `Decimal` and `Date` all come out the other side of `JSON.stringify` as
 * plain strings. Keeping this in sync with the implementation below means
 * callers get the real shape back instead of casting with `as unknown as`.
 */
export type Serialized<T> = T extends bigint
  ? string
  : T extends Decimal
    ? string
    : T extends Date
      ? string
      : T extends (infer U)[]
        ? Serialized<U>[]
        : T extends object
          ? { [K in keyof T]: Serialized<T[K]> }
          : T

export function serialize<T>(data: T): Serialized<T> {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === 'bigint') return value.toString()
      if (value instanceof Decimal) return value.toString()
      return value
    })
  )
}
