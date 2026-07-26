"use client";

import { useState } from "react";
import { ImageIcon, MapPin, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

export type BenefitFormData = {
  merchant_name: string;
  category: string;
  discount_description: string;
  discount_amount: string;
  address: string;
  description: string;
  image_url: string;
  logo_url: string;
  logo_initials: string;
  is_active: boolean;
};

const EMPTY_FORM: BenefitFormData = {
  merchant_name: "",
  category: "",
  discount_description: "",
  discount_amount: "",
  address: "",
  description: "",
  image_url: "",
  logo_url: "",
  logo_initials: "",
  is_active: true,
};

const CATEGORIES = [
  "Education",
  "Food & Dining",
  "Health & Wellness",
  "Lifestyle",
  "Retail",
  "Services",
  "Travel",
  "Other",
];

const inputClassName =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#3FAE2A] focus:bg-white focus:ring-4 focus:ring-[#3FAE2A]/10";

const textareaClassName =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#3FAE2A] focus:bg-white focus:ring-4 focus:ring-[#3FAE2A]/10 resize-y";

type MediaFieldProps = {
  label: string;
  helper: string;
  previewAlt: string;
  value: string;
  uploading: boolean;
  contain?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

function MediaField({
  label,
  helper,
  previewAlt,
  value,
  uploading,
  contain = false,
  onChange,
  onRemove,
}: MediaFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-sm font-semibold text-gray-700">
          {label}{" "}
          <span className="ml-1 font-normal text-gray-400">(Optional)</span>
        </label>
        <p className="mt-1 text-xs text-gray-400">{helper}</p>
      </div>

      <div className="relative">
        <ImageIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          disabled={uploading}
          className="h-11 w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50/50 pb-2 pl-10 pr-4 pt-2.5 text-sm text-gray-800 outline-none transition-all file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-[#3FAE2A] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white file:shadow-sm hover:file:bg-[#35941f] focus:border-[#3FAE2A] focus:bg-white focus:ring-4 focus:ring-[#3FAE2A]/10 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm font-medium text-[#3FAE2A]">
          <Upload aria-hidden="true" className="h-4 w-4 animate-pulse" />
          Uploading image...
        </div>
      )}

      {value && (
        <div className="relative mt-1 max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={previewAlt}
            className={`h-40 w-full bg-white ${contain ? "object-contain p-4" : "object-cover"}`}
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove ${label.toLowerCase()}`}
            title={`Remove ${label.toLowerCase()}`}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function BenefitForm() {
  const router = useRouter();
  const [form, setForm] = useState<BenefitFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<
    "image_url" | "logo_url" | null
  >(null);
  const [error, setError] = useState("");

  const set = <K extends keyof BenefitFormData>(
    field: K,
    value: BenefitFormData[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageUpload = async (
    field: "image_url" | "logo_url",
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingField(field);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || typeof result.url !== "string") {
        throw new Error(result.error ?? "Image upload failed.");
      }

      set(field, result.url);
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed.",
      );
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      merchant_name: form.merchant_name.trim(),
      category: form.category.trim(),
      discount_description: form.discount_description.trim(),
      discount_amount: form.discount_amount.trim() || null,
      address: form.address.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      logo_url: form.logo_url.trim() || null,
      logo_initials: form.logo_initials.trim() || null,
      is_active: form.is_active,
    };

    try {
      const response = await fetch("/api/admin/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.benefit) {
        throw new Error(result.error ?? "Unable to create benefit.");
      }

      router.push("/admin/engagement");
      router.refresh();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create benefit.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-12">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-5 sm:px-8">
          <h3
            className="text-lg font-bold text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Benefit Details
          </h3>
          <p
            className="mt-1 text-xs text-gray-500"
            style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
          >
            Provide the partner and offer information shown to Pergas members.
          </p>
        </div>

        <div
          className="space-y-6 p-5 sm:p-8"
          style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Merchant Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.merchant_name}
                onChange={(event) => set("merchant_name", event.target.value)}
                placeholder="e.g. Pergas Bookstore"
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                required
                list="benefit-category-options"
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
                placeholder="Enter or select a category"
                className={inputClassName}
              />
              <datalist id="benefit-category-options">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Discount Amount
              </label>
              <input
                value={form.discount_amount}
                onChange={(event) => set("discount_amount", event.target.value)}
                placeholder="e.g. 15% off"
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Logo Initials
              </label>
              <input
                maxLength={3}
                value={form.logo_initials}
                onChange={(event) =>
                  set(
                    "logo_initials",
                    event.target.value.toUpperCase().slice(0, 3),
                  )
                }
                placeholder="e.g. PB"
                className={`${inputClassName} uppercase`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Offer Details <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.discount_description}
              onChange={(event) =>
                set("discount_description", event.target.value)
              }
              placeholder="e.g. on selected religious books and learning materials"
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="Add redemption instructions or a short partner description..."
              className={textareaClassName}
            />
            <div className="text-right text-xs text-gray-400">
              {form.description.length} characters
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Merchant Address
            </label>
            <div className="relative">
              <MapPin
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.address}
                onChange={(event) => set("address", event.target.value)}
                placeholder="Leave blank for online redemption"
                className={`${inputClassName} pl-10`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MediaField
              label="Benefit Image"
              helper="Used as the main reward card visual. Maximum 5MB."
              previewAlt="Benefit preview"
              value={form.image_url}
              uploading={uploadingField === "image_url"}
              onChange={(event) => handleImageUpload("image_url", event)}
              onRemove={() => set("image_url", "")}
            />
            <MediaField
              label="Partner Logo"
              helper="Used as the merchant badge. Maximum 5MB."
              previewAlt="Partner logo preview"
              value={form.logo_url}
              uploading={uploadingField === "logo_url"}
              contain
              onChange={(event) => handleImageUpload("logo_url", event)}
              onRemove={() => set("logo_url", "")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Publish Status
            </label>
            <select
              value={form.is_active ? "active" : "inactive"}
              onChange={(event) =>
                set("is_active", event.target.value === "active")
              }
              className={`${inputClassName} cursor-pointer appearance-none`}
            >
              <option value="active">Active - visible to members</option>
              <option value="inactive">
                Inactive - hidden from members
              </option>
            </select>
          </div>
        </div>

        <div
          className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-5 sm:flex-row sm:items-center sm:px-8"
          style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
        >
          <button
            type="button"
            onClick={() => router.push("/admin/engagement")}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || Boolean(uploadingField)}
            className="rounded-xl bg-[#3FAE2A] px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-[#3FAE2A]/20 transition-all hover:bg-[#35941f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Processing..." : "Create Benefit"}
          </button>
        </div>
      </div>
    </form>
  );
}
