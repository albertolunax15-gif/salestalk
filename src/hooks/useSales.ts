"use client"

import { useCallback, useEffect, useState } from "react"
import { saleService, type Sale } from "@/services/saleService"
import { useAuth } from "@/contexts/AuthContext"

export function useSales(initialLimit = 50) {
  const { token, isLoading: authLoading, logout } = useAuth()

  const [limit, setLimit] = useState(initialLimit)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = useCallback(async () => {
    if (!token) {
      setSales([])
      setError("No hay token de autenticación. Inicia sesión.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const items = await saleService.getSales(token, limit)
      setSales(items)
    } catch (e: any) {
      console.error(e)
      const msg = e?.message || "Error al cargar ventas"
      setError(msg)
      // Si el backend devolvió 401, suele venir en el mensaje
      if (String(msg).includes(" 401 ")) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }, [token, limit, logout])

  useEffect(() => {
    if (!authLoading) {
      void fetchSales()
    }
  }, [authLoading, fetchSales])

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const remove = useCallback(
    async (id: string) => {
      if (!token) throw new Error("No autenticado")

      setDeletingId(id)
      const prev = [...sales] // snapshot para rollback

      // Optimistic UI: removemos la fila al instante
      setSales((s) => s.filter((row) => String(row.id) !== String(id)))

      try {
        await saleService.deleteSale(token, id)
      } catch (err: any) {
        // rollback si falla
        setSales(prev)
        const msg = err?.message || "No se pudo eliminar la venta"
        // si es 401 en delete, forzamos logout
        if (String(msg).includes("401")) logout()
        throw err
      } finally {
        setDeletingId(null)
      }
    },
    [sales, token, logout]
  )

  return {
    sales,
    loading,
    error,
    limit,
    setLimit,
    refetch: fetchSales,
    deletingId,
    remove,
  }
}