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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-800">Event Details</h3>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Event Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Tadabbur Al-Quran Workshop 2026"
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="Brief description of the event…"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] resize-none"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date *</label>
            <input
              required
              type="date"
              value={form.event_date}
              onChange={(e) => set('event_date', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => set('start_time', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">End Time</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => set('end_time', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
            />
          </div>
        </div>

        {/* Venue + Category + Capacity */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Venue</label>
            <input
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              placeholder="e.g. Masjid Sultan, North Bridge Rd"
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity</label>
            <input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              placeholder="e.g. 100"
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* External RSVP URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            External RSVP URL <span className="text-gray-400 normal-case font-normal">(Zoho Backstage link)</span>
          </label>
          <input
            type="url"
            value={form.external_rsvp_url}
            onChange={(e) => set('external_rsvp_url', e.target.value)}
            placeholder="https://pergas.backstage.world/…"
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
          />
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Banner Image URL</label>
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
              onChange={(e) => set('status', e.target.value as EventFormData['status'])}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
            >
              <option value="draft">Draft — not visible to members</option>
              <option value="published">Published — visible to members</option>
              <option value="archived">Archived — hidden from member view</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/events')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#3FAE2A] hover:bg-[#35941f] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : eventId ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
