"use client"

import { BaseModal } from "./BaseModal"

type Props = {
  open: boolean
  productName: string
  onClose: () => void
  onConfirm: () => Promise<void>
  busy?: boolean
}

export function DeleteProductModal({ open, productName, onClose, onConfirm, busy }: Props) {
  return (
    <BaseModal open={open} title="Eliminar producto" onClose={onClose}>
      <p className="text-sm text-gray-700">
        ¿Seguro que deseas eliminar <span className="font-semibold">{productName || "este producto"}</span>?
        Esta acción no se puede deshacer.
      </p>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          disabled={busy}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </BaseModal>
  )
}