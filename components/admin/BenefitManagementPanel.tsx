"use client";

import React, { useMemo, useState } from "react";
import { ActionButton } from "@/components/admin/ui/Button";
import { FilterPills } from "@/components/admin/ui/FilterPills";
import StatCard from "@/components/admin/ui/StatCard";
import {
  TableWrapper,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  useSortState,
} from "@/components/admin/ui/Table";
import { useToast } from "@/components/ui/Toast";
import type { AdminBenefit } from "@/lib/adminBenefits";

type BenefitFormState = {
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

type FilterValue = "all" | "active" | "inactive";

const EMPTY_FORM: BenefitFormState = {
  merchant_name: "",
  category: "Lifestyle",
  discount_description: "",
  discount_amount: "",
  address: "",
  description: "",
  image_url: "",
  logo_url: "",
  logo_initials: "",
  is_active: true,
};

const CATEGORY_OPTIONS = [
  "Lifestyle",
  "Books & Learning",
  "Food & Dining",
  "Education",
  "Healthcare",
  "Services",
  "Other",
];

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const STATUS_STYLE = {
  active: { bg: "#e8f5e3", color: "#27500A", dot: "#3FAE2A", accent: "#3FAE2A" },
  inactive: { bg: "#f0f0f0", color: "#585859", dot: "#939498", accent: "#d1d5db" },
};

function formFromBenefit(benefit: AdminBenefit): BenefitFormState {
  return {
    merchant_name: benefit.merchant_name ?? "",
    category: benefit.category ?? "Lifestyle",
    discount_description: benefit.discount_description ?? "",
    discount_amount:
      benefit.discount_amount === null || benefit.discount_amount === undefined
        ? ""
        : String(benefit.discount_amount),
    address: benefit.address ?? "",
    description: benefit.description ?? "",
    image_url: benefit.image_url ?? "",
    logo_url: benefit.logo_url ?? "",
    logo_initials: benefit.logo_initials ?? "",
    is_active: Boolean(benefit.is_active),
  };
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildPayload(form: BenefitFormState) {
  return {
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
}

export default function BenefitManagementPanel({
  initialBenefits,
  loadError,
}: {
  initialBenefits: AdminBenefit[];
  loadError?: string;
}) {
  const { toast } = useToast();
  const [benefits, setBenefits] = useState<AdminBenefit[]>(initialBenefits);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<"image_url" | "logo_url" | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BenefitFormState>(EMPTY_FORM);

  const { sortState, handleSort, sortData } = useSortState("merchant_name", "asc");

  const stats = useMemo(() => {
    const active = benefits.filter((benefit) => benefit.is_active).length;
    const categories = new Set(
      benefits.map((benefit) => benefit.category).filter(Boolean),
    ).size;

    return {
      total: benefits.length,
      active,
      inactive: benefits.length - active,
      categories,
    };
  }, [benefits]);

  const filteredBenefits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return benefits.filter((benefit) => {
      const statusMatch =
        filter === "all" ||
        (filter === "active" && benefit.is_active) ||
        (filter === "inactive" && !benefit.is_active);

      if (!statusMatch) return false;
      if (!query) return true;

      return [
        benefit.merchant_name,
        benefit.category,
        benefit.discount_description,
        benefit.address ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [benefits, filter, search]);

  const sortedBenefits = sortData(filteredBenefits, (benefit, key) => {
    if (key === "merchant_name") return benefit.merchant_name;
    if (key === "category") return benefit.category;
    if (key === "discount_description") return benefit.discount_description;
    if (key === "is_active") return benefit.is_active ? "active" : "inactive";
    if (key === "created_at") return benefit.created_at ?? "";
    return "";
  });

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormMode("create");
  };

  const openEditForm = (benefit: AdminBenefit) => {
    setForm(formFromBenefit(benefit));
    setEditingId(benefit.id);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadingField(null);
  };

  const handleMediaUpload = async (
    field: "image_url" | "logo_url",
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || typeof result.url !== "string") {
        throw new Error(result.error ?? "Image upload failed.");
      }

      setForm((prev) => ({ ...prev, [field]: result.url }));
      toast.success(field === "logo_url" ? "Logo uploaded." : "Benefit image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload(form);
    if (!payload.merchant_name || !payload.category || !payload.discount_description) {
      toast.warning("Merchant, category, and offer details are required.");
      return;
    }

    const isEdit = formMode === "edit";
    if (isEdit && !editingId) return;

    setBusy("form");
    try {
      const response = await fetch(
        isEdit ? `/api/admin/engagement/${editingId}` : "/api/admin/engagement",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.benefit) {
        throw new Error(result.error ?? "Unable to save benefit.");
      }

      const saved = result.benefit as AdminBenefit;
      setBenefits((prev) =>
        isEdit
          ? prev.map((benefit) => (benefit.id === saved.id ? saved : benefit))
          : [saved, ...prev],
      );
      toast.success(isEdit ? "Benefit updated." : "Benefit created.");
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save benefit.");
    } finally {
      setBusy(null);
    }
  };

  const handleToggleActive = async (benefit: AdminBenefit) => {
    setBusy(benefit.id);
    try {
      const response = await fetch(`/api/admin/engagement/${benefit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !benefit.is_active }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.benefit) {
        throw new Error(result.error ?? "Unable to update status.");
      }

      const saved = result.benefit as AdminBenefit;
      setBenefits((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item)),
      );
      toast.success(saved.is_active ? "Benefit activated." : "Benefit hidden from members.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (benefit: AdminBenefit) => {
    if (!confirm(`Delete "${benefit.merchant_name}"? This cannot be undone.`)) return;

    setBusy(benefit.id);
    try {
      const response = await fetch(`/api/admin/engagement/${benefit.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete benefit.");
      }

      setBenefits((prev) => prev.filter((item) => item.id !== benefit.id));
      toast.success("Benefit deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete benefit.");
    } finally {
      setBusy(null);
    }
  };

  const renderRow = (benefit: AdminBenefit) => {
    const status = benefit.is_active ? STATUS_STYLE.active : STATUS_STYLE.inactive;
    const isBusy = busy === benefit.id;

    return (
      <TableRow
        key={benefit.id}
        accentColor={status.accent}
        className={isBusy ? "opacity-60" : ""}
      >
        <TableCell>
          <div className="flex items-center gap-3 min-w-[220px]">
            {benefit.logo_url || benefit.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={benefit.logo_url || benefit.image_url || ""}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-[#c3e6b3] bg-[#f0faf0] shrink-0"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#e8f5e3] border border-[#c3e6b3] flex items-center justify-center text-[12px] font-bold text-[#27500A] shrink-0">
                {(benefit.logo_initials || benefit.merchant_name.slice(0, 2)).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#1a2e1a] truncate">
                {benefit.merchant_name}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {benefit.address || "Online or merchant-confirmed redemption"}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#e3f6fb] text-[#1a7a8f]">
            {benefit.category}
          </span>
        </TableCell>
        <TableCell>
          <div className="max-w-[260px]">
            <div className="text-[13px] font-semibold text-gray-800 line-clamp-1">
              {benefit.discount_description}
            </div>
            {benefit.discount_amount && (
              <div className="text-[11px] font-bold text-[#3FAE2A] mt-0.5">
                {benefit.discount_amount}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ background: status.bg, color: status.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
            {benefit.is_active ? "Active" : "Inactive"}
          </span>
        </TableCell>
        <TableCell className="text-[12px] text-gray-500">
          {formatDate(benefit.created_at)}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={isBusy}
              onClick={() => handleToggleActive(benefit)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#3FAE2A]/10 transition-colors disabled:opacity-40"
              title={benefit.is_active ? "Hide from members" : "Show to members"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={benefit.is_active ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.061-3.368m3.16-2.188A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.132 5.411M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                {!benefit.is_active && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
            <button
              disabled={isBusy}
              onClick={() => openEditForm(benefit)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3BB0C9] hover:bg-[#e3f6fb] transition-colors disabled:opacity-40"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              disabled={isBusy}
              onClick={() => handleDelete(benefit)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              title="Delete"
            >
              {isBusy ? (
                <span className="text-[12px]">...</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5 w-full pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a2e1a] font-butler">
            Benefit Management
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 font-helvetica">
            Create and manage partner benefits shown on the member benefits page.
          </p>
        </div>
        <ActionButton onClick={openCreateForm} icon>
          New Benefit
        </ActionButton>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 font-helvetica">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Benefits"
          value={stats.total}
          accent="#3FAE2A"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11.25v8.25A1.5 1.5 0 0119.5 21h-15A1.5 1.5 0 013 19.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V21m0-16.125A2.625 2.625 0 1114.625 7.5H12m0 0h8.25M3.75 7.5H12" /></svg>}
        />
        <StatCard
          label="Active"
          value={stats.active}
          sub="Visible to members"
          accent="#1E9888"
          valueColor="#3FAE2A"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          sub="Hidden from members"
          accent="#939498"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L21 21M5.636 5.636L3 3" /></svg>}
        />
        <StatCard
          label="Categories"
          value={stats.categories}
          accent="#FFB547"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.169.659 1.591l8.182 8.182a2.25 2.25 0 003.182 0l4.318-4.318a2.25 2.25 0 000-3.182L11.159 3.659A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z" /></svg>}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <FilterPills
            options={FILTER_OPTIONS}
            activeValue={filter}
            onChange={(value) => setFilter(value as FilterValue)}
          />
          <label className="relative block lg:w-[320px]">
            <span className="sr-only">Search benefits</span>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.1-5.15a6.25 6.25 0 11-12.5 0 6.25 6.25 0 0112.5 0z" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search merchant, category, offer..."
              className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[13px] text-gray-700 outline-none focus:border-[#3FAE2A] focus:bg-white font-helvetica"
            />
          </label>
        </div>
      </div>

      <TableWrapper
        data={sortedBenefits}
        renderRow={renderRow}
        colCount={6}
        emptyState={
          <div className="font-helvetica">
            <div className="text-[14px] font-bold text-gray-600">No benefits found</div>
            <div className="text-[12px] text-gray-400 mt-1">
              Create a benefit or adjust your filters.
            </div>
          </div>
        }
      >
        <TableHead>
          <TableHeader sortKey="merchant_name" sortState={sortState} onSort={handleSort}>
            Merchant
          </TableHeader>
          <TableHeader sortKey="category" sortState={sortState} onSort={handleSort}>
            Category
          </TableHeader>
          <TableHeader sortKey="discount_description" sortState={sortState} onSort={handleSort}>
            Offer
          </TableHeader>
          <TableHeader sortKey="is_active" sortState={sortState} onSort={handleSort}>
            Status
          </TableHeader>
          <TableHeader sortKey="created_at" sortState={sortState} onSort={handleSort}>
            Created
          </TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
      </TableWrapper>

      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <form
            onSubmit={handleSave}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200"
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-[20px] font-bold text-[#1a2e1a] font-butler">
                  {formMode === "edit" ? "Edit Benefit" : "New Benefit"}
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 font-helvetica">
                  Active benefits appear automatically on the member benefits page.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                aria-label="Close form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5 font-helvetica">
              <label className="space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Merchant name</span>
                <input
                  value={form.merchant_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, merchant_name: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] outline-none focus:border-[#3FAE2A]"
                  placeholder="e.g. Pergas Bookstore"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Category</span>
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] outline-none focus:border-[#3FAE2A] bg-white"
                  required
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Discount amount</span>
                <input
                  value={form.discount_amount}
                  onChange={(event) => setForm((prev) => ({ ...prev, discount_amount: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] outline-none focus:border-[#3FAE2A]"
                  placeholder="e.g. 15% off"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Logo initials</span>
                <input
                  value={form.logo_initials}
                  onChange={(event) => setForm((prev) => ({ ...prev, logo_initials: event.target.value.toUpperCase().slice(0, 3) }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] uppercase outline-none focus:border-[#3FAE2A]"
                  placeholder="PB"
                />
              </label>

              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Offer details</span>
                <input
                  value={form.discount_description}
                  onChange={(event) => setForm((prev) => ({ ...prev, discount_description: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] outline-none focus:border-[#3FAE2A]"
                  placeholder="e.g. on selected religious books and learning materials"
                  required
                />
              </label>

              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Address</span>
                <input
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] outline-none focus:border-[#3FAE2A]"
                  placeholder="Leave blank for online redemption"
                />
              </label>

              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full min-h-24 rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#3FAE2A] resize-y"
                  placeholder="Short redemption note or partner description"
                />
              </label>

              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="block text-[12px] font-bold text-gray-600">Benefit image</span>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Used as the reward card visual.
                      </p>
                    </div>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                        className="text-[11px] font-bold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {form.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_url}
                      alt="Benefit image preview"
                      className="mt-3 h-28 w-full rounded-lg border border-gray-200 object-cover bg-white"
                    />
                  ) : (
                    <div className="mt-3 h-28 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-[12px] font-medium text-gray-400">
                      No image uploaded
                    </div>
                  )}
                  <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50">
                    {uploadingField === "image_url" ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={Boolean(uploadingField)}
                      onChange={(event) => handleMediaUpload("image_url", event)}
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="block text-[12px] font-bold text-gray-600">Partner logo</span>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Used as the merchant badge.
                      </p>
                    </div>
                    {form.logo_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                        className="text-[11px] font-bold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {form.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logo_url}
                      alt="Partner logo preview"
                      className="mt-3 h-28 w-full rounded-lg border border-gray-200 object-contain bg-white p-3"
                    />
                  ) : (
                    <div className="mt-3 h-28 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-[12px] font-medium text-gray-400">
                      No logo uploaded
                    </div>
                  )}
                  <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50">
                    {uploadingField === "logo_url" ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={Boolean(uploadingField)}
                      onChange={(event) => handleMediaUpload("logo_url", event)}
                    />
                  </label>
                </div>
              </div>

              <label className="sm:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-[#c3e6b3] bg-[#f0faf0] px-4 py-3">
                <span>
                  <span className="block text-[13px] font-bold text-[#1a2e1a]">Visible to members</span>
                  <span className="block text-[12px] text-gray-500 mt-0.5">
                    Turn this off to save the benefit without showing it in the member page.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  className="h-5 w-5 accent-[#3FAE2A]"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-bold text-gray-600 hover:bg-gray-50 font-helvetica"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy === "form"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3FAE2A] text-white text-[13px] font-bold hover:brightness-110 disabled:opacity-50 font-helvetica"
              >
                {busy === "form" ? "Saving..." : formMode === "edit" ? "Save Changes" : "Create Benefit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
