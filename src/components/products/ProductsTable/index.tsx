"use client"

import { useMemo, useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import type { Product } from "@/services/productService"
import { TableRow } from "./TableRow"
import { TableSkeleton } from "./TableSkeleton"
import { TableError } from "./TableError"
import { TableEmpty } from "./TableEmpty"
import { ProductsActionsBar } from "../ProductsActionsBar"
import { CreateProductModal } from "../modals/CreateProductModal"
import { EditProductModal } from "../modals/EditProductModal"
import { DeleteProductModal } from "../modals/DeleteProductModal"

interface ProductsTableProps {
  maxItems?: number
}

export const ProductsTable = ({ maxItems = 50 }: ProductsTableProps) => {
  const {
    products,
    loading,
    error,
    refetch,
    busy,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
  } = useProducts(maxItems)

  const [query, setQuery] = useState("")
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p: Product) =>
      [p.id, p.name, p.status].some((v) => String(v ?? "").toLowerCase().includes(q))
    )
  }, [products, query])

  const handleEdit = (p: Product) => {
    setSelected(p)
    setOpenEdit(true)
  }

  const handleDelete = (p: Product) => {
    setSelected(p)
    setOpenDelete(true)
  }

  const handleToggle = async (p: Product) => {
    await toggleStatus(p)
  }

  return (
    <div className="rounded-lg border bg-white p-4 md:p-6">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o estado…"
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring focus:ring-blue-200"
        />
        <ProductsActionsBar
          onCreateClick={() => setOpenCreate(true)}
          onRefreshClick={refetch}
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <TableError error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <TableEmpty />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-50">
                {/* ⬇️ Columna ID eliminada */}
                <th className="px-3 py-2 font-semibold">Nombre</th>
                <th className="px-3 py-2 font-semibold">Precio</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Creado</th>
                <th className="px-3 py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <TableRow
                  key={String(p.id)}
                  product={p}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  busy={busy}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={async (payload) => {
          await createProduct(payload)
          setOpenCreate(false)
        }}
      />

      <EditProductModal
        open={openEdit}
        product={selected}
        onClose={() => setOpenEdit(false)}
        onUpdate={async (id, payload) => {
          await updateProduct(id, payload)
          setOpenEdit(false)
        }}
      />

      <DeleteProductModal
        open={openDelete}
        productName={selected?.name ?? ""}
        onClose={() => setOpenDelete(false)}
        busy={busy.deleteId === selected?.id}
        onConfirm={async () => {
          if (!selected) return
          await deleteProduct(selected.id)
          setOpenDelete(false)
        }}
      />
    </div>
  )
}