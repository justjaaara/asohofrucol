'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta verificación?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/verificaciones/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Error al eliminar')
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="font-medium text-danger-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
