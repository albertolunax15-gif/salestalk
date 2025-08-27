import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "SalesTalk - Sistema de Gestión",
  description: "Sistema de gestión de ventas y inventario",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* 👇 El Toaster siempre dentro del <body> */}
        <Toaster />
      </body>
    </html>
  )
}