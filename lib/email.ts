/**
 * Correos transaccionales vía Resend (https://resend.com).
 * Sin RESEND_API_KEY no se envía nada (desarrollo / staging).
 */

export async function sendTransactionalEmail(opts: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { skipped: true as const }
  }

  const from =
    process.env.RESEND_FROM ?? "Neife <onboarding@resend.dev>"

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return { error: `Resend ${res.status}: ${text}` as const }
  }

  return { sent: true as const }
}
