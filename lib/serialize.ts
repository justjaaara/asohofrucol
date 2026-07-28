import { Decimal } from '@prisma/client/runtime/client'

export function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === 'bigint') return value.toString()
      if (value instanceof Decimal) return value.toString()
      return value
    })
  )
}
