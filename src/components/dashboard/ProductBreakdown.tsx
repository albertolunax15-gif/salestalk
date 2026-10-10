import { Package } from "lucide-react"

import { EmptyState } from "@/components/shared/StateViews"
import { formatNumber, formatPrice } from "@/utils/formatters"

export type ProductRow = {
  producto: string
  cantidad: number
  subtotal: number
}

interface ProductBreakdownProps {
  rows: ProductRow[]
  total: number
  limit?: number
}

/** Ranking de productos por ingresos, con su participación sobre el total. */
export function ProductBreakdown({ rows, total, limit = 6 }: ProductBreakdownProps) {
  const top = rows.slice(0, limit)
  const max = top[0]?.subtotal || 1

  return (
    <section aria-labelledby="products-title" className="flex flex-col rounded-xl border bg-card shadow-xs">
      <div className="border-b px-5 py-4">
        <h2 id="products-title" className="text-base font-semibold text-foreground">
          Productos más vendidos
        </h2>
        <p className="text-sm text-muted-foreground">Por ingresos generados</p>
      </div>

      {top.length === 0 ? (
        <EmptyState icon={Package} title="Aún no hay ventas" description="Cuando registres ventas verás aquí el ranking." />
      ) : (
        <ol className="flex-1 divide-y">
          {top.map((r, i) => {
            const share = total > 0 ? (r.subtotal / total) * 100 : 0
            return (
              <li key={r.producto} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="truncate font-medium text-foreground" title={r.producto}>
                      {r.producto}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground tabular-nums">{formatPrice(r.subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 pl-6">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-label={`Participación de ${r.producto}`}
                    aria-valuenow={Math.round(share)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-chart-1" style={{ width: `${(r.subtotal / max) * 100}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatNumber(r.cantidad)} u · {share.toFixed(0)}%
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
