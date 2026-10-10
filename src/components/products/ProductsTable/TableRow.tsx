import { Loader2, Pencil, Power, PowerOff } from "lucide-react"

import type { Product } from "@/services/productService"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow as Row } from "@/components/ui/table"
import { StatusPill } from "../StatusPill"
import { formatPrice, formatShortDate } from "@/utils/formatters"

interface TableRowProps {
  product: Product
  onEdit: (p: Product) => void
  onToggle: (p: Product) => void
  busy?: { updateId: string | null; deleteId: string | null; toggleId: string | null }
}

export const TableRow = ({ product, onEdit, onToggle, busy }: TableRowProps) => {
  const isToggling = busy?.toggleId === product.id
  const isBusy = busy?.updateId === product.id || busy?.deleteId === product.id || isToggling
  const isActive = product.status === "active"
  const isTemp = String(product.id).startsWith("temp-")

  return (
    <Row className={isTemp ? "opacity-60" : undefined}>
      <TableCell className="max-w-[320px]">
        <span className="block truncate font-medium text-foreground" title={product.name}>
          {product.name ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-right font-medium text-foreground">{formatPrice(Number(product.price))}</TableCell>
      <TableCell>
        <StatusPill status={product.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">{formatShortDate(product.created_at)}</TableCell>
      <TableCell className="text-right">
        <div className="inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(product)}
            disabled={isBusy || isTemp}
            aria-label={`Editar ${product.name}`}
            title="Editar"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={
              isActive
                ? "size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                : "size-8 text-muted-foreground hover:bg-success/10 hover:text-success"
            }
            onClick={() => onToggle(product)}
            disabled={isBusy || isTemp}
            aria-label={`${isActive ? "Desactivar" : "Activar"} ${product.name}`}
            title={isActive ? "Desactivar" : "Activar"}
          >
            {isToggling ? <Loader2 className="animate-spin" /> : isActive ? <PowerOff /> : <Power />}
          </Button>
        </div>
      </TableCell>
    </Row>
  )
}
