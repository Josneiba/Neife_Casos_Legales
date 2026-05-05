/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Evita que el navegador adivine el tipo MIME
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Evita que la página se embeba en iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Controla qué información de referrer se comparte
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permisos de APIs del navegador
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy básico
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requiere unsafe-eval en dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.anthropic.com",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // HSTS — forzar HTTPS por 1 año (solo activar en producción)
          // { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ]
  },
}

export default nextConfig
