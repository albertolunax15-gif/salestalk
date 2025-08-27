"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { Home, Package, ShoppingCart, BarChart3, Menu, X, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// Hook interno (sin archivo aparte) para saber si es desktop (md ≥ 768px)
function useIsDesktop(minWidth = 768) {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [minWidth])
  return isDesktop
}

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (isOpen: boolean) => void
  isMenuCollapsed: boolean
  setIsMenuCollapsed: (isCollapsed: boolean) => void
}

const menuItems = [
  { id: "inicio", label: "Inicio", icon: Home, path: "/dashboard" },
  { id: "productos", label: "Productos", icon: Package, path: "/products" },
  { id: "ventas", label: "Ventas", icon: ShoppingCart, path: "/sales" },
]

export function Sidebar({
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isMenuCollapsed,
  setIsMenuCollapsed,
}: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const isDesktop = useIsDesktop()
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync activeView con la ruta
  useEffect(() => {
    const match = menuItems.find((i) => pathname === i.path || pathname.startsWith(i.path + "/"))
    if (match) setActiveView(match.id)
  }, [pathname, setActiveView])

  // Bloquear scroll del body solo cuando drawer móvil está abierto
  useEffect(() => {
    if (!isDesktop && isMobileMenuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isDesktop, isMobileMenuOpen])

  // aria-hidden/inert SOLO cuando está cerrado en móvil
  const ariaHidden = useMemo(() => (!isDesktop && !isMobileMenuOpen), [isDesktop, isMobileMenuOpen])

  // Si se cierra en móvil y había foco dentro, lo quitamos (evita el error de "retained focus")
  useEffect(() => {
    if (ariaHidden && containerRef.current?.contains(document.activeElement)) {
      ;(document.activeElement as HTMLElement | null)?.blur?.()
    }
  }, [ariaHidden])

  const handleLogoutClick = () => {
    if (isMenuCollapsed) setShowLogoutConfirm(true)
    else handleLogout()
  }
  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
    setShowLogoutConfirm(false)
    router.push("/")
  }
  const cancelLogout = () => setShowLogoutConfirm(false)

  return (
    <>
      {/* Overlay móvil */}
      {isMobileMenuOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        id="app-sidebar"
        ref={containerRef}
        className={`
          bg-white shadow-lg border-r flex flex-col flex-shrink-0
          ${isMenuCollapsed ? "w-16" : "w-64"}
          transform transition-transform duration-300 ease-in-out

          fixed md:relative z-50 md:z-auto
          top-0 left-0 bottom-0
          h-dvh md:h-screen
          overflow-y-auto

          ${isMobileMenuOpen || isDesktop ? "translate-x-0" : "-translate-x-full"}

          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        `}
        // ✅ Boolean reales; en desktop no se aplica nada
        aria-hidden={ariaHidden || undefined}
        inert={ariaHidden || undefined as any}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center min-h-[56px]">
          {!isMenuCollapsed && <h2 className="text-xl font-bold text-gray-800">Menu</h2>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
              className="hidden md:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isMenuCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 mt-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  prefetch
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={isMenuCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isMenuCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer / Cerrar sesión */}
        <div className="p-4 border-t mt-auto relative">
          {showLogoutConfirm && isMenuCollapsed ? (
            <div className="absolute bottom-16 left-16 bg-white p-3 rounded-lg shadow-lg border z-50">
              <p className="text-sm font-medium mb-2">¿Cerrar sesión?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Sí
                </button>
                <button
                  onClick={cancelLogout}
                  className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  No
                </button>
              </div>
            </div>
          ) : null}

          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
              isMenuCollapsed ? "justify-center text-red-600 hover:bg-red-50" : "text-red-600 hover:bg-red-50"
            }`}
            title={isMenuCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isMenuCollapsed && <span className="font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </>
  )
}