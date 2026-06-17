"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  category: string;
  capacity: string;
  external_rsvp_url: string;
  image_url: string;
  status: 'draft' | 'published' | 'archived';
}

const EMPTY: EventFormData = {
  title: '',
  description: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  category: 'General',
  capacity: '',
  external_rsvp_url: '',
  image_url: '',
  status: 'draft',
};

const CATEGORIES = ['General', 'Workshop', 'AGM', 'Appreciation', 'Community Service', 'Seminar', 'Conference', 'Other'];

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  eventId?: string; // if provided → edit mode
}

export default function EventForm({ initialData, eventId }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormData>({ ...EMPTY, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof EventFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    };

    const url = eventId ? `/api/admin/events/${eventId}` : '/api/admin/events';
    const method = eventId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/events');
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? 'Failed to save event.');
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
            Event Details
          </h3>
          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
            Provide the necessary details for the upcoming event.
          </p>
        </div>

        <div className="p-8 space-y-6" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
          
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Event Title <span className="text-red-500">*</span></label>
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Tadabbur Al-Quran Workshop 2026"
              className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Brief description of the event..."
              className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 resize-y"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Date <span className="text-red-500">*</span></label>
              <input
                required
                type="date"
                value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => set('start_time', e.target.value)}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => set('end_time', e.target.value)}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
              />
            </div>
          </div>

          {/* Venue & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Venue</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <input
                  value={form.venue}
                  onChange={(e) => set('venue', e.target.value)}
                  placeholder="e.g. Masjid Sultan, North Bridge Rd"
                  className="h-11 pl-10 pr-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Capacity</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <input
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(e) => set('capacity', e.target.value)}
                  placeholder="e.g. 100"
                  className="h-11 pl-10 pr-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onChange={(e) => set('status', e.target.value as EventFormData['status'])}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer appearance-none"
              >
                <option value="draft">Draft — hidden from members</option>
                <option value="published">Published — visible to all</option>
                <option value="archived">Archived — removed from feed</option>
              </select>
            </div>
          </div>

          {/* External RSVP URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              External RSVP URL <span className="text-gray-400 font-normal ml-1">(Zoho Backstage link)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              </div>
              <input
                type="url"
                value={form.external_rsvp_url}
                onChange={(e) => set('external_rsvp_url', e.target.value)}
                placeholder="https://pergas.backstage.world/..."
                className="h-11 pl-10 pr-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Banner Image URL <span className="text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
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
            onClick={() => router.push('/admin/events')}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-[#3FAE2A] hover:bg-[#35941f] shadow-md shadow-[#3FAE2A]/20 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
          >
            {saving ? 'Processing...' : eventId ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </form>
  );
}
