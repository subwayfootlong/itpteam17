"use client";

import { useState } from "react";
import NavLink from "@/components/ui/NavLink";
import { ArrowLeft, Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { formatMemberDate, getExpiryInfo } from "@/lib/dates";
import type { PublicPaymentMethod } from "@/lib/paymentMethods";

const URGENCY_COPY: Record<string, { title: string; body: string }> = {
  expired: {
    title: "Your membership has expired",
    body: "Renew now to keep enjoying member benefits and events.",
  },
  critical: {
    title: "Your membership is expiring soon",
    body: "Renew now so your access doesn't lapse.",
  },
  warning: {
    title: "Time to renew your membership",
    body: "Your membership is coming up for renewal.",
  },
  none: {
    title: "Make a payment",
    body: "Use any of the methods below to pay Pergas.",
  },
};

function PaymentMethodCard({ method }: { method: PublicPaymentMethod }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!method.paymentUrl) return;
    try {
      await navigator.clipboard.writeText(method.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; ignore.
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 member-dark:border-member-border bg-white member-dark:bg-member-surface p-6 shadow-sm">
      <p className="member-text-base text-base font-bold text-[#151C27] member-dark:text-neutral-100">{method.name}</p>
      {method.description && (
        <p className="member-text-sm mt-1 text-sm text-[#5F5E5E] member-dark:text-neutral-300">{method.description}</p>
      )}

      {method.qrCodeUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={method.qrCodeUrl}
          alt={`${method.name} QR code`}
          className="mx-auto mt-5 h-56 w-56 rounded-xl border border-gray-100 member-dark:border-member-border bg-white object-contain p-3"
        />
      )}

      {method.paymentUrl && (
        <div className="mt-5">
          <a
            href={method.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="member-text-base flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E00] px-4 py-3 text-base font-semibold text-white shadow-sm"
          >
            Pay now
            <ExternalLink size={18} />
          </a>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 member-dark:border-member-border bg-[#EEF1FF] member-dark:bg-member-raised px-4 py-3">
            <span className="member-text-sm min-w-0 truncate text-sm text-[#151C27] member-dark:text-neutral-100">
              {method.paymentUrl.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white member-dark:bg-member-surface px-3 py-1.5 text-sm font-semibold text-[#0F6E00] member-dark:text-brand-primary-200 shadow-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberPaymentView({
  expiryDate,
  paymentMethods,
  loadError,
}: {
  expiryDate: string | null;
  paymentMethods: PublicPaymentMethod[];
  loadError?: string;
}) {
  const expiryInfo = getExpiryInfo(expiryDate);
  const copy = URGENCY_COPY[expiryInfo.urgency] ?? URGENCY_COPY.none;

  return (
    <div className="px-5 py-6">
      <header className="flex items-center gap-3">
        <NavLink href="/member/profile" aria-label="Back to profile">
          <ArrowLeft size={24} className="text-[#0F6E00] member-dark:text-brand-primary-200" />
        </NavLink>
        <h1 className="member-text-2xl text-2xl font-bold text-[#0F6E00] member-dark:text-brand-primary-200">Make Payment</h1>
      </header>

      <section
        className={`mt-6 rounded-2xl border p-5 ${
          expiryInfo.urgency === "none"
            ? "border-gray-200 member-dark:border-member-border bg-[#EEF1FF] member-dark:bg-member-raised"
            : "border-[#F5D9A8] bg-[#FFF8EE] member-dark:bg-member-raised"
        }`}
      >
        <h2 className="member-text-lg font-semibold text-[#151C27] member-dark:text-neutral-100">{copy.title}</h2>
        <p className="member-text-sm mt-2 text-[#5F5E5E] member-dark:text-neutral-300">{copy.body}</p>
        {expiryDate && (
          <p className="member-text-sm mt-3 font-semibold text-[#151C27] member-dark:text-neutral-100">
            Membership {expiryInfo.urgency === "expired" ? "expired" : "valid until"}:{" "}
            {formatMemberDate(expiryDate)}
          </p>
        )}
      </section>

      {loadError && (
        <div className="mt-6 rounded-xl border border-red-100 member-dark:border-red-800 bg-red-50 member-dark:bg-red-950 px-4 py-3 text-sm font-medium text-red-700 member-dark:text-red-300">
          {loadError}
        </div>
      )}

      {!loadError && paymentMethods.length === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 member-dark:border-member-border bg-white member-dark:bg-member-surface px-6 py-12 text-center">
          <QrCode size={32} className="text-gray-300 member-dark:text-neutral-400" />
          <p className="member-text-base mt-3 font-semibold text-[#151C27] member-dark:text-neutral-100">
            Payment details are not available yet
          </p>
          <p className="member-text-sm mt-1 text-sm text-[#5F5E5E] member-dark:text-neutral-300">
            Please check back later or contact Pergas for renewal instructions.
          </p>
        </div>
      )}

      {paymentMethods.map((method) => (
        <PaymentMethodCard key={method.id} method={method} />
      ))}

      <p className="member-text-xs mt-6 text-xs text-gray-400 member-dark:text-neutral-400">
        After paying, your renewal may take a few working days to reflect on your account.
        Contact Pergas if your membership status doesn&apos;t update.
      </p>
    </div>
  );
}
