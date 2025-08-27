"use client"

import { Menu } from "lucide-react"

interface MobileHeaderProps {
  setIsMobileMenuOpen: (isOpen: boolean) => void
}

export function MobileHeader({ setIsMobileMenuOpen }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100"
        aria-label="Abrir menú"
        aria-controls="app-sidebar"
        aria-expanded={true}
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>
      <div className="w-10" />
    </div>
  )
}