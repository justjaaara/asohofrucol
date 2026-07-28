'use client'

import { useRouter } from 'next/navigation'

export function ProfesionalDeleteButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Desea desactivar este profesional?')) return

    const res = await fetch(`/api/profesionales/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(data.error || 'Error al desactivar el profesional')
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm font-medium text-danger-600 hover:underline"
    >
      Desactivar
    </button>
  )
}
