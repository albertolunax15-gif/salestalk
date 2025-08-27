import type { Sale } from "@/services/saleService";
import { formatDate } from "@/utils/formatters";

interface TableRowProps {
  sale: Sale;
}

export const TableRow = ({ sale }: TableRowProps) => {
  return (
    <tr key={String(sale.id)} className="border-t">

      {/* ÚNICA fecha que se muestra */}
      <td className="px-3 py-2 text-gray-700">{formatDate(sale.date)}</td>

      <td className="px-3 py-2">
        {typeof sale.quantity === "number" ? sale.quantity : "—"}
      </td>

      {/* Nombre del producto (fallback al id si no está disponible) */}
      <td
        className="px-3 py-2 font-medium text-gray-900 truncate max-w-[240px]"
        title={String(sale.product_name ?? sale.product_id)}
      >
        {sale.product_name ?? sale.product_id ?? "—"}
      </td>

      <td className="px-3 py-2">{sale.payment_method ?? "—"}</td>
    </tr>
  );
};