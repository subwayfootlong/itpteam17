/**
 * DEV MODE LAYOUT — no authentication check.
 * Use this while building and testing the admin UI locally.
 *
 * When you are ready to add auth:
 *   1. Run the SQL migration (migration.sql)
 *   2. Replace this file with the real app/admin/layout.tsx (which reads cookies)
 *   3. Add middleware.ts to the project root
 *   4. Uncomment the auth guards in every /api/admin/** route
 */

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f0f4f0] overflow-hidden">
      <AdminSidebar adminName="Admin User" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopbar adminName="Admin User" adminEmail="admin@pergas.org.sg" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
