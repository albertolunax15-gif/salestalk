import { CalendarDays } from "lucide-react"

import { EmptyState } from "@/components/shared/StateViews"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SalesReportBucket } from "@/hooks/useSalesReport"
import { formatNumber, formatPrice } from "@/utils/formatters"
import { parseBucketDate } from "./SalesTrendChart"

export function DailyBreakdown({ buckets }: { buckets: SalesReportBucket[] }) {
  // Más reciente primero
  const rows = [...buckets].sort((a, b) => parseBucketDate(b.key).getTime() - parseBucketDate(a.key).getTime())

  return (
    <section aria-labelledby="daily-title" className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="border-b px-5 py-4">
        <h2 id="daily-title" className="text-base font-semibold text-foreground">
          Detalle por día
        </h2>
        <p className="text-sm text-muted-foreground">Vista tabular del gráfico</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Sin datos en el período" />
      ) : (
        <div className="max-h-[340px] flex-1 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Ticket prom.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.key}>
                  <TableCell className="font-medium text-foreground">
                    {parseBucketDate(b.key).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(b.count)}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">{formatPrice(b.total)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {b.count > 0 ? formatPrice(b.total / b.count) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
