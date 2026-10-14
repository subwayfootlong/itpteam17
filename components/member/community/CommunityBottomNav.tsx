import NavLink from "@/components/ui/NavLink";
import MemberIcon from "@/components/member/MemberIcon";

export default function CommunityBottomNav() {
  return (
    <nav className="community-bottom-nav" aria-label="Mobile navigation">
      <NavLink href="/member">
        <MemberIcon name="home" size={23} />
        Home
      </NavLink>
      <NavLink href="/member/events">
        <MemberIcon name="calendar" size={23} />
        Events
      </NavLink>
      <NavLink href="/member/benefit">
        <MemberIcon name="card" size={23} />
        Benefits
      </NavLink>
      <NavLink className="is-active" href="/member/community" aria-current="page">
        <MemberIcon name="message" size={23} />
        Community
      </NavLink>
      <NavLink href="/member/profile">
        <MemberIcon name="user" size={23} />
        Profile
      </NavLink>
    </nav>
  );
}
