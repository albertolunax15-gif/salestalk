// TableRow.tsx
import type { Sale } from "@/services/saleService"

interface TableRowProps {
  sale: Sale
  onDelete?: (sale: Sale) => void
  isDeleting?: boolean
}

export function TableRow({ sale, onDelete, isDeleting }: TableRowProps) {
  return (
    <tr className="border-t">
      {/* adapta estos <td> a tus columnas actuales */}
      <td className="px-3 py-2">{new Date(sale.date).toLocaleString()}</td>
      <td className="px-3 py-2">{sale.quantity}</td>
      <td className="px-3 py-2" title={sale.product_name ?? sale.product_id}>
        {sale.product_name ?? sale.product_id}
      </td>
      <td className="px-3 py-2">{sale.payment_method}</td>

      {/* Nueva columna: Acciones */}
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => onDelete?.(sale)}
          disabled={isDeleting}
          className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
          title="Eliminar venta"
        >
          {isDeleting ? "Eliminando…" : "Eliminar"}
        </button>
      </td>
    </tr>
  )
}