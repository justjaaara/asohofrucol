'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Está seguro de eliminar este registro?')) return

    setLoading(true)
    const res = await fetch(`/api/maraton/${id}`, { method: 'DELETE' })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(data.error || 'Error al eliminar')
      return
    }

    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm font-medium text-danger-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
