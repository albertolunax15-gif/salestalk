import Image from "next/image"
import { BarChart3, Mic, Package } from "lucide-react"

import { LoginForm } from "./LoginForm"

const FEATURES = [
  { icon: Mic, title: "Ventas por voz", text: "Dicta la venta y el asistente identifica producto, cantidad y pago." },
  { icon: BarChart3, title: "Reportes al instante", text: "Ingresos, ticket promedio y tendencia diaria en un vistazo." },
  { icon: Package, title: "Catálogo ordenado", text: "Administra precios y disponibilidad de tus productos." },
]

export function LoginLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <div className="relative size-10 overflow-hidden rounded-xl ring-1 ring-white/20">
            <Image src="/salestalk-logo.png" alt="" fill sizes="40px" className="object-cover" priority />
          </div>
          <span className="text-lg font-semibold">SalesTalk</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
            Registra y analiza tus ventas con solo tu voz.
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-primary-foreground/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} SalesTalk</p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center bg-background px-4 py-12 sm:px-6">
        <LoginForm />
      </main>
    </div>
  )
}
