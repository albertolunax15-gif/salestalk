"use client"

import { useState } from "react"
import type { CreateProductDTO } from "@/services/productService"
import { BaseModal } from "./BaseModal"

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateProductDTO) => Promise<void>
}

export function CreateProductModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [submitting, setSubmitting] = useState(false)
  const disabled = submitting || !name || price === "" || Number(price) < 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    setSubmitting(true)
    try {
      await onCreate({ name: name.trim(), price: Number(price), status })
      setName("")
      setPrice("")
      setStatus("active")
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BaseModal open={open} title="Nuevo producto" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring focus:ring-blue-200"
            placeholder="Ej: Coca Cola 500ml"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring focus:ring-blue-200"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring focus:ring-blue-200"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Creando..." : "Crear"}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}