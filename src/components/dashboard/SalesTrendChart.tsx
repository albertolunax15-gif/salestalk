"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { LineChart as LineIcon, BarChart3 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SalesReportBucket } from "@/hooks/useSalesReport"
import { formatCurrencyCompact, formatNumber, formatPrice } from "@/utils/formatters"

type Metric = "ingresos" | "ventas"
type ChartKind = "area" | "bar"

const METRICS: Record<Metric, { label: string; format: (v: number) => string; axis: (v: number) => string }> = {
  ingresos: { label: "Ingresos", format: formatPrice, axis: formatCurrencyCompact },
  ventas: { label: "N.º de ventas", format: (v) => `${formatNumber(v)} ventas`, axis: formatNumber },
}

/** "2026-10-09" se interpreta en hora local (no UTC) para no correr un día. */
export function parseBucketDate(key: string) {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(key) ? `${key}T00:00:00` : key)
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border bg-muted/60 p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

type ChartTooltipProps = {
  metric: Metric
  active?: boolean
  label?: string | number
  payload?: { value?: number; payload: { ingresos: number; ventas: number } }[]
}

function ChartTooltip({ active, payload, label, metric }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-chart-1" aria-hidden />
        <span className="text-muted-foreground">{METRICS[metric].label}</span>
        <span className="ml-auto pl-4 font-semibold text-foreground tabular-nums">{METRICS[metric].format(payload[0].value ?? 0)}</span>
      </div>
      {/* La otra métrica como contexto, sin color */}
      <p className="mt-1 text-muted-foreground tabular-nums">
        {metric === "ingresos" ? `${formatNumber(row.ventas)} ventas` : formatPrice(row.ingresos)}
      </p>
    </div>
  )
}

export function SalesTrendChart({ buckets }: { buckets: SalesReportBucket[] }) {
  const [metric, setMetric] = useState<Metric>("ingresos")
  const [kind, setKind] = useState<ChartKind>("area")

  const data = useMemo(
    () =>
      buckets.map((b) => ({
        label: parseBucketDate(b.key).toLocaleDateString("es-PE", { day: "numeric", month: "short" }),
        ingresos: Number(b.total) || 0,
        ventas: Number(b.count) || 0,
      })),
    [buckets]
  )

  const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 }
  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  }
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
      <YAxis
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        width={64}
        allowDecimals={metric === "ingresos"}
        tickFormatter={METRICS[metric].axis}
      />
      <Tooltip
        cursor={kind === "bar" ? { fill: "var(--muted)" } : { stroke: "var(--border)", strokeWidth: 1 }}
        content={<ChartTooltip metric={metric} />}
      />
    </>
  )

  return (
    <section aria-labelledby="trend-title" className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="trend-title" className="text-base font-semibold text-foreground">
            Evolución de {METRICS[metric].label.toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground">Agrupado por día</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Métrica"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "ingresos", label: "Ingresos" },
              { value: "ventas", label: "Ventas" },
            ]}
          />
          <Segmented
            label="Tipo de gráfico"
            value={kind}
            onChange={setKind}
            options={[
              { value: "area", label: <LineIcon className="size-3.5" />, ariaLabel: "Área" },
              { value: "bar", label: <BarChart3 className="size-3.5" />, ariaLabel: "Barras" },
            ]}
          />
        </div>
      </div>

      <div className="h-72 px-2 pb-3 pt-4 sm:h-80 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "area" ? (
            <AreaChart {...common}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              {axes}
              <Area
                type="monotone"
                dataKey={metric}
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#trendFill)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            </AreaChart>
          ) : (
            <BarChart {...common}>
              {axes}
              <Bar dataKey={metric} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}
