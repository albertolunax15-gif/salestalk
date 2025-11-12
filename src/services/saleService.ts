const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apisalestalk.onrender.com"

import { productService } from "./productService"

export type Sale = {
  id: string
  date: string
  quantity: number
  product_id: string
  product_name?: string   // ← añadido
  payment_method: string
  created_at: string
  [key: string]: any
}

export const saleService = {
  async getSales(token: string, limit = 50): Promise<Sale[]> {
    const url = `${API_BASE_URL}/sales?limit=${limit}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`GET /sales ${res.status} ${res.statusText} ${text}`)
    }

    const data = await res.json()
    let sales: Sale[] = []
    if (Array.isArray(data)) sales = data
    else if (Array.isArray((data as any)?.items)) sales = (data as any).items

    // enriquecer con product_name en paralelo
    const enriched = await Promise.all(
      sales.map(async (s) => {
        try {
          const { name } = await productService.getNameById(token, s.product_id)
          return { ...s, product_name: name }
        } catch {
          return { ...s, product_name: s.product_id } // fallback
        }
      })
    )
    return enriched
  },

  async getSalesReport(token: string) {
    const url = `${API_BASE_URL}/sales/report`

    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`GET /sales/report ${res.status} ${res.statusText} ${text}`)
    }

    return res.json()
  },

  async deleteSale(token: string, id: string): Promise<void> {
    const url = `${API_BASE_URL}/sales/${encodeURIComponent(id)}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 204) return

    // construimos un mensaje útil
    let msg = `DELETE /sales/${id} ${res.status} ${res.statusText}`
    try {
      const json = await res.json()
      if (json?.detail) msg = json.detail
    } catch {
      // ignore json parse
    }

    if (res.status === 404) throw new Error("La venta no existe")
    throw new Error(msg)
  }
}