import Link from 'next/link';
import AnnouncementForm from '@/components/admin/AnnouncementForm';

export default function NewAnnouncementPage() {
  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/announcements" className="hover:text-[#3FAE2A]">Announcements</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">New Announcement</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">New Announcement</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Write and publish an official update for all Pergas members.
        </p>
      </div>
      <AnnouncementForm />
    </div>
  );
}
