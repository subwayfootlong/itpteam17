"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, QrCode } from "lucide-react";
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
    if (!method.paynowUen) return;
    try {
      await navigator.clipboard.writeText(method.paynowUen);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; ignore.
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="member-text-base text-base font-bold text-[#151C27]">{method.name}</p>
      {method.description && (
        <p className="member-text-sm mt-1 text-sm text-[#5F5E5E]">{method.description}</p>
      )}

      {method.qrCodeUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={method.qrCodeUrl}
          alt={`${method.name} QR code`}
          className="mx-auto mt-5 h-56 w-56 rounded-xl border border-gray-100 object-contain p-3"
        />
      )}

      {method.paynowUen && (
        <div className="mt-5">
          <p className="member-text-sm text-sm font-semibold uppercase text-[#5F5E5E]">
            PayNow UEN
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#EEF1FF] px-4 py-3">
            <span className="member-text-base font-mono text-base font-semibold text-[#151C27]">
              {method.paynowUen}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#0F6E00] shadow-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
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
        <Link href="/member/profile" aria-label="Back to profile">
          <ArrowLeft size={24} className="text-[#0F6E00]" />
        </Link>
        <h1 className="member-text-2xl text-2xl font-bold text-[#0F6E00]">Make Payment</h1>
      </header>

      <section
        className={`mt-6 rounded-2xl border p-5 ${
          expiryInfo.urgency === "none"
            ? "border-gray-200 bg-[#EEF1FF]"
            : "border-[#F5D9A8] bg-[#FFF8EE]"
        }`}
      >
        <h2 className="member-text-lg font-semibold text-[#151C27]">{copy.title}</h2>
        <p className="member-text-sm mt-2 text-[#5F5E5E]">{copy.body}</p>
        {expiryDate && (
          <p className="member-text-sm mt-3 font-semibold text-[#151C27]">
            Membership {expiryInfo.urgency === "expired" ? "expired" : "valid until"}:{" "}
            {formatMemberDate(expiryDate)}
          </p>
        )}
      </section>

      {loadError && (
        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      )}

      {!loadError && paymentMethods.length === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <QrCode size={32} className="text-gray-300" />
          <p className="member-text-base mt-3 font-semibold text-[#151C27]">
            Payment details are not available yet
          </p>
          <p className="member-text-sm mt-1 text-sm text-[#5F5E5E]">
            Please check back later or contact Pergas for renewal instructions.
          </p>
        </div>
      )}

      {paymentMethods.map((method) => (
        <PaymentMethodCard key={method.id} method={method} />
      ))}

      <p className="member-text-xs mt-6 text-xs text-gray-400">
        After paying, your renewal may take a few working days to reflect on your account.
        Contact Pergas if your membership status doesn&apos;t update.
      </p>
    </div>
  );
}
