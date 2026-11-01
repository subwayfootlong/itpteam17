"use client";

export default function ErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="font-serif text-2xl">Something went wrong</h1>
      <p className="mt-4">We couldn’t load this page. Please try again.</p>
      <button className="mt-6 rounded-lg bg-brand-primary px-5 py-2 text-white" onClick={unstable_retry}>
        Try again
      </button>
    </main>
  );
}
