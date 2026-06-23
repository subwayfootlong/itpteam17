import "./pergas-admin.css";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { ToastProvider } from "@/components/ui/Toast";
import SessionTimeout from "@/components/SessionTimeout";
import { getVerifiedAdmin } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getVerifiedAdmin();

  if (!admin) {
    redirect("/?screen=login");
  }

  return (
    <ToastProvider>
      <SessionTimeout />
      <div className="flex h-screen bg-[#f0f4f0] overflow-hidden">
        <AdminSidebar adminName={admin.fullName} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminTopbar
            adminName={admin.fullName}
            adminEmail={admin.email ?? ""}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
