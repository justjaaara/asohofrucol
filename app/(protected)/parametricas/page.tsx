import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { ParametricasManager } from './ParametricasManager'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function ParametricasPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!esAdmin(user.rol)) redirect('/dashboard')

  const parametricas = await prisma.parametrica.findMany({
    orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
  })

  const grouped: Record<string, typeof parametricas> = {}
  for (const parametrica of parametricas) {
    if (!grouped[parametrica.tipo]) grouped[parametrica.tipo] = []
    grouped[parametrica.tipo].push(parametrica)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Paramétricas" description="Listas desplegables usadas en los formularios del sistema" />
      <ParametricasManager grouped={grouped} />
    </div>
  )
}
