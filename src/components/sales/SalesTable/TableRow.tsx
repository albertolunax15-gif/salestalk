import { Banknote, CreditCard, Landmark, Loader2, Smartphone, Trash2 } from "lucide-react"

import type { Sale } from "@/services/saleService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow as Row } from "@/components/ui/table"
import { formatNumber, formatShortDate, formatTime } from "@/utils/formatters"

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  yape: Smartphone,
  plin: Smartphone,
  transferencia: Landmark,
}

export function PaymentBadge({ method }: { method?: string }) {
  const Icon = PAYMENT_ICONS[String(method ?? "").toLowerCase()]
  return (
    <Badge variant="secondary" className="capitalize">
      {Icon && <Icon aria-hidden />}
      {method || "—"}
    </Badge>
  )
}

interface TableRowProps {
  sale: Sale
  onDelete?: (sale: Sale) => void
  isDeleting?: boolean
}

export function TableRow({ sale, onDelete, isDeleting }: TableRowProps) {
  const date = sale.date ?? sale.created_at
  const productLabel = sale.product_name ?? sale.product_id

  return (
    <Row>
      <TableCell>
        <div className="font-medium text-foreground">{formatShortDate(date)}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{formatTime(date)}</div>
      </TableCell>
      <TableCell className="max-w-[320px]">
        <span className="block truncate font-medium text-foreground" title={productLabel}>
          {productLabel}
        </span>
      </TableCell>
      <TableCell className="text-right text-foreground">{formatNumber(Number(sale.quantity) || 0)}</TableCell>
      <TableCell>
        <PaymentBadge method={sale.payment_method} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete?.(sale)}
          disabled={isDeleting}
          aria-label={`Eliminar venta de ${productLabel}`}
          title="Eliminar venta"
        >
          {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </TableCell>
    </Row>
  )
}
