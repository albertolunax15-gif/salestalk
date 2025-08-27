"use client"

import { useCallback, useEffect, useState } from "react"
import { saleService, Sale } from "@/services/saleService"
import { useAuth } from "@/contexts/AuthContext"

export function useSales(initialLimit = 50) {
  const { token, isLoading: authLoading, logout } = useAuth()
  const [limit, setLimit] = useState(initialLimit)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const fetchSales = useCallback(async () => {
    if (!token) {
      setSales([])
      setError("No hay token de autenticación. Inicia sesión.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const items = await saleService.getSales(token, limit)
      setSales(items)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Error al cargar ventas")
      if (String(e?.message).includes(" 401 ")) logout()
    } finally {
      setLoading(false)
    }
  }, [token, limit, logout])

  useEffect(() => {
    if (!authLoading) fetchSales()
  }, [authLoading, fetchSales])

  return { sales, loading, error, limit, setLimit, refetch: fetchSales }
}