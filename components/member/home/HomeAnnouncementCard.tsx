import Link from "next/link";
import { Megaphone } from "lucide-react";

type HomeAnnouncementCardProps = {
  announcement: {
    id: string;
    title: string;
    content: string;
  };
};

export default function HomeAnnouncementCard({
  announcement,
}: HomeAnnouncementCardProps) {
  return (
    <section className="mt-8 rounded-xl border border-[#D9E8D7] bg-[#F3FAF2] p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[#DDF3D9] p-2 text-[#0F6E00]">
          <Megaphone size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="member-text-xs font-semibold uppercase tracking-wide text-[#0F6E00]">
            Latest announcement
          </p>

          <h2 className="member-text-lg mt-2 font-semibold text-[#151C27]">
            {announcement.title}
          </h2>

          <p className="member-text-sm mt-2 line-clamp-2 text-[#5F5E5E]">
            {announcement.content}
          </p>

          <Link
            href="/member/community?tab=announcements"
            className="member-text-sm mt-4 inline-block font-semibold text-[#0F6E00]"
          >
            Read more
          </Link>
        </div>
      </div>
    </section>
  );
}
