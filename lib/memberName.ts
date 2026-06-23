export type MemberNameFields = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export function formatMemberName(
  member: MemberNameFields,
  fallback = "Member"
): string {
  const name = [member.first_name, member.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (name) return name;
  if (member.email?.trim()) return member.email.trim();
  return fallback;
}

export function memberNameInitial(member: MemberNameFields): string {
  const source = member.first_name?.trim() || member.email?.trim() || "M";
  return source.charAt(0).toUpperCase();
}

export function memberInitials(member: MemberNameFields): string {
  const first = member.first_name?.trim().charAt(0) ?? "";
  const last = member.last_name?.trim().charAt(0) ?? "";
  const combined = `${first}${last}`.toUpperCase();
  return combined || memberNameInitial(member);
}

export { formatMemberDate } from "./dates";
