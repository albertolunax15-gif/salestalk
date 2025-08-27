"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesTable } from "@/components/sales/SalesTable";

function SalesContent() {
  const [activeView, setActiveView] = useState("ventas");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  return (
    <div className="min-h-dvh bg-gray-100 flex">
      {/* Sidebar controlado */}
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
            <SalesHeader />

            {/* DataTable de ventas */}
            <SalesTable maxItems={50} />
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