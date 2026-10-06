"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import MemberAvatar from "@/components/member/MemberAvatar";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PhoneInputField from "@/components/ui/PhoneInput";
import { formatMemberName } from "@/lib/memberName";
import { SALUTATIONS } from "@/lib/memberProfileOptions";

export type EditProfileInitial = {
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  arabic_name: string | null;
  phone: string | null;
  organization: string | null;
  designation: string | null;
  profile_image_url: string | null;
};

export default function EditProfileForm({ initial }: { initial: EditProfileInitial }) {
  const router = useRouter();

  const [salutation, setSalutation] = useState(initial.salutation ?? "");
  const [firstName, setFirstName] = useState(initial.first_name ?? "");
  const [lastName, setLastName] = useState(initial.last_name ?? "");
  const [arabicName, setArabicName] = useState(initial.arabic_name ?? "");
  const [phone, setPhone] = useState<string | undefined>(initial.phone ?? undefined);
  const [organization, setOrganization] = useState(initial.organization ?? "");
  const [designation, setDesignation] = useState(initial.designation ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salutation,
          first_name: firstName,
          last_name: lastName,
          arabic_name: arabicName,
          phone,
          organization,
          designation,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string" ? result.error : "Unable to save your profile.",
        );
      }

      router.push("/member/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your profile.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 px-4 py-5 font-helvetica">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/member/profile"
          aria-label="Back to profile"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200/70 active:scale-95"
        >
          <ArrowLeft size={20} className="text-[#0F6E00]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Edit Profile</h1>
          <p className="text-xs text-neutral-500">Update your details and organization info</p>
        </div>
      </header>

      {/* Avatar Card */}
      <section className="flex flex-col items-center rounded-2xl border border-neutral-200/70 bg-white p-5 text-center shadow-xs">
        <div className="relative">
          <MemberAvatar
            firstName={initial.first_name}
            lastName={initial.last_name}
            email={initial.email}
            profileImageUrl={initial.profile_image_url}
            size={88}
            className="ring-4 ring-[#E8F4E6] shadow-sm"
          />
        </div>

        <h2 className="mt-3 text-lg font-bold text-neutral-900">
          {formatMemberName(initial, "Member")}
        </h2>
        <p className="text-xs text-neutral-500">{initial.email}</p>
      </section>

      {/* Form Fields Card */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-xs space-y-4">
          <Select
            label="Salutation"
            value={salutation}
            onChange={(e) => setSalutation(e.target.value)}
            options={SALUTATIONS}
            placeholder="Select salutation"
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>

          <Input
            label="Arabic Name"
            value={arabicName}
            onChange={(e) => setArabicName(e.target.value)}
            placeholder="Optional"
            dir="rtl"
          />

          <PhoneInputField
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            required
          />

          <Input
            label="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Your organization"
            required
          />

          <Input
            label="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Your role or title"
            required
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link
            href="/member/profile"
            className="flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-2xs transition-all hover:bg-neutral-50 active:scale-[0.98]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0F6E00] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#173F14] active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
          >
            <Save size={16} className="text-white" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
