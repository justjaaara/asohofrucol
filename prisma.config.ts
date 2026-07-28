import { defineConfig } from '@prisma/config'
import { loadEnvIfPresent } from './lib/loadEnv'

loadEnvIfPresent()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
})
