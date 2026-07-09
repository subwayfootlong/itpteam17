"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import EventForm, { EventFormData } from '@/components/admin/EventForm';
import RegisteredUsersCard from '@/components/admin/RegisteredUsersCard';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<EventFormData> & { capacity_num?: number | null, spots_available?: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.event) { setNotFound(true); return; }
        const ev = d.event;
        setInitialData({
          title: ev.title ?? '',
          description: ev.description ?? '',
          event_date: ev.event_date ?? '',
          start_time: ev.start_time ?? '',
          end_time: ev.end_time ?? '',
          venue: ev.venue ?? '',
          category: ev.category ?? 'General',
          capacity: ev.capacity != null ? String(ev.capacity) : '',
          external_rsvp_url: ev.external_rsvp_url ?? '',
          image_url: ev.image_url ?? '',
          status: ev.status ?? 'draft',
          capacity_num: ev.capacity,
          spots_available: ev.spots_available,
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
        Event not found.{' '}
        <Link href="/admin/events" className="text-[#3FAE2A] hover:underline">Back to events</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-[#3FAE2A]">Events</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Edit Event</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Edit Event</h2>
        <p className="text-gray-500 text-sm mt-0.5">Update event details. Changes save immediately.</p>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full xl:flex-1">
          {initialData && <EventForm initialData={initialData} eventId={id} />}
        </div>
        <div className="w-full xl:w-[400px] shrink-0 xl:sticky xl:top-6">
          {initialData && (
            <RegisteredUsersCard 
              eventId={id} 
              capacity={initialData.capacity_num ?? null} 
              spotsAvailable={initialData.spots_available ?? null} 
              externalRsvpUrl={initialData.external_rsvp_url ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
