"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSales } from "@/hooks/useSales";
import type { Sale } from "@/services/saleService";
import { TableRow } from "./TableRow";
import { TableSkeleton } from "./TableSkeleton";
import { TableError } from "./TableError";
import { TableEmpty } from "./TableEmpty";
import { salesBus } from "@/lib/salesBus";

interface SalesTableProps {
  maxItems?: number;
}

export const SalesTable = ({ maxItems = 50 }: SalesTableProps) => {
  const { sales, loading, error, refetch, deletingId, remove } = useSales(maxItems);
  const [query, setQuery] = useState("");

  // 🔁 Auto-refresco cuando se crea una venta
  useEffect(() => {
    let t: any;
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

  // 🧠 Utilidad: convertir fecha a número (ms) con fallback a created_at
  const dateToMs = (s: Sale) => {
    const d = s.date ?? (s as any).created_at ?? null;
    const ms = d ? Date.parse(String(d)) : NaN;
    return Number.isNaN(ms) ? 0 : ms; // 0 => va al final
  };

  // 🔽 Ordena de reciente → antiguo
  const sorted = useMemo(() => {
    return [...sales].sort((a, b) => {
      const diff = dateToMs(b) - dateToMs(a);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [sales]);

  // 🔎 Filtrado sobre la lista ya ORDENADA
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s: Sale) => {
      const idText = String(s.id ?? "").toLowerCase();
      const productText = String(s.product_name ?? s.product_id ?? "").toLowerCase();
      const pmText = String(s.payment_method ?? "").toLowerCase();
      const dateText = String(s.date ?? "").toLowerCase();
      const qtyText = String(s.quantity ?? "").toLowerCase();
      return [idText, productText, pmText, dateText, qtyText].some((v) => v.includes(q));
    });
  }, [sorted, query]);

  // 🗑️ Eliminar (confirm + llamada al hook)
  const handleDelete = useCallback(
    async (sale: Sale) => {
      const ok = confirm(
        `¿Eliminar la venta ${sale.id} (${sale.product_name ?? sale.product_id})?\nEsta acción no se puede deshacer.`
      );
      if (!ok) return;

      try {
        await remove(sale.id);
      } catch (e: any) {
        alert(e?.message ?? "No se pudo eliminar la venta");
      }
    },
    [remove]
  );

  return (
    <div className="rounded-lg border bg-white p-4 md:p-6">
      {/* Controles */}
      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por producto, método de pago, fecha o cantidad…"
          className="w-full md:w-96 border rounded-md px-3 py-2 text-sm outline-none focus:ring focus:ring-blue-200"
        />
        <button
          onClick={refetch}
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Refrescar
        </button>
      </div>

      {/* Estados */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <TableError error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <TableEmpty />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">Cantidad</th>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 font-semibold">Método de pago</th>
                {/* 👇 Nueva cabecera */}
                <th className="px-3 py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <TableRow
                  key={String(s.id)}
                  sale={s}
                  onDelete={handleDelete}
                  isDeleting={deletingId === String(s.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};