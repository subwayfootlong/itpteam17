import Link from "next/link";
import MemberIcon from "@/components/member/MemberIcon";

export default function MobileHeader({
  title,
  canGoBack,
  onBack,
}: {
  title: string;
  canGoBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <header className="community-header">
      <div className="community-header__identity">
        {canGoBack ? (
          <button
            className="community-icon-button"
            type="button"
            onClick={onBack}
            aria-label="Go back"
          >
            <MemberIcon name="back" size={24} />
          </button>
        ) : (
          <span className="community-avatar" aria-hidden="true">
            AK
          </span>
        )}
        <h1>{title}</h1>
      </div>
      <Link
        className="community-icon-button"
        href="/member/notifications"
        aria-label="Notifications"
      >
        <MemberIcon name={canGoBack ? "search" : "bell"} size={23} />
      </Link>
    </header>
  );
}
