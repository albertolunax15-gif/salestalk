import type { Product } from "@/services/productService"
import { StatusPill } from "../StatusPill"
import { formatDate, formatPrice } from "@/utils/formatters"

interface TableRowProps {
  product: Product
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
  onToggle: (p: Product) => void
  busy?: { updateId: string | null; deleteId: string | null; toggleId: string | null }
}

export const TableRow = ({ product, onEdit, onDelete, onToggle, busy }: TableRowProps) => {
  const isUpdating = busy?.updateId === product.id
  const isDeleting = busy?.deleteId === product.id
  const isToggling = busy?.toggleId === product.id

  return (
    <tr key={String(product.id)} className="border-t">
      <td className="px-3 py-2 font-medium text-gray-900">{product.name ?? "—"}</td>
      <td className="px-3 py-2">{formatPrice(product.price)}</td>
      <td className="px-3 py-2">
        <StatusPill status={product.status} />
      </td>
      <td className="px-3 py-2 text-gray-600">{formatDate(product.created_at)}</td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          {/* Editar */}
          <button
            onClick={() => onEdit(product)}
            disabled={isUpdating || isDeleting || isToggling}
            className="rounded-md border p-1 hover:bg-gray-50 disabled:opacity-50"
            title="Editar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-square-pen"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
          </button>

          {/* Activar/Inactivar */}
          <button
            onClick={() => onToggle(product)}
            disabled={isUpdating || isDeleting || isToggling}
            className="rounded-md border p-1 hover:bg-gray-50 disabled:opacity-50"
            title={product.status === "active" ? "Inactivar" : "Activar"}
          >
            {product.status === "active" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-toggle-left"
              >
                <circle cx="9" cy="12" r="3" />
                <rect width="20" height="14" x="2" y="5" rx="7" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-toggle-right"
              >
                <circle cx="15" cy="12" r="3" />
                <rect width="20" height="14" x="2" y="5" rx="7" />
              </svg>
            )}
          </button>
 
          
          {/* Por ahora no se usara
          
          <button
            onClick={() => onDelete(product)}
            disabled={isUpdating || isDeleting || isToggling}
            className="rounded-md border p-1 hover:bg-gray-50 text-red-600 disabled:opacity-50"
            title="Eliminar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trash-2"
            >
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button> */}
        </div>
      </td>
    </tr>
  )
}