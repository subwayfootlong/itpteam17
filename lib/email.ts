// Server-only credentials; never import this module into a client component.
export async function sendEmail(to: string, subject: string, text: string, id: string) {
  if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_FROM) throw new Error("Email provider is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": id },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Email delivery failed");
}
