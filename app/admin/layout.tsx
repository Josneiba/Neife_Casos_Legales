import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#2D3C3C]">
      <header className="border-b border-[#D5C3B6]/40 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin/lawyers" className="font-bold text-[#75524C]">
            Neife — Administración
          </Link>
          <Link
            href="/dashboard-client"
            className="text-sm text-[#5E8B8C] hover:underline"
          >
            Volver al panel
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
