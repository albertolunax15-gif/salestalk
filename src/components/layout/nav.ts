import { LayoutDashboard, Package, ShoppingCart, type LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard, description: "Indicadores y reporte general" },
  { label: "Ventas", href: "/sales", icon: ShoppingCart, description: "Registro y gestión de ventas" },
  { label: "Productos", href: "/products", icon: Package, description: "Catálogo e inventario" },
]

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}
