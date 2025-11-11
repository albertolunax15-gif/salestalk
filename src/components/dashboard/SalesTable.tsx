"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"

interface RowItem {
  cantidad: number
  producto: string
  subtotal: number
}

interface SalesTableProps {
  currentDate: string
  currentTime: string
  sampleProducts: RowItem[]
  total: number
}

export function SalesTable({ currentDate, currentTime, sampleProducts, total }: SalesTableProps) {
  const PEN = useMemo(
    () =>
      new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2,
      }),
    [],
  )

  const rows: RowItem[] =
    sampleProducts && sampleProducts.length > 0 ? sampleProducts : [{ cantidad: 0, producto: "—", subtotal: 0 }]

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Detalle de Venta</h3>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{currentDate}</span>
            <span className="mx-2">•</span>
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 text-sm font-semibold w-24">Cantidad</th>
              <th className="text-left p-4 text-sm font-semibold">Producto</th>
              <th className="text-right p-4 text-sm font-semibold w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-semibold">
                    {item.cantidad}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-medium">{item.producto}</span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {PEN.format(item.subtotal || 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{PEN.format(total || 0)}</span>
        </div>
      </div>

      {sampleProducts.length === 0 && (
        <div className="text-center text-sm text-muted-foreground p-4">Sin productos para mostrar.</div>
      )}
    </Card>
  )
}
