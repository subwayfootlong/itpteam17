import Link from "next/link";
import MemberIcon from "@/components/member/MemberIcon";

export default function CommunityBottomNav() {
  return (
    <nav className="community-bottom-nav" aria-label="Mobile navigation">
      <Link href="/member">
        <MemberIcon name="home" size={23} />
        Home
      </Link>
      <Link href="/member/events">
        <MemberIcon name="calendar" size={23} />
        Events
      </Link>
      <Link href="/member/benefit">
        <MemberIcon name="card" size={23} />
        Benefits
      </Link>
      <Link className="is-active" href="/member/community" aria-current="page">
        <MemberIcon name="message" size={23} />
        Community
      </Link>
      <Link href="/member/profile">
        <MemberIcon name="user" size={23} />
        Profile
      </Link>
    </nav>
  );
}
