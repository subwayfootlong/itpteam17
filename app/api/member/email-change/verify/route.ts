import { handleEmailChange } from "@/lib/emailChangeServer";
export const runtime = "nodejs";
export async function POST(req: Request) { return handleEmailChange(req, "verify"); }
