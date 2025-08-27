"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsTable } from "@/components/products/ProductsTable";

function ProductsContent() {
  const [activeView, setActiveView] = useState("productos");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

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

        {/* ⬇️ padding restaurado para que el título no quede pegado */}
        <div className="px-4 md:px-6 py-4 md:py-6">
          <div className="max-w-6xl mx-auto">
            <ProductsHeader />
            <ProductsTable maxItems={50} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsContent />
    </ProtectedRoute>
  );
}