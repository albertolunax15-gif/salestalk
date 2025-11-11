"use client";

import { useMemo, useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { SalesHeader } from "@/components/dashboard/SalesHeader";
import { SalesTable } from "@/components/dashboard/SalesTable";
import { Card, CardContent } from "@/components/ui/card";
import { SalesDashboard } from "@/components/dashboard/SalesDashboard";

// hooks con data real
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";

function SalesContent() {
  const [activeView, setActiveView] = useState("ventas");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  // 🔐 token para el dashboard
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
  }, []);

  // Cargar productos y ventas desde tu API
  const {
    products,
    loading: loadingProducts,
    error: errorProducts,
    refetch: refetchProducts,
  } = useProducts(50);

  const {
    sales,
    loading: loadingSales,
    error: errorSales,
    refetch: refetchSales,
  } = useSales(50);

  // Fecha/hora (Perú)
  const { currentDate, currentTime } = useMemo(() => {
    const now = new Date();
    const currentDate = new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
    }).format(now);
    const currentTime = new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Lima",
    }).format(now);
    return { currentDate, currentTime };
  }, []);

  // Mapa rápido de productos por id para nombre/precio
  const productById = useMemo(() => {
    const map: Record<string, { name: string; price: number }> = {};
    for (const p of products ?? []) {
      map[p.id] = { name: p.name, price: Number(p.price) || 0 };
    }
    return map;
  }, [products]);

  // Adaptar ventas al shape de SalesTable
  const { rowsForTable, total } = useMemo(() => {
    const acc = new Map<string, { cantidad: number; producto: string; subtotal: number }>();

    for (const s of sales ?? []) {
      const prodInfo = productById[s.product_id];
      const price = prodInfo?.price ?? 0;
      const name =
        prodInfo?.name ?? (s.product_id ? `#${s.product_id.slice(0, 8)}…` : "Desconocido");

      const prev = acc.get(s.product_id) ?? { cantidad: 0, producto: name, subtotal: 0 };
      const cantidad = prev.cantidad + (Number(s.quantity) || 0);
      const subtotal = prev.subtotal + (Number(s.quantity) || 0) * price;

      acc.set(s.product_id, { cantidad, producto: name, subtotal });
    }

    const rows = Array.from(acc.values()).sort((a, b) => a.producto.localeCompare(b.producto));
    const total = rows.reduce((sum, r) => sum + r.subtotal, 0);
    return { rowsForTable: rows, total };
  }, [sales, productById]);

  const loading = loadingProducts || loadingSales;
  const errorMsg = errorProducts || errorSales;

  const handleRefresh = () => {
    refetchProducts();
    refetchSales();
  };

  const handleClear = () => console.log("[ventas] Limpiar clicked");
  const handleRegisterSale = () => console.log("[ventas] Registrar venta clicked");

  return (
    <div className="min-h-dvh bg-gray-100 flex">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isMenuCollapsed={isMenuCollapsed}
        setIsMenuCollapsed={setIsMenuCollapsed}
      />

      <div className="flex-1 md:ml-0">
        <MobileHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Título fuera del card */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reporte General</h1>
                <p className="text-sm text-gray-500">
                  {loading ? "Cargando…" : `Ventas (máx. 50) — ${sales?.length ?? 0} registros`}
                </p>
              </div>
            </div>

            

            <Card className="mt-4 bg-white shadow-lg border rounded-lg overflow-hidden">
              <CardContent className="p-4 md:p-6">
                {/* Mensajes de error/estado */}
                {errorMsg && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMsg}
                  </div>
                )}
                
                {/* 🔥 Dashboard de reporte (usa GET /sales/report sin parámetros) */}
                {token && (
                  <div className="mt-4">
                    <SalesDashboard token={token} />
                  </div>
                )}
                
                <SalesHeader currentDate={currentDate} currentTime={currentTime} />

                {loading ? (
                  <div className="mt-2 text-sm text-gray-600">Cargando datos…</div>
                ) : (
                  <SalesTable
                    currentDate={currentDate}
                    currentTime={currentTime}
                    sampleProducts={rowsForTable}
                    total={total}
                  />
                )}
                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <SalesContent />
    </ProtectedRoute>
  );
}
