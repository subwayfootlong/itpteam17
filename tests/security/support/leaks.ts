// Patterns that must never appear in a response the client receives (SNFR-03).

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "stack frame", re: /\n\s+at [^\n]+\(|\bat (?:async )?[\w.<>]+ \([^)]*:\d+:\d+\)/ },
  { name: "file path", re: /[A-Za-z]:\\\\?[\w\\ .-]+\.(?:t|j)sx?|\/(?:home|Users|var|app)\/[\w/.-]+\.(?:t|j)sx?/ },
  { name: "node_modules", re: /node_modules/ },
  // Server build paths only; "/_next/static" asset URLs and "__next_f" page data are in every page by design.
  { name: "Next.js server internals", re: /\.next[\\/]server|webpack-internal:/ },
  { name: "PostgREST error code", re: /\bPGRST\d+/ },
  { name: "Postgres error", re: /\b(?:postgres(?:ql)?|duplicate key value|violates (?:foreign key|unique|check|not-null)|relation "[^"]+"|syntax error at or near|column "[^"]+" (?:does not exist|of relation))/i },
  { name: "Supabase URL", re: /\.supabase\.co/ },
  { name: "secret variable name", re: /\b(?:SUPABASE_SERVICE_ROLE_KEY|JWT_SECRET|MEMBERSHIP_QR_SECRET|EMAIL_CHANGE_SECRET|SMTP_PASSWORD|TRANSACTIONAL_EMAIL_WORKER_SECRET|EMAIL_NOTIFICATION_CRON_SECRET)\b/ },
  { name: "error class name", re: /\b(?:TypeError|ReferenceError|SyntaxError|PostgrestError|JsonWebTokenError|TokenExpiredError):/ },
];

const SECRET_ENV = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "MEMBERSHIP_QR_SECRET",
  "EMAIL_CHANGE_SECRET",
  "EMAIL_NOTIFICATION_CRON_SECRET",
  "TRANSACTIONAL_EMAIL_WORKER_SECRET",
  "SMTP_PASSWORD",
];

/** Returns the names of every leak pattern found in `text` (empty array = clean). */
export function findLeaks(text: string): string[] {
  const found = PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
  for (const name of SECRET_ENV) {
    const value = process.env[name];
    if (value && value.length >= 16 && text.includes(value)) found.push(`value of ${name}`);
  }
  return found;
}
