import Link from 'next/link';
import EventForm from '@/components/admin/EventForm';

export default function NewEventPage() {
  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-[#3FAE2A]">Events</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Create New Event</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Create New Event</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Add a new programme or seminar. Set status to <strong>Published</strong> to make it visible to members.
        </p>
      </div>
      <EventForm />
    </div>
  );
}
