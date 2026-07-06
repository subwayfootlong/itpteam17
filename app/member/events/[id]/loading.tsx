import MemberPageShell from "@/components/member/MemberPageShell";

export default function Loading() {
  return (
    <MemberPageShell showTopBar={false}>
      <div className="px-5 py-6">
        <div className="h-8 w-40 rounded-full bg-[#E8F4E6]" />

        <div className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(18,44,22,0.1)]">
          <div className="h-64 animate-pulse bg-gray-200" />

          <div className="space-y-4 p-6">
            <div className="h-10 w-3/4 animate-pulse rounded-xl bg-[#EAEFEB]" />
            <div className="h-5 w-full animate-pulse rounded-xl bg-[#F1F4F0]" />
            <div className="h-5 w-5/6 animate-pulse rounded-xl bg-[#F1F4F0]" />

            <div className="space-y-3 pt-2">
              <div className="h-20 animate-pulse rounded-2xl bg-[#F7FAF6]" />
              <div className="h-20 animate-pulse rounded-2xl bg-[#F7FAF6]" />
              <div className="h-20 animate-pulse rounded-2xl bg-[#F7FAF6]" />
            </div>

            <div className="h-14 animate-pulse rounded-2xl bg-[#D5E9D1]" />
          </div>
        </div>
      </div>
    </MemberPageShell>
  );
}
