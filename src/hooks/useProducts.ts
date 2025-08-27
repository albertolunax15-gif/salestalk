"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { productService, type Product, type CreateProductDTO, type UpdateProductDTO } from "@/services/productService"
import { useAuth } from "@/contexts/AuthContext"

type BusyState = {
  list: boolean
  create: boolean
  updateId: string | null
  deleteId: string | null
  search: boolean
  toggleId: string | null
}

export function useProducts(initialLimit = 50) {
  const { token, isLoading: authLoading, logout } = useAuth()
  const [limit, setLimit] = useState(initialLimit)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string>("")

  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [busy, setBusy] = useState<BusyState>({
    list: false,
    create: false,
    updateId: null,
    deleteId: null,
    search: false,
    toggleId: null,
  })

  // para revertir optimismo si falla
  const snapshotRef = useRef<Product[] | null>(null)

  const withAuth = useCallback(
    async <T,>(fn: (t: string) => Promise<T>, context: string): Promise<T> => {
      if (!token) {
        const msg = "No hay token de autenticación. Inicia sesión."
        setError(msg)
        throw new Error(msg)
      }
      try {
        return await fn(token)
      } catch (e: any) {
        const msg = e?.message || `Error en ${context}`
        setError(msg)
        if (String(msg).includes(" 401 ")) logout()
        throw e
      }
    },
    [token, logout]
  )

  const fetchProducts = useCallback(async () => {
    setError("")
    setBusy((b) => ({ ...b, list: true }))
    try {
      const items = await withAuth((t) => productService.getProducts(t, limit), "GET /products")
      setProducts(items)
    } finally {
      setBusy((b) => ({ ...b, list: false }))
    }
  }, [withAuth, limit])

  useEffect(() => {
    if (!authLoading) fetchProducts()
  }, [authLoading, fetchProducts])

  // CREATE (optimista)
  const createProduct = useCallback(
    async (payload: CreateProductDTO) => {
      setError("")
      setBusy((b) => ({ ...b, create: true }))
      snapshotRef.current = products

      // Optimista: item temporal
      const tempId = `temp-${Date.now()}`
      const temp: Product = {
        id: tempId,
        name: payload.name,
        price: payload.price,
        status: payload.status ?? "active",
        created_at: new Date().toISOString(),
      }
      setProducts((prev) => [temp, ...prev])

      try {
        const created = await withAuth((t) => productService.createProduct(t, payload), "POST /products")
        // reemplaza el temporal por el real
        setProducts((prev) => [created, ...prev.filter((p) => p.id !== tempId)])
        return created
      } catch (e) {
        // revertir
        if (snapshotRef.current) setProducts(snapshotRef.current)
        throw e
      } finally {
        setBusy((b) => ({ ...b, create: false }))
      }
    },
    [products, withAuth]
  )

  // UPDATE (optimista)
  const updateProduct = useCallback(
    async (productId: string, payload: UpdateProductDTO) => {
      setError("")
      setBusy((b) => ({ ...b, updateId: productId }))
      snapshotRef.current = products

      // Optimista: patch local
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...payload } : p))
      )

      try {
        const updated = await withAuth(
          (t) => productService.updateProduct(t, productId, payload),
          `PUT /products/${productId}`
        )
        // sincroniza con lo que devuelve el backend
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)))
        return updated
      } catch (e) {
        if (snapshotRef.current) setProducts(snapshotRef.current)
        throw e
      } finally {
        setBusy((b) => ({ ...b, updateId: null }))
      }
    },
    [products, withAuth]
  )

  // DELETE (optimista)
  const deleteProduct = useCallback(
    async (productId: string) => {
      setError("")
      setBusy((b) => ({ ...b, deleteId: productId }))
      snapshotRef.current = products

      // Optimista: quitar local
      setProducts((prev) => prev.filter((p) => p.id !== productId))

      try {
        await withAuth((t) => productService.deleteProduct(t, productId), `DELETE /products/${productId}`)
        return true
      } catch (e) {
        if (snapshotRef.current) setProducts(snapshotRef.current)
        throw e
      } finally {
        setBusy((b) => ({ ...b, deleteId: null }))
      }
    },
    [products, withAuth]
  )

  // FIND BY NAME (no toca la lista principal; expone searchResults)
  const findByName = useCallback(
    async (name: string, limitSearch = 50) => {
      setError("")
      setBusy((b) => ({ ...b, search: true }))
      try {
        const results = await withAuth((t) => productService.findByName(t, name, limitSearch), "GET /products/search/by-name")
        setSearchResults(results)
        return results
      } finally {
        setBusy((b) => ({ ...b, search: false }))
      }
    },
    [withAuth]
  )

  // GET NAME BY ID
  const getNameById = useCallback(
    async (productId: string) => {
      setError("")
      const data = await withAuth((t) => productService.getNameById(t, productId), `GET /products/${productId}/name`)
      return data // { id, name }
    },
    [withAuth]
  )

  // Toggle status rápido (optimista)
  const toggleStatus = useCallback(
    async (product: Product) => {
      const productId = product.id
      setError("")
      setBusy((b) => ({ ...b, toggleId: productId }))
      snapshotRef.current = products

      const next = product.status === "active" ? ("inactive" as const) : ("active" as const)
      // Optimista
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: next } : p)))

      try {
        const updated = await withAuth((t) => productService.toggleStatus(t, product), `PUT /products/${productId}`)
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)))
        return updated
      } catch (e) {
        if (snapshotRef.current) setProducts(snapshotRef.current)
        throw e
      } finally {
        setBusy((b) => ({ ...b, toggleId: null }))
      }
    },
    [products, withAuth]
  )

  const loading = useMemo(
    () => busy.list || busy.create || !!busy.updateId || !!busy.deleteId || busy.search || !!busy.toggleId,
    [busy]
  )

  return {
    // data
    products,
    searchResults,

    // state
    loading,
    error,
    limit,

    // flags finos por acción (útiles para deshabilitar botones por fila)
    busy,

    // setters
    setLimit,
    setSearchResults,

    // queries
    refetch: fetchProducts,
    findByName,
    getNameById,

    // mutations
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
  }
}