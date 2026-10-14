import LoadingSpinner from "@/components/ui/LoadingSpinner";

/**
 * Full-screen "working on it" state for moments where the whole screen is
 * about to change (signing in, signing out). It blocks further taps and gives
 * a clear message so the app never looks frozen.
 */
export default function FullScreenLoader({
  title,
  message,
  slowMessage,
  showSlowMessage = false,
}: {
  title: string;
  message?: string;
  /** Reassurance shown when the wait is longer than usual */
  slowMessage?: string;
  showSlowMessage?: boolean;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={title}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/95 px-8 text-center backdrop-blur-sm"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary-50 ring-1 ring-brand-primary-100">
        <LoadingSpinner label="" size="lg" />
      </span>

      <h2 className="mt-6 font-butler text-xl font-semibold text-neutral-950">
        {title}
      </h2>
      {message && (
        <p className="mt-1.5 max-w-xs text-sm text-neutral-600">{message}</p>
      )}

      <p
        aria-live="polite"
        className={`mt-4 max-w-xs text-xs text-neutral-500 transition-opacity duration-300 ${
          showSlowMessage ? "opacity-100" : "opacity-0"
        }`}
      >
        {slowMessage}
      </p>
    </div>
  );
}
