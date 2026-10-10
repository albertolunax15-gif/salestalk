"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import type { CreateProductDTO, Product } from "@/services/productService"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si viene un producto, el diálogo está en modo edición */
  product?: Product | null
  onSubmit: (payload: Required<CreateProductDTO>) => Promise<void>
}

type Errors = Partial<Record<"name" | "price", string>>

export function ProductFormDialog({ open, onOpenChange, product, onSubmit }: Props) {
  const isEdit = Boolean(product)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? "")
    setPrice(product ? String(product.price ?? "") : "")
    setStatus(product?.status === "inactive" ? "inactive" : "active")
    setErrors({})
  }, [open, product])

  const validate = (): Errors => {
    const e: Errors = {}
    if (!name.trim()) e.name = "Ingresa el nombre del producto."
    const n = Number(price)
    if (price.trim() === "") e.price = "Ingresa el precio."
    else if (Number.isNaN(n) || n < 0) e.price = "El precio debe ser un número mayor o igual a 0."
    return e
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), price: Number(price), status })
      onOpenChange(false)
    } catch {
      // El llamador muestra el error (toast); mantenemos el formulario abierto
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos del producto." : "Agrega un producto a tu catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej.: Coca Cola 500 ml"
              autoComplete="off"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "product-name-error" : undefined}
            />
            {errors.name && (
              <p id="product-name-error" className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  S/
                </span>
                <Input
                  id="product-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-9 tabular-nums"
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? "product-price-error" : undefined}
                />
              </div>
              {errors.price && (
                <p id="product-price-error" className="text-xs text-destructive">
                  {errors.price}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-status">Estado</Label>
              <Select
                id="product-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
