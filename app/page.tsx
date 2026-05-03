"use client"

import { useState, useEffect, useRef, RefObject } from "react"
import Link from "next/link"
import { 
  Gavel, 
  Scale, 
  FileText, 
  Users, 
  DollarSign, 
  ArrowRight, 
  Star,
  Menu,
  X,
  CheckCircle,
  Mail,
  Phone,
  MapPin
} from "lucide-react"
import { specialties } from "@/lib/data"

const features = [
  {
    icon: Gavel,
    title: "Gestión de Casos",
    description: "Seguimiento completo de tus casos legales en un solo lugar.",
    color: "text-[#5E8B8C]",
  },
  {
    icon: Scale,
    title: "Búsqueda por Presupuesto",
    description: "Encuentra abogados que se ajusten a tu presupuesto.",
    color: "text-[#C27F79]",
    badge: "ÚNICO EN CHILE",
  },
  {
    icon: FileText,
    title: "Gestión de Documentos",
    description: "Almacena y comparte documentos de forma segura.",
    color: "text-[#F2C94C]",
  },
  {
    icon: Users,
    title: "Comunicación Directa",
    description: "Mensajería integrada con tu abogado.",
    color: "text-[#75524C]",
  },
  {
    icon: DollarSign,
    title: "Transparencia de Tarifas",
    description: "Conoce los precios antes de contratar.",
    color: "text-[#5E8B8C]",
  },
]

const steps = [
  { number: 1, title: "Regístrese", description: "Cree su cuenta en segundos", color: "#5E8B8C" },
  { number: 2, title: "Define tu Presupuesto", description: "Indica cuánto puedes pagar", color: "#C27F79", highlight: true },
  { number: 3, title: "Conecta y Resuelve", description: "Encuentra al abogado ideal", color: "#F2C94C" },
]

