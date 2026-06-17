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
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-12">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 
            className="text-lg font-bold text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Announcement Details
          </h3>
          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
            Fill in the information below to create or update an announcement.
          </p>
        </div>

        <div className="p-8 space-y-6" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
              <input
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. AGM Pre-Read Materials Now Available"
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer appearance-none"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Publish Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as AnnouncementFormData['status'])}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer appearance-none"
              >
                <option value="draft">Draft — hidden from members</option>
                <option value="published">Published — visible to all</option>
                <option value="archived">Archived — removed from feed</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Content <span className="text-red-500">*</span></label>
            <textarea
              required
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={8}
              placeholder="Write your announcement details here..."
              className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 resize-y"
            />
            <div className="text-xs text-gray-400 text-right">{form.content.length} characters</div>
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Cover Image URL <span className="text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              </div>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-11 pl-10 pr-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-4" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
          <button
            type="button"
            onClick={() => router.push('/admin/announcements')}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-[#3FAE2A] hover:bg-[#35941f] shadow-md shadow-[#3FAE2A]/20 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
          >
            {saving ? 'Processing...' : announcementId ? 'Save Changes' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </form>
  );
}
