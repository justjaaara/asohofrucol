'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const links = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/verificaciones', label: 'Verificaciones' },
  { href: '/maraton', label: 'Maratón' },
  { href: '/profesionales', label: 'Profesionales', userLabel: 'Mi perfil' },
  { href: '/parametricas', label: 'Paramétricas' },
]

function initials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Nav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin = session?.user?.rol === 'ADMINISTRADOR'

  return (
    <nav className="bg-forest-950 text-cream-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-medium tracking-tight">ASOHOFRUCOL</span>
          <span className="hidden text-[11px] uppercase tracking-wide text-forest-100/50 sm:inline">Verificaciones</span>
        </Link>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links
            .filter((l) => isAdmin || l.href !== '/parametricas')
            .map((l) => {
              const active = pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? 'text-gold-400' : 'text-forest-100/70 hover:text-cream-50'
                  }`}
                >
                  {l.userLabel ? (isAdmin ? l.label : l.userLabel) : l.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-3.25 h-0.5 rounded-full bg-gold-400" />
                  )}
                </Link>
              )
            })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-700 text-[11px] font-semibold">
              {initials(session?.user?.name)}
            </span>
            <span className="text-xs text-forest-100/70">{session?.user?.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-md border border-forest-100/20 px-3 py-1.5 text-xs font-medium text-forest-100/80 transition-colors hover:border-terracotta-500/60 hover:text-terracotta-400"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
