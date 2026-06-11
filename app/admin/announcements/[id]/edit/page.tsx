"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AnnouncementForm, { AnnouncementFormData } from '@/components/admin/AnnouncementForm';

export default function EditAnnouncementPage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<AnnouncementFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/announcements/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.announcement) { setNotFound(true); return; }
        const a = d.announcement;
        setInitialData({
          title: a.title ?? '',
          content: a.content ?? '',
          category: a.category ?? 'General',
          image_url: a.image_url ?? '',
          status: a.status ?? 'draft',
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20 text-gray-400">
        Announcement not found.{' '}
        <Link href="/admin/announcements" className="text-[#3FAE2A] hover:underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/announcements" className="hover:text-[#3FAE2A]">Announcements</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Edit</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Edit Announcement</h2>
        <p className="text-gray-500 text-sm mt-0.5">Update the announcement content or change its publish status.</p>
      </div>
      {initialData && <AnnouncementForm initialData={initialData} announcementId={id} />}
    </div>
  );
}
