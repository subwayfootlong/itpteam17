import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminLoading() {
  return (
    <div
      className="flex min-h-[calc(100dvh-7.5rem)] items-center justify-center text-[#315d25]"
      aria-label="Loading admin page"
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner label="" size="lg" />
        <p className="text-sm font-medium text-gray-500">Loading page…</p>
      </div>
    </div>
  );
}
