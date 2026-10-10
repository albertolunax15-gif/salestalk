"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CalendarDays, Menu } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { AppSidebar } from "./AppSidebar"
import { NAV_ITEMS, isActivePath } from "./nav"

const COLLAPSED_KEY = "salestalk:sidebar-collapsed"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Preferencia de sidebar contraído (por navegador)
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1")
    } catch {}
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1")
      } catch {}
      return !c
    })
  }

  // Cierra el drawer al cambiar de ruta
  useEffect(() => setMobileOpen(false), [pathname])

  const current = NAV_ITEMS.find((i) => isActivePath(pathname, i.href))

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "America/Lima",
      }).format(new Date()),
    []
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    logout()
    router.replace("/")
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      {/* Sidebar escritorio */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onLogout={() => setConfirmLogout(true)}
        />
      </aside>

      {/* Drawer móvil (Radix: focus trap, Esc y scroll-lock incluidos) */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          className={cn(
            "left-0 top-0 h-dvh max-h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none border-0 border-r p-0 shadow-xl",
            "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
            "[&>button:last-child]:top-5"
          )}
        >
          <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
          <AppSidebar
            variant="mobile"
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            onLogout={() => {
              setMobileOpen(false)
              setConfirmLogout(true)
            }}
          />
        </DialogContent>
      </Dialog>

      <div className={cn("flex min-h-dvh flex-col transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            className="-ml-1 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <nav aria-label="Ruta" className="min-w-0 flex-1">
            <ol className="flex items-center gap-2 text-sm">
              <li className="hidden text-muted-foreground sm:block">SalesTalk</li>
              <li aria-hidden className="hidden text-border sm:block">/</li>
              <li className="truncate font-medium text-foreground" aria-current="page">
                {current?.label ?? "Panel"}
              </li>
            </ol>
          </nav>

          <div className="hidden items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <CalendarDays className="size-3.5" />
            <span className="capitalize">{today}</span>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a ingresar tus credenciales para acceder al panel."
        confirmLabel="Cerrar sesión"
        destructive
        loading={loggingOut}
        onConfirm={handleLogout}
      />
    </div>
  )
}
