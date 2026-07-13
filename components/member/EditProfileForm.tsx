"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import MemberAvatar from "@/components/member/MemberAvatar";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
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
    <div className="px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/member/profile" aria-label="Back to profile">
          <ArrowLeft size={24} className="text-[#0F6E00]" />
        </Link>
        <h1 className="member-text-2xl text-2xl font-bold text-[#0F6E00]">Edit Profile</h1>
      </header>

      <section className="mt-8 flex flex-col items-center text-center">
        <MemberAvatar
          firstName={initial.first_name}
          lastName={initial.last_name}
          email={initial.email}
          profileImageUrl={initial.profile_image_url}
          size={96}
          className="shadow-sm"
        />

        <h2 className="member-text-2xl mt-3 text-2xl font-bold text-[#151C27]">
          {formatMemberName(initial, "Member")}
        </h2>
      </section>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Select
          label="Salutation"
          value={salutation}
          onChange={(e) => setSalutation(e.target.value)}
          options={SALUTATIONS}
          placeholder="Select salutation"
          required
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

        {error ? (
          <p className="member-text-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/member/profile"
            className="member-text-base flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-[#151C27]"
          >
            Cancel
          </Link>
          <Button type="submit" loading={saving} disabled={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
