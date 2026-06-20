import Image from "next/image";
import { Bell } from "lucide-react";

export default function MemberTopBar() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-[#FFFFFF] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gray-200">
          <Image
            src="/profile-placeholder.jpg"
            alt="Member profile"
            fill
            className="object-cover"
            sizes="44px"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-[#0F6E00]">Pergas</h1>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="flex h-10 w-10 items-center justify-center text-[#5F5E5E]"
      >
        <Bell size={22} strokeWidth={2.2} />
      </button>
    </header>
  );
}