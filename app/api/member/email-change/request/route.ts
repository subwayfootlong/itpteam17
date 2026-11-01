import { unexpectedApiError } from "@/lib/serverErrors";
import { handleEmailChange } from "@/lib/emailChangeServer";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try { return handleEmailChange(req, "request");
  } catch (error) {
    return unexpectedApiError("app/api/member/email-change/request/route.POST", error);
  }
}
