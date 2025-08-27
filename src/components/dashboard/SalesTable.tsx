"use client";

import { useMemo } from "react";

interface RowItem {
  cantidad: number;
  producto: string;
  subtotal: number;
}

interface SalesTableProps {
  currentDate: string;
  currentTime: string;
  sampleProducts: RowItem[];
  total: number;
}

export function SalesTable({
  currentDate,
  currentTime,
  sampleProducts,
  total,
}: SalesTableProps) {
  // Formateador de moneda PEN
  const PEN = useMemo(
    () =>
      new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2,
      }),
    []
  );

  // Si no hay filas, ponemos una placeholder para que el área derecha no colapse
  const rows: RowItem[] =
    sampleProducts && sampleProducts.length > 0
      ? sampleProducts
      : [{ cantidad: 0, producto: "—", subtotal: 0 }];

  const rowSpan = Math.max(rows.length, 1);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-12 min-w-[700px]">
        {/* Encabezados */}
        <div className="col-span-2 p-2 md:p-3 bg-gray-100 border-r border-gray-300 font-medium text-xs md:text-sm">
          Cantidad:
        </div>
        <div className="col-span-3 p-2 md:p-3 bg-gray-100 border-r border-gray-300 font-medium text-xs md:text-sm">
          Producto:
        </div>
        <div className="col-span-2 p-2 md:p-3 bg-green-200 border-r border-gray-300 font-medium text-xs md:text-sm">
          Subtotal:
        </div>
        <div className="col-span-2 p-2 md:p-3 bg-red-600 text-white font-medium text-xs md:text-sm">
          Total:
        </div>
        <div className="col-span-2 p-2 md:p-3 bg-gray-100 border-l border-gray-300 font-medium text-xs md:text-sm">
          Ingresos
        </div>
        <div className="col-span-1 p-2 md:p-3 bg-red-200 font-medium text-xs md:text-sm">
          Vueltos
        </div>

        {/* Filas */}
        {rows.map((item, index) => (
          <div key={index} className="contents">
            <div className="col-span-2 p-3 border-r border-gray-300 text-center">
              {item.cantidad}
            </div>
            <div className="col-span-3 p-3 border-r border-gray-300">
              {item.producto}
            </div>
            <div className="col-span-2 p-3 bg-green-100 border-r border-gray-300 text-center">
              {PEN.format(item.subtotal || 0)}
            </div>

            {/* Bloque derecho (Total / Ingresos / Vueltos) que abarca N filas */}
            {index === 0 && (
              <>
                <div
                  className="col-span-2 p-3 bg-red-100 flex items-center justify-center text-xl font-bold"
                  style={{ gridRowEnd: `span ${rowSpan}` }}
                >
                  {PEN.format(total || 0)}
                </div>
                <div
                  className="col-span-2 p-3 border-l border-gray-300 flex items-center justify-center"
                  style={{ gridRowEnd: `span ${rowSpan}` }}
                >
                  {/* coloca aquí el valor real de ingresos si lo tienes */}
                  —
                </div>
                <div
                  className="col-span-1 p-3 bg-red-100 flex items-center justify-center"
                  style={{ gridRowEnd: `span ${rowSpan}` }}
                >
                  {/* coloca aquí el valor real de vueltos si lo tienes */}
                  —
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Mensaje vacío (opcional) */}
      {sampleProducts.length === 0 && (
        <div className="text-sm text-gray-500 mt-2">Sin productos para mostrar.</div>
      )}
    </div>
  );
}