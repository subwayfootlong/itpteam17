"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import AnnouncementForm, { AnnouncementFormData } from '@/components/admin/AnnouncementForm';
import AnnouncementMetricsCard from '@/components/admin/AnnouncementMetricsCard';
import AnnouncementPollCard from '@/components/admin/AnnouncementPollCard';

export default function EditAnnouncementPage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<AnnouncementFormData> | null>(null);
  const [liveForm, setLiveForm] = useState<AnnouncementFormData | null>(null);
  const [metrics, setMetrics] = useState({ views: 0, clicks: 0, reactions: 0 });
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
          poll_enabled: Boolean(a.poll_enabled),
          poll_question: a.poll_question ?? '',
          audience_type: a.audience_type === 'selected_tiers' ? 'selected_tiers' : 'all',
          eligible_tiers: Array.isArray(a.eligible_tiers) ? a.eligible_tiers : [],
          show_locked_preview: false,
        });
        
        // Extract metrics (assuming API returns these fields)
        setMetrics({
          views: a.view_count || 0,
          clicks: a.click_count || 0,
          reactions: a.announcement_comments ? a.announcement_comments[0]?.count || 0 : 0,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingState label="Loading announcement…" className="h-64" />;
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
    <div className="space-y-5 pb-12">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/announcements" className="hover:text-[#3FAE2A]">Announcements</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Edit</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Edit Announcement</h2>
        <p className="text-gray-500 text-sm mt-0.5">Update the announcement content or change its publish status.</p>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full xl:flex-1">
          {initialData && (
            <AnnouncementForm
              initialData={initialData}
              announcementId={id}
              onFormChange={setLiveForm}
            />
          )}
        </div>
        <div className="w-full xl:w-[400px] shrink-0 xl:sticky xl:top-6 flex flex-col gap-6">
          <AnnouncementMetricsCard metrics={metrics} />
          {liveForm?.poll_enabled && (
            <AnnouncementPollCard
              announcementId={id}
              pollQuestion={liveForm.poll_question || 'Will you be attending?'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
