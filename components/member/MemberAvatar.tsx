"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { memberInitials } from "@/lib/memberName";

type MemberAvatarProps = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  size?: number;
  className?: string;
};

export default function MemberAvatar({
  firstName,
  lastName,
  email,
  profileImageUrl,
  size = 44,
  className = "",
}: MemberAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const imageFailed = Boolean(
    profileImageUrl && failedImageUrl === profileImageUrl,
  );

  const initials = memberInitials({
    first_name: firstName,
    last_name: lastName,
    email,
  });

  const accessibleName =
    [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ") ||
    email?.trim() ||
    "Member";

  if (profileImageUrl && !imageFailed) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-gray-200 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profileImageUrl}
          alt={`${accessibleName} profile picture`}
          className="h-full w-full object-cover"
          onError={() => setFailedImageUrl(profileImageUrl)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-[#CFE8C8] bg-[#EAF6E7] font-bold text-[#0F6E00] ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(14, Math.round(size * 0.32)),
      }}
      role="img"
      aria-label={`${accessibleName} profile avatar`}
      title={accessibleName}
    >
      {initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserRound aria-hidden="true" />
      )}
    </div>
  );
}
