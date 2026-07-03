export function formatMemberDate(date: string | null | undefined): string {
  if (!date) return "Not available";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null): string {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDate(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export type ExpiryUrgency = "none" | "warning" | "critical" | "expired";

export function getExpiryInfo(expiryDate: string | null | undefined): {
  formatted: string;
  daysLeft: number | null;
  urgency: ExpiryUrgency;
  relativeLabel: string;
} {
  if (!expiryDate) {
    return { formatted: "—", daysLeft: null, urgency: "none", relativeLabel: "" };
  }

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = expiry.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return {
      formatted,
      daysLeft,
      urgency: "expired",
      relativeLabel: `expired ${daysAgo}d ago`,
    };
  }
  if (daysLeft === 0) {
    return { formatted, daysLeft, urgency: "critical", relativeLabel: "expires today" };
  }
  if (daysLeft <= 7) {
    return {
      formatted,
      daysLeft,
      urgency: "critical",
      relativeLabel: `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    };
  }
  if (daysLeft <= 30) {
    return { formatted, daysLeft, urgency: "warning", relativeLabel: `in ${daysLeft} days` };
  }
  return { formatted, daysLeft, urgency: "none", relativeLabel: `in ${daysLeft} days` };
}

export function timeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return "1 day ago";

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return "1 hour ago";

  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} mins ago`;
  if (interval === 1) return "1 min ago";

  return "just now";
}
