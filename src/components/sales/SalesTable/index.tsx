"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Receipt, RotateCw, Search, SearchX } from "lucide-react";

import { useSales } from "@/hooks/useSales";
import { useToast } from "@/hooks/use-toast";
import type { Sale } from "@/services/saleService";
import { salesBus } from "@/lib/salesBus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow as Row } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeletonRows, friendlyError } from "@/components/shared/StateViews";
import { formatNumber } from "@/utils/formatters";
import { TableRow } from "./TableRow";

interface SalesTableProps {
  maxItems?: number;
  /** Acción principal a mostrar en el estado vacío (p. ej. abrir el asistente de voz) */
  emptyAction?: React.ReactNode;
}

// Convierte la fecha a ms con fallback a created_at
const dateToMs = (s: Sale) => {
  const d = s.date ?? s.created_at ?? null;
  const ms = d ? Date.parse(String(d)) : NaN;
  return Number.isNaN(ms) ? 0 : ms; // 0 => va al final
};

export const SalesTable = ({ maxItems = 50, emptyAction }: SalesTableProps) => {
  const { sales, loading, error, refetch, deletingId, remove } = useSales(maxItems);
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState("all");
  const [toDelete, setToDelete] = useState<Sale | null>(null);

  // Auto-refresco cuando se crea una venta
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onCreated = () => {
      clearTimeout(t);
      t = setTimeout(() => refetch(), 120);
    };
    salesBus.addEventListener("sale:created", onCreated as EventListener);
    return () => {
      clearTimeout(t);
      salesBus.removeEventListener("sale:created", onCreated as EventListener);
    };
  }, [refetch]);

  // Reciente → antiguo
  const sorted = useMemo(() => {
    return [...sales].sort((a, b) => {
      const diff = dateToMs(b) - dateToMs(a);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [sales]);

  const paymentMethods = useMemo(
    () => Array.from(new Set(sales.map((s) => s.payment_method).filter(Boolean))).sort(),
    [sales]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((s: Sale) => {
      if (payment !== "all" && s.payment_method !== payment) return false;
      if (!q) return true;
      return [s.product_name ?? s.product_id, s.payment_method, s.quantity]
        .some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [sorted, query, payment]);

  const totalUnits = useMemo(() => filtered.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0), [filtered]);
  const hasFilters = query.trim() !== "" || payment !== "all";
  const initialLoading = loading && sales.length === 0;

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const sale = toDelete;
    setToDelete(null);
    try {
      await remove(sale.id);
      toast({ variant: "success", title: "Venta eliminada", description: sale.product_name ?? undefined });
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "No se pudo eliminar la venta",
        description: friendlyError(e instanceof Error ? e.message : String(e)),
      });
    }
  }, [toDelete, remove, toast]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por producto…"
            aria-label="Buscar ventas"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select aria-label="Filtrar por método de pago" value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="all">Todos los pagos</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={loading}
            aria-label="Actualizar listado"
            title="Actualizar"
          >
            <RotateCw className={loading ? "animate-spin" : undefined} />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {initialLoading ? (
        <TableSkeletonRows cols={4} />
      ) : error && sales.length === 0 ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aún no hay ventas registradas"
          description="Registra tu primera venta usando el asistente de voz."
          action={emptyAction}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin coincidencias"
          description="Ninguna venta coincide con los filtros aplicados."
          action={
            hasFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setPayment("all");
                }}
              >
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <Row className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Método de pago</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </Row>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={String(s.id)}
                  sale={s}
                  onDelete={setToDelete}
                  isDeleting={deletingId === String(s.id)}
                />
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <span>
              Mostrando {filtered.length} de {sales.length} ventas
            </span>
            <span className="tabular-nums">{formatNumber(totalUnits)} unidades</span>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="¿Eliminar esta venta?"
        description={
          toDelete ? (
            <>
              Se eliminará la venta de <strong className="text-foreground">{toDelete.product_name ?? toDelete.product_id}</strong>{" "}
              ({toDelete.quantity} u). Esta acción no se puede deshacer.
            </>
          ) : undefined
        }
        confirmLabel="Eliminar venta"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
};
