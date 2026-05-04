"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Folder,
  Search,
  MessageSquare,
  User,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/client"

const mockNotifications = [
  { id: 1, icon: MessageSquare, color: "text-[#C27F79]", text: "Javiera Fernández te envió un mensaje", time: "hace 5 min", unread: true },
  { id: 2, icon: FileText, color: "text-[#5E8B8C]", text: "Nuevo caso disponible en tu área", time: "hace 1h", unread: true },
  { id: 3, icon: DollarSign, color: "text-[#F2C94C]", text: "Pago recibido: $600", time: "hace 3h", unread: false },
]

const navItems = [
  { href: "/dashboard-lawyer", label: "Inicio", icon: Home },
  { href: "/dashboard-lawyer/cases", label: "Mis Casos", icon: Folder, badge: 2, badgeColor: "bg-[#F2C94C] text-[#2D3C3C]" },
  { href: "/dashboard-lawyer/find-clients", label: "Buscar Clientes", icon: Search },
  { href: "/dashboard-lawyer/messages", label: "Mensajes", icon: MessageSquare, badge: 3, badgeColor: "bg-[#C27F79] text-white" },
  { href: "/dashboard-lawyer/profile", label: "Mi Perfil", icon: User },
]

export default function LawyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const [userName, setUserName] = useState("Abogado")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(
          (user.user_metadata?.full_name as string | undefined) ??
            user.email ??
            "Abogado"
        )
      }
    })
  }, [])

  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isActive = (href: string) => {
    if (href === "/dashboard-lawyer") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const getBreadcrumb = () => {
    const parts = pathname.split("/").filter(Boolean)
    const labels: Record<string, string> = {
      "dashboard-lawyer": "Dashboard",
      "cases": "Mis Casos",
      "find-clients": "Buscar Clientes",
      "messages": "Mensajes",
      "profile": "Mi Perfil",
    }
    return parts.map((part) => labels[part] || part).join(" / ")
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#2D3C3C] z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white"
        >
          <Menu size={24} />
        </button>
        <Link href="/dashboard-lawyer" className="text-white font-bold text-xl">
          NEIFE
        </Link>
        <button className="text-white relative">
          <Bell size={24} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C27F79] rounded-full text-xs flex items-center justify-center">
            5
          </span>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 min-h-screen bg-[#2D3C3C] z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#75524C]/30">
          <Link href="/dashboard-lawyer" className="text-white font-bold text-2xl">
            NEIFE
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-[#75524C]/20 text-white border-l-2 border-[#75524C]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${item.badgeColor || "bg-[#C27F79] text-white"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#75524C]/30">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#75524C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-sm">
              {userInitials || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{userName}</p>
              <p className="text-white/50 text-xs">Abogado</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white transition-colors w-full text-left text-sm"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        {/* Top bar - desktop */}
        <header className="hidden lg:flex h-16 bg-white border-b border-[#D5C3B6]/30 items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-[#75524C]">
            <Link href="/dashboard-lawyer" className="hover:text-[#75524C]">
              Dashboard
            </Link>
            {pathname !== "/dashboard-lawyer" && (
              <>
                <ChevronRight size={14} />
                <span className="text-[#2D3C3C] font-medium">
                  {getBreadcrumb().split(" / ").slice(-1)[0]}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative text-[#75524C] hover:text-[#75524C]"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C27F79] rounded-full text-xs flex items-center justify-center text-white">
                  5
                </span>
              </button>
              
              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#D5C3B6]/30 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-[#D5C3B6]/30 flex justify-between items-center">
                    <span className="font-bold text-[#2D3C3C]">Notificaciones</span>
                    <button className="text-xs text-[#75524C] hover:underline">Marcar todas como leídas</button>
                  </div>
                  {mockNotifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`flex gap-3 p-4 hover:bg-[#F8F7F4] cursor-pointer border-b border-[#D5C3B6]/20 last:border-b-0 ${notif.unread ? "bg-[#75524C]/5" : ""}`}
                    >
                      <notif.icon className={notif.color} size={18} />
                      <div className="flex-1">
                        <p className="text-sm text-[#2D3C3C]">{notif.text}</p>
                        <p className="text-xs text-[#D5C3B6]">{notif.time}</p>
                      </div>
                      {notif.unread && <div className="w-2 h-2 bg-[#75524C] rounded-full mt-1 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#75524C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-sm">
              {userInitials || "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
