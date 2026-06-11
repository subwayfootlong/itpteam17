"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AnnouncementFormData {
  title: string;
  content: string;
  category: string;
  image_url: string;
  status: 'draft' | 'published' | 'archived';
}

const EMPTY: AnnouncementFormData = {
  title: '',
  content: '',
  category: 'General',
  image_url: '',
  status: 'draft',
};

const CATEGORIES = ['General', 'Volunteer', 'Workshop', 'AGM', 'Community Service', 'Religious', 'Administrative'];

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormData>;
  announcementId?: string;
}

export default function AnnouncementForm({ initialData, announcementId }: AnnouncementFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AnnouncementFormData>({ ...EMPTY, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof AnnouncementFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = announcementId ? `/api/admin/announcements/${announcementId}` : '/api/admin/announcements';
    const method = announcementId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/announcements');
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? 'Failed to save.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-800">Announcement Details</h3>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. AGM Pre-Read Materials Now Available"
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Content *</label>
          <textarea
            required
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            rows={8}
            placeholder="Write your announcement here…"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] resize-y"
          />
          <div className="text-xs text-gray-400">{form.content.length} characters</div>
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Banner Image URL <span className="text-gray-400 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://…"
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
          />
        </div>
      </div>

      {/* Status + Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Publish Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as AnnouncementFormData['status'])}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
            >
              <option value="draft">Draft — not visible to members</option>
              <option value="published">Published — visible in member feed</option>
              <option value="archived">Archived — hidden from feed</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/announcements')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#3FAE2A] hover:bg-[#35941f] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : announcementId ? 'Save Changes' : 'Post Announcement'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
