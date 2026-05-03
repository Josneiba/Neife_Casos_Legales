import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "NEIFE - Gestión de Casos Legales Simplificada",
  description: "Marketplace legal que conecta clientes con abogados en Chile. Define tu presupuesto y encuentra el abogado ideal.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="bg-[#F8F7F4] scroll-smooth">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
