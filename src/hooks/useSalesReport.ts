"use client"

import { useCallback, useEffect, useState } from "react"
import { saleService } from "@/services/saleService"
import { useAuth } from "@/contexts/AuthContext"

export type SalesReportBucket = {
  key: string
  count: number
  total: number
}

export type SalesReport = {
  group_by: string
  total_sales: number
  total_revenue: number
  avg_ticket: number
  buckets: SalesReportBucket[]
}

export function useSalesReport() {
  const { token, isLoading: authLoading, logout } = useAuth()
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = (await saleService.getSalesReport(token)) as SalesReport
      setReport({ ...data, buckets: Array.isArray(data?.buckets) ? data.buckets : [] })
    } catch (e: unknown) {
      const msg = (e instanceof Error && e.message) || "Error al cargar el reporte"
      setError(msg)
      if (String(msg).includes(" 401 ")) logout()
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  useEffect(() => {
    if (!authLoading) void fetchReport()
  }, [authLoading, fetchReport])

  return { report, loading, error, refetch: fetchReport }
}
