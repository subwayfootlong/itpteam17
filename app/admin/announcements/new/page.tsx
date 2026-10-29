import AnnouncementForm from '@/components/admin/AnnouncementForm';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export default function NewAnnouncementPage() {
  return (
    <div className="space-y-5">
      <AdminBreadcrumbs items={[{ label: 'Announcements', href: '/admin/announcements' }, { label: 'New Announcement' }]} />
      <div>
        <h2 className="text-2xl font-bold text-gray-800">New Announcement</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Write and publish an official update for all Pergas members.
        </p>
      </div>
      <div className="max-w-4xl">
        <AnnouncementForm />
      </div>
    </div>
  );
}
