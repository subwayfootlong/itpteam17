import EventForm from '@/components/admin/EventForm';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export default function NewEventPage() {
  return (
    <div className="space-y-5">
      <AdminBreadcrumbs items={[{ label: 'Events', href: '/admin/events' }, { label: 'Create New Event' }]} />
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Create New Event</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Add a new programme or seminar. Set status to <strong>Published</strong> to make it visible to members.
        </p>
      </div>
      <div className="max-w-4xl">
        <EventForm />
      </div>
    </div>
  );
}
