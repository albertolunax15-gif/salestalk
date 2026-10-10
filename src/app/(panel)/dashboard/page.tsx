"use client";

import { useMemo } from "react";
import { Banknote, Package, Receipt, RotateCw, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/StateViews";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { ProductBreakdown, type ProductRow } from "@/components/dashboard/ProductBreakdown";
import { DailyBreakdown } from "@/components/dashboard/DailyBreakdown";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useSalesReport } from "@/hooks/useSalesReport";
import { formatNumber, formatPrice } from "@/utils/formatters";

export default function DashboardPage() {
  const { report, loading: loadingReport, error: errorReport, refetch: refetchReport } = useSalesReport();
  const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts(50);
  const { sales, loading: loadingSales, refetch: refetchSales } = useSales(50);

  // Ranking de productos a partir de las últimas ventas × precio de catálogo
  const { productRows, productTotal } = useMemo(() => {
    const priceById = new Map<string, { name: string; price: number }>();
    for (const p of products ?? []) priceById.set(p.id, { name: p.name, price: Number(p.price) || 0 });

    const acc = new Map<string, ProductRow>();
    for (const s of sales ?? []) {
      const info = priceById.get(s.product_id);
      const name = info?.name ?? s.product_name ?? (s.product_id ? `#${s.product_id.slice(0, 8)}…` : "Desconocido");
      const qty = Number(s.quantity) || 0;
      const prev = acc.get(s.product_id) ?? { producto: name, cantidad: 0, subtotal: 0 };
      acc.set(s.product_id, {
        producto: name,
        cantidad: prev.cantidad + qty,
        subtotal: prev.subtotal + qty * (info?.price ?? 0),
      });
    }

    const rows = Array.from(acc.values()).sort((a, b) => b.subtotal - a.subtotal);
    return { productRows: rows, productTotal: rows.reduce((sum, r) => sum + r.subtotal, 0) };
  }, [sales, products]);

  const activeProducts = useMemo(() => products.filter((p) => p.status === "active").length, [products]);

  const refreshing = loadingReport || loadingSales || loadingProducts;
  const handleRefresh = () => {
    void refetchReport();
    void refetchProducts();
    void refetchSales();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumen"
        description="Indicadores generales de tus ventas e inventario."
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RotateCw className={refreshing ? "animate-spin" : undefined} />
            Actualizar
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ingresos totales"
          value={formatPrice(report?.total_revenue ?? 0)}
          hint="Facturación del período"
          icon={Banknote}
          loading={loadingReport && !report}
        />
        <KpiCard
          label="Ventas"
          value={formatNumber(report?.total_sales ?? 0)}
          hint="Transacciones registradas"
          icon={ShoppingCart}
          loading={loadingReport && !report}
        />
        <KpiCard
          label="Ticket promedio"
          value={formatPrice(report?.avg_ticket ?? 0)}
          hint="Ingreso por transacción"
          icon={Receipt}
          loading={loadingReport && !report}
        />
        <KpiCard
          label="Productos activos"
          value={`${formatNumber(activeProducts)} / ${formatNumber(products.length)}`}
          hint="Disponibles para la venta"
          icon={Package}
          loading={loadingProducts && products.length === 0}
        />
      </div>

      {/* Tendencia */}
      {errorReport ? (
        <div className="rounded-xl border bg-card shadow-xs">
          <ErrorState title="No se pudo cargar el reporte" error={errorReport} onRetry={refetchReport} />
        </div>
      ) : loadingReport && !report ? (
        <Skeleton className="h-[420px] rounded-xl" />
      ) : (
        <SalesTrendChart buckets={report?.buckets ?? []} />
      )}

      {/* Detalle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loadingSales && sales.length === 0 ? (
          <Skeleton className="h-[400px] rounded-xl" />
        ) : (
          <ProductBreakdown rows={productRows} total={productTotal} />
        )}
        {loadingReport && !report ? (
          <Skeleton className="h-[400px] rounded-xl" />
        ) : (
          <DailyBreakdown buckets={report?.buckets ?? []} />
        )}
      </div>
    </div>
  );
}