const testimonials = [
  {
    name: "María Fernández",
    role: "Cliente",
    text: "Encontré un abogado que se ajustaba perfectamente a mi presupuesto. El proceso fue muy transparente.",
    rating: 5,
  },
  {
    name: "Carlos Mendoza",
    role: "Empresario",
    text: "La plataforma me ahorró tiempo y dinero. Pude comparar tarifas y elegir el mejor profesional.",
    rating: 5,
  },
  {
    name: "Ana Pérez",
    role: "Cliente",
    text: "Excelente servicio. Mi caso fue resuelto de manera eficiente y a un precio justo.",
    rating: 5,
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Scroll animation hook
  const useInView = (ref: RefObject<HTMLElement>) => {
    const [inView, setInView] = useState(false)
    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setInView(true)
      }, { threshold: 0.1 })
      if (ref.current) observer.observe(ref.current)
      return () => observer.disconnect()
    }, [ref])
    return inView
  }
  
  const featuresRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  
  const featuresInView = useInView(featuresRef)
  const stepsInView = useInView(stepsRef)
  const testimonialsInView = useInView(testimonialsRef)

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="bg-[#2D3C3C] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-white font-bold text-2xl">
              NEIFE
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-[#F2C94C] transition-colors">
                Características
              </a>
              <a href="#how-it-works" className="text-white/80 hover:text-[#F2C94C] transition-colors">
                Cómo Funciona
              </a>
              <a href="#contact" className="text-white/80 hover:text-[#F2C94C] transition-colors">
                Contacto
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 border border-white text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/80 transition-colors"
              >
                Registrarse
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#2D3C3C] border-t border-[#5E8B8C]/30 pb-4">
            <nav className="flex flex-col px-4 gap-4 pt-4">
              <a href="#features" className="text-white/80 hover:text-[#F2C94C]">
                Características
              </a>
              <a href="#how-it-works" className="text-white/80 hover:text-[#F2C94C]">
                Cómo Funciona
              </a>
              <a href="#contact" className="text-white/80 hover:text-[#F2C94C]">
                Contacto
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  className="px-4 py-2 border border-white text-white rounded-lg text-center"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#5E8B8C] text-white rounded-lg text-center"
                >
                  Registrarse
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#75524C]/10 via-[#D5C3B6]/10 to-[#5E8B8C]/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D3C3C] mb-6">
              Gestión de Casos Legales{" "}
              <span className="text-[#5E8B8C]">Simplificada</span>
            </h1>
            <p className="text-lg md:text-xl text-[#75524C] mb-8">
              Conectamos clientes con abogados de confianza en Chile. Define tu presupuesto y encuentra al profesional ideal para tu caso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=client"
                className="px-8 py-4 bg-[#5E8B8C] text-white rounded-lg font-semibold hover:bg-[#5E8B8C]/90 transition-colors flex items-center justify-center gap-2"
              >
                Soy Cliente
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/register?role=lawyer"
                className="px-8 py-4 bg-[#75524C] text-white rounded-lg font-semibold hover:bg-[#75524C]/90 transition-colors flex items-center justify-center gap-2"
              >
                Soy Abogado
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-white border-y border-[#D5C3B6]/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "1,240+", label: "Clientes registrados", color: "text-[#5E8B8C]" },
              { number: "180+", label: "Abogados verificados", color: "text-[#75524C]" },
              { number: "3,800+", label: "Consultas realizadas", color: "text-[#C27F79]" },
              { number: "4.8", label: "Calificacion promedio", color: "text-[#F2C94C]" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.number}</p>
                <p className="text-sm text-[#75524C] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#2D3C3C] text-center mb-12">
            Todo lo que necesitas en un solo lugar
          </h2>
          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white border border-[#D5C3B6]/30 rounded-lg p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 cursor-pointer ${
                  featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <feature.icon className={`${feature.color}`} size={32} />
                  {feature.badge && (
                    <span className="px-2 py-1 bg-[#C27F79] text-white text-xs font-bold rounded">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#2D3C3C] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#75524C]">{feature.description}</p>
              </div>
            ))}

            {/* CTA Card */}
            <div className="bg-gradient-to-r from-[#2D3C3C] to-[#5E8B8C] rounded-lg p-6 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">¿Listo para empezar?</h3>
                <p className="text-white/80 mb-4">
                  Únete a miles de usuarios que ya confían en NEIFE.
                </p>
              </div>
              <Link
                href="/register"
                className="px-6 py-3 bg-white text-[#2D3C3C] rounded-lg font-semibold hover:bg-white/90 transition-colors text-center"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-[#D5C3B6]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#2D3C3C] text-center mb-12">
            Cómo Funciona
          </h2>
          <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className={`text-center transition-all duration-500 ${
                  stepsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: step.color }}
                >
                  {step.number}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${step.highlight ? "text-[#C27F79]" : "text-[#2D3C3C]"}`}>
                  {step.title}
                </h3>
                <p className="text-[#75524C]">{step.description}</p>
                {step.highlight && (
                  <span className="inline-block mt-2 px-3 py-1 bg-[#C27F79]/10 text-[#C27F79] text-sm rounded-full">
                    Paso clave
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#2D3C3C] text-center mb-12">
            Lo que dicen nuestros usuarios
          </h2>
          <div ref={testimonialsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-white border border-[#D5C3B6]/30 rounded-lg p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 cursor-pointer ${
                  testimonialsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-[#F2C94C] text-[#F2C94C]" />
                  ))}
                </div>
                <p className="text-[#75524C] mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D3C3C]">{testimonial.name}</p>
                    <p className="text-sm text-[#75524C]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Areas */}
      <section className="py-20 bg-[#D5C3B6]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#2D3C3C] text-center mb-4">
            Áreas Legales Atendidas
          </h2>
          <p className="text-[#75524C] text-center mb-8 max-w-2xl mx-auto">
            Encuentra abogados especializados en diversas áreas del derecho
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {specialties.map((specialty) => (
              <Link
                key={specialty}
                href={`/dashboard-client/find-lawyer?specialty=${encodeURIComponent(specialty)}`}
                className="px-4 py-2 bg-white border border-[#D5C3B6]/30 rounded-full text-[#75524C] hover:bg-[#5E8B8C] hover:text-white hover:border-[#5E8B8C] transition-colors"
              >
                {specialty}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Comienza hoy mismo
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Únete a la plataforma legal más transparente de Chile. Define tu presupuesto y conecta con abogados de confianza.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#2D3C3C] rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            <CheckCircle size={20} />
            Registrarse Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#2D3C3C] text-white py-12 border-t border-[#5E8B8C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-2xl mb-4">NEIFE</h3>
              <p className="text-white/60">
                La plataforma legal más transparente de Chile.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-white/60 hover:text-[#F2C94C] transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-white/60 hover:text-[#F2C94C] transition-colors">
                    Cómo Funciona
                  </a>
                </li>
                <li>
                  <Link href="/register" className="text-white/60 hover:text-[#F2C94C] transition-colors">
                    Registrarse
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/60 hover:text-[#F2C94C] transition-colors">
                    Términos de Servicio
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-[#F2C94C] transition-colors">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-[#F2C94C] transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/60">
                  <Mail size={16} />
                  contacto@neife.cl
                </li>
                <li className="flex items-center gap-2 text-white/60">
                  <Phone size={16} />
                  +56 2 2345 6789
                </li>
                <li className="flex items-center gap-2 text-white/60">
                  <MapPin size={16} />
                  Santiago, Chile
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[#5E8B8C]/30 text-center text-white/40">
            <p>&copy; 2024 NEIFE. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
