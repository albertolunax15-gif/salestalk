"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, DollarSign, ShoppingCart, Wallet } from "lucide-react"

interface SalesReportData {
  group_by: string
  total_sales: number
  total_revenue: number
  avg_ticket: number
  buckets: Array<{
    key: string
    count: number
    total: number
  }>
}

interface SalesDashboardProps {
  token: string
}

export function SalesDashboard({ token }: SalesDashboardProps) {
  const [data, setData] = useState<SalesReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simular llamada al endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/report`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("[v0] Error fetching sales report:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">No hay datos disponibles</div>
  }

  const PEN = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  })

  // Preparar datos para el gráfico
  const chartData = data.buckets.map((bucket) => ({
    date: new Date(bucket.key).toLocaleDateString("es-PE", {
      month: "short",
      day: "numeric",
    }),
    ventas: bucket.count,
    ingresos: bucket.total,
    promedio: bucket.total / bucket.count,
  }))

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
  }: {
    title: string
    value: string
    subtitle: string
    icon: any
    gradient: string
  }) => (
    <Card className={`relative overflow-hidden border-none ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Icon className="w-full h-full" strokeWidth={1} />
      </div>
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-white/90">{title}</h3>
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-white/80">{subtitle}</p>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Ventas Totales"
          value={data.total_sales.toString()}
          subtitle="Transacciones realizadas"
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Ingresos Totales"
          value={PEN.format(data.total_revenue)}
          subtitle="Facturación del período"
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Ticket Promedio"
          value={PEN.format(data.avg_ticket)}
          subtitle="Por transacción"
          icon={Wallet}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Chart Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Evolución de Ventas e Ingresos
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Análisis detallado por {data.group_by === "day" ? "día" : "período"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                chartType === "area"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Área
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Línea
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                chartType === "bar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Barras
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fill: "currentColor" }} className="text-xs text-muted-foreground" />
              <YAxis tick={{ fill: "currentColor" }} className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorIngresos)"
                name="Ingresos (S/)"
              />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorVentas)"
                name="Ventas (#)"
              />
            </AreaChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fill: "currentColor" }} className="text-xs text-muted-foreground" />
              <YAxis tick={{ fill: "currentColor" }} className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
                name="Ingresos (S/)"
              />
              <Line
                type="monotone"
                dataKey="ventas"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Ventas (#)"
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fill: "currentColor" }} className="text-xs text-muted-foreground" />
              <YAxis tick={{ fill: "currentColor" }} className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" radius={[8, 8, 0, 0]} name="Ingresos (S/)" />
              <Bar dataKey="ventas" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Ventas (#)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detalle por Fecha</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Fecha</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Ventas</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Ingresos</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {data.buckets.map((bucket, index) => (
                <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-sm">
                    {new Date(bucket.key).toLocaleDateString("es-PE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="p-3 text-sm text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                      {bucket.count}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {PEN.format(bucket.total)}
                  </td>
                  <td className="p-3 text-sm text-right text-muted-foreground">
                    {PEN.format(bucket.total / bucket.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}