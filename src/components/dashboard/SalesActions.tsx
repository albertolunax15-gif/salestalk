"use client"

import { Button } from "@/components/ui/button"

interface SalesActionsProps {
  onClear: () => void
  onRegisterSale: () => void
}

export function SalesActions({ onClear, onRegisterSale }: SalesActionsProps) {
  return (
    <div className="p-4 md:p-6 bg-white flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        className="bg-orange-600 hover:bg-orange-700 text-white px-6 md:px-8 py-2 md:py-3 text-base md:text-lg font-medium"
        onClick={onClear}
      >
        LIMPIAR
      </Button>
      <Button
        className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-2 md:py-3 text-base md:text-lg font-medium"
        onClick={onRegisterSale}
      >
        REGISTRAR VENTA
      </Button>
    </div>
  )
}