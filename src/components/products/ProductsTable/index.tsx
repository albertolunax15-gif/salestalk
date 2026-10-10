"use client"

import { useMemo, useState } from "react"
import { Package, Plus, RotateCw, Search, SearchX } from "lucide-react"

import { useProducts } from "@/hooks/useProducts"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/services/productService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableHead, TableHeader, TableRow as Row } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState, ErrorState, TableSkeletonRows, friendlyError } from "@/components/shared/StateViews"
import { TableRow } from "./TableRow"
import { ProductFormDialog } from "../modals/ProductFormDialog"

interface ProductsTableProps {
  maxItems?: number
}

type StatusFilter = "all" | "active" | "inactive"

export const ProductsTable = ({ maxItems = 50 }: ProductsTableProps) => {
  const { products, error, refetch, busy, createProduct, updateProduct, toggleStatus } = useProducts(maxItems)
  const { toast } = useToast()

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p: Product) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (!q) return true
      return String(p.name ?? "").toLowerCase().includes(q)
    })
  }, [products, query, statusFilter])

  const activeCount = useMemo(() => products.filter((p) => p.status === "active").length, [products])
  const hasFilters = query.trim() !== "" || statusFilter !== "all"
  const initialLoading = busy.list && products.length === 0

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setFormOpen(true)
  }

  const notifyError = (title: string, e: unknown) =>
    toast({ variant: "destructive", title, description: friendlyError(String((e as Error)?.message ?? e)) })

  const handleSubmit = async (payload: { name: string; price: number; status: "active" | "inactive" }) => {
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
        toast({ variant: "success", title: "Producto actualizado", description: payload.name })
      } else {
        await createProduct(payload)
        toast({ variant: "success", title: "Producto creado", description: payload.name })
      }
    } catch (e) {
      notifyError(editing ? "No se pudo actualizar el producto" : "No se pudo crear el producto", e)
      throw e
    }
  }

  const handleToggle = async (p: Product) => {
    try {
      const updated = await toggleStatus(p)
      toast({
        variant: "success",
        title: updated?.status === "active" ? "Producto activado" : "Producto desactivado",
        description: p.name,
      })
    } catch (e) {
      notifyError("No se pudo cambiar el estado", e)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description={
          initialLoading
            ? "Cargando catálogo…"
            : `${products.length} productos · ${activeCount} activos`
        }
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Nuevo producto
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {/* Barra de herramientas */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto…"
              aria-label="Buscar producto por nombre"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-40">
              <Select
                aria-label="Filtrar por estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={busy.list}
              aria-label="Actualizar listado"
              title="Actualizar"
            >
              <RotateCw className={busy.list ? "animate-spin" : undefined} />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        {initialLoading ? (
          <TableSkeletonRows cols={5} />
        ) : error && products.length === 0 ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Todavía no tienes productos"
            description="Crea tu primer producto para empezar a registrar ventas."
            action={
              <Button onClick={openCreate}>
                <Plus />
                Nuevo producto
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Sin coincidencias"
            description="Ningún producto coincide con los filtros aplicados."
            action={
              hasFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("")
                    setStatusFilter("all")
                  }}
                >
                  Limpiar filtros
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <Row className="hover:bg-transparent">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </Row>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={String(p.id)} product={p} onEdit={openEdit} onToggle={handleToggle} busy={busy} />
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              Mostrando {filtered.length} de {products.length} productos
            </div>
          </>
        )}
      </div>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} onSubmit={handleSubmit} />
    </div>
  )
}
