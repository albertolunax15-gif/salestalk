"use client";

interface SalesHeaderProps {
  currentDate: string;
  currentTime: string;
  /** # de productos distintos mostrados en la tabla */
  productCount?: number;
  /** Nombre del vendedor/a (o correo) */
  sellerName?: string;
  /** Medio de pago (o resumen si hay varios) */
  paymentMethod?: string;
}

export function SalesHeader({
  currentDate,
  currentTime,
  productCount,
  sellerName,
  paymentMethod,
}: SalesHeaderProps) {
  const count = typeof productCount === "number" ? productCount : 0;
  const seller = sellerName?.trim() || "—";
  const pay = paymentMethod?.trim() || "—";

  return (
    <>
      {/* Fila 1: Fecha / Hora */}
      <div className="grid grid-cols-2 md:grid-cols-4 text-black text-sm md:text-base border-b border-gray-300">
        <div className="p-2 md:p-3 border-r border-gray-300 font-medium">Fecha actual:</div>
        <div className="p-2 md:p-3 border-r border-gray-300 whitespace-nowrap">{currentDate}</div>
        <div className="p-2 md:p-3 border-r border-gray-300 font-medium">Hora actual:</div>
        <div className="p-2 md:p-3 whitespace-nowrap">{currentTime}</div>
      </div>

   </>
  );
}