import "server-only";
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";

// Temporary SMTP delivery for ITP2 development/demo. Credentials stay server-side.
export async function sendEmail(to: string, subject: string, text: string, id: string) {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM?.trim();
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !from) {
    throw new Error("SMTP email provider is not configured");
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: true, // Port 587 must upgrade to STARTTLS before authentication.
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  try {
    const result = await transport.sendMail({
      from, to: [to], subject, text,
      // Stable identity for retries; SMTP does not guarantee deduplication.
      messageId: `<${createHash("sha256").update(id).digest("hex")}@email-change.pergas.invalid>`,
    });
    if (!result.accepted.length || result.rejected.length) throw new Error("Email delivery failed");
  } catch {
    // Do not propagate provider responses or authentication details to callers.
    throw new Error("Email delivery failed");
  } finally {
    transport.close();
  }
}

// Production option: Resend transactional email provider.
// Temporarily disabled for ITP2 development/demo.
// To restore, replace the SMTP sendEmail function above with this implementation
// and configure EMAIL_API_KEY and a verified EMAIL_FROM on the server.
/*
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
*/
