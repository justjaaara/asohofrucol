import { defineConfig } from '@prisma/config'
import { resolve } from 'node:path'

process.loadEnvFile?.(resolve('.env'))

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
})
