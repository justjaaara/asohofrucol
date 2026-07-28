import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Carga `.env` solo si existe. En local siempre está presente, pero en
 * plataformas como Vercel las variables se inyectan directo a `process.env`
 * y no hay archivo físico — `process.loadEnvFile` lanza ENOENT en ese caso.
 */
export function loadEnvIfPresent() {
  const envPath = resolve('.env')
  if (existsSync(envPath)) {
    process.loadEnvFile?.(envPath)
  }
}
