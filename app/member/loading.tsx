export default function MemberLoading() {
  return (
    <main className="flex min-h-screen justify-center bg-white">
      <section className="min-h-screen w-full max-w-md bg-white px-5 py-6 font-helvetica">
        <div className="animate-pulse space-y-8">
          <section>
            <div className="h-10 w-56 rounded-xl bg-gray-200" />
            <div className="mt-3 h-6 w-64 rounded-xl bg-gray-100" />
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="mt-3 h-7 w-40 rounded bg-gray-200" />
            <div className="mt-4 h-4 w-52 rounded bg-gray-100" />
            <div className="mt-5 h-11 w-full rounded-xl bg-gray-200" />
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="mt-3 h-6 w-3/4 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-2/3 rounded bg-gray-100" />
            <div className="mt-5 h-11 w-full rounded-xl bg-gray-200" />
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="mt-3 h-6 w-2/3 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full rounded bg-gray-100" />
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
            <div className="mt-5 h-11 w-full rounded-xl bg-gray-200" />
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="mt-3 h-6 w-1/2 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full rounded bg-gray-100" />
            <div className="mt-2 h-4 w-4/5 rounded bg-gray-100" />
            <div className="mt-5 h-11 w-full rounded-xl bg-gray-200" />
          </section>
        </div>
      </section>
    </main>
  );
}
