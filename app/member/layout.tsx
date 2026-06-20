import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/");
  }

  try {
    verifyAccessToken(token);
  } catch {
    redirect("/");
  }

  return <>{children}</>;
}