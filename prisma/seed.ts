/**
 * Seed opcional: la base ya puede estar creada con `supabase/*.sql`.
 * Ejemplo: `npx prisma db seed` (requiere `tsx` o configurar en package.json).
 *
 * No inserta usuarios en auth.users; usa Prisma solo si necesitas datos de demo
 * vía SQL en el editor de Supabase o scripts administrados.
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Placeholder: añade aquí inserts controlados (p. ej. catálogos) si lo necesitas.
  console.log("Seed NEIFE: sin datos por defecto (evitar duplicar auth).")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
