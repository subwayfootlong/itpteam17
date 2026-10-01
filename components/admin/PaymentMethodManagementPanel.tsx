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
import type { AdminPaymentMethod } from "@/lib/adminPaymentMethods";

type PaymentMethodFormState = {
  name: string;
  description: string;
  paynow_uen: string;
  qr_code_url: string;
  is_active: boolean;
};

type FilterValue = "all" | "active" | "inactive";

const EMPTY_FORM: PaymentMethodFormState = {
  name: "",
  description: "",
  paynow_uen: "",
  qr_code_url: "",
  is_active: true,
};

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const STATUS_STYLE = {
  active: { bg: "#e8f5e3", color: "#27500A", dot: "#3FAE2A", accent: "#3FAE2A" },
  inactive: { bg: "#f0f0f0", color: "#585859", dot: "#939498", accent: "#d1d5db" },
};

function formFromPaymentMethod(method: AdminPaymentMethod): PaymentMethodFormState {
  return {
    name: method.name ?? "",
    description: method.description ?? "",
    paynow_uen: method.paynow_uen ?? "",
    qr_code_url: method.qr_code_url ?? "",
    is_active: Boolean(method.is_active),
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

function withExclusiveActive(
  list: AdminPaymentMethod[],
  saved: AdminPaymentMethod,
): AdminPaymentMethod[] {
  return list.map((item) => {
    if (item.id === saved.id) return saved;
    return saved.is_active && item.is_active ? { ...item, is_active: false } : item;
  });
}

function buildPayload(form: PaymentMethodFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    paynow_uen: form.paynow_uen.trim() || null,
    qr_code_url: form.qr_code_url.trim() || null,
    is_active: form.is_active,
  };
}

export default function PaymentMethodManagementPanel({
  initialPaymentMethods,
  loadError,
}: {
  initialPaymentMethods: AdminPaymentMethod[];
  loadError?: string;
}) {
  const { toast } = useToast();
  const [methods, setMethods] = useState<AdminPaymentMethod[]>(initialPaymentMethods);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentMethodFormState>(EMPTY_FORM);

  const { sortState, handleSort, sortData } = useSortState("name", "asc");

  const stats = useMemo(() => {
    const active = methods.filter((method) => method.is_active).length;
    const withQr = methods.filter((method) => Boolean(method.qr_code_url)).length;

    return {
      total: methods.length,
      active,
      inactive: methods.length - active,
      withQr,
    };
  }, [methods]);

  const filteredMethods = useMemo(() => {
    const query = search.trim().toLowerCase();
    return methods.filter((method) => {
      const statusMatch =
        filter === "all" ||
        (filter === "active" && method.is_active) ||
        (filter === "inactive" && !method.is_active);

      if (!statusMatch) return false;
      if (!query) return true;

      return [method.name, method.paynow_uen ?? "", method.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [methods, filter, search]);

  const sortedMethods = sortData(filteredMethods, (method, key) => {
    if (key === "name") return method.name;
    if (key === "paynow_uen") return method.paynow_uen ?? "";
    if (key === "is_active") return method.is_active ? "active" : "inactive";
    if (key === "created_at") return method.created_at ?? "";
    return "";
  });

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormMode("create");
  };

  const openEditForm = (method: AdminPaymentMethod) => {
    setForm(formFromPaymentMethod(method));
    setEditingId(method.id);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadingQr(false);
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingQr(true);
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

      setForm((prev) => ({ ...prev, qr_code_url: result.url }));
      toast.success("QR code uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload(form);
    if (!payload.name) {
      toast.warning("Name is required.");
      return;
    }
    if (!payload.paynow_uen && !payload.qr_code_url) {
      toast.warning("Provide a PayNow UEN, a QR code image, or both.");
      return;
    }

    const isEdit = formMode === "edit";
    if (isEdit && !editingId) return;

    setBusy("form");
    try {
      const response = await fetch(
        isEdit ? `/api/admin/payment-methods/${editingId}` : "/api/admin/payment-methods",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.paymentMethod) {
        throw new Error(result.error ?? "Unable to save payment method.");
      }

      const saved = result.paymentMethod as AdminPaymentMethod;
      setMethods((prev) =>
        isEdit
          ? withExclusiveActive(prev, saved)
          : [saved, ...withExclusiveActive(prev, saved)],
      );
      toast.success(
        saved.is_active
          ? `${saved.name} is now the active payment method.`
          : isEdit
            ? "Payment method updated."
            : "Payment method created.",
      );
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save payment method.");
    } finally {
      setBusy(null);
    }
  };

  const handleToggleActive = async (method: AdminPaymentMethod) => {
    setBusy(method.id);
    try {
      const response = await fetch(`/api/admin/payment-methods/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !method.is_active }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.paymentMethod) {
        throw new Error(result.error ?? "Unable to update status.");
      }

      const saved = result.paymentMethod as AdminPaymentMethod;
      setMethods((prev) => withExclusiveActive(prev, saved));
      toast.success(
        saved.is_active
          ? `${saved.name} is now the active payment method.`
          : "Payment method hidden from members.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (method: AdminPaymentMethod) => {
    if (!confirm(`Delete "${method.name}"? This cannot be undone.`)) return;

    setBusy(method.id);
    try {
      const response = await fetch(`/api/admin/payment-methods/${method.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete payment method.");
      }

      setMethods((prev) => prev.filter((item) => item.id !== method.id));
      toast.success("Payment method deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete payment method.");
    } finally {
      setBusy(null);
    }
  };

  const renderRow = (method: AdminPaymentMethod) => {
    const status = method.is_active ? STATUS_STYLE.active : STATUS_STYLE.inactive;
    const isBusy = busy === method.id;

    return (
      <TableRow
        key={method.id}
        accentColor={status.accent}
        className={isBusy ? "opacity-60" : ""}
      >
        <TableCell>
          <div className="flex items-center gap-3 min-w-[220px]">
            {method.qr_code_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={method.qr_code_url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-[#c3e6b3] bg-[#f0faf0] shrink-0"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#e8f5e3] border border-[#c3e6b3] flex items-center justify-center text-[#27500A] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#1a2e1a] truncate">
                {method.name}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {method.description || "No description"}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {method.paynow_uen ? (
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#e3f6fb] text-[#1a7a8f]">
              {method.paynow_uen}
            </span>
          ) : (
            <span className="text-[12px] text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell>
          {method.qr_code_url ? (
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0faf0] text-[#27500A]">
              Uploaded
            </span>
          ) : (
            <span className="text-[12px] text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ background: status.bg, color: status.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
            {method.is_active ? "Active" : "Inactive"}
          </span>
        </TableCell>
        <TableCell className="text-[12px] text-gray-500">
          {formatDate(method.created_at)}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={isBusy}
              onClick={() => handleToggleActive(method)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#3FAE2A]/10 transition-colors disabled:opacity-40"
              title={method.is_active ? "Deactivate" : "Set as active (deactivates others)"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={method.is_active ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.061-3.368m3.16-2.188A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.132 5.411M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                {!method.is_active && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
            <button
              disabled={isBusy}
              onClick={() => openEditForm(method)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3BB0C9] hover:bg-[#e3f6fb] transition-colors disabled:opacity-40"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              disabled={isBusy}
              onClick={() => handleDelete(method)}
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
            Payment Methods
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 font-helvetica">
            Manage the PayNow UEN and QR codes members use to pay. Payments are handled
            externally — this just publishes where members should send payment. Only one
            payment method can be active at a time; activating one deactivates the rest.
          </p>
        </div>
        <ActionButton onClick={openCreateForm} icon>
          New Payment Method
        </ActionButton>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 font-helvetica">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Methods"
          value={stats.total}
          accent="#3FAE2A"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-4.5-9V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021.75 18V8.25A2.25 2.25 0 0019.5 6H4.5a2.25 2.25 0 00-2.25 2.25z" /></svg>}
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
          label="With QR Code"
          value={stats.withQr}
          accent="#FFB547"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>}
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
            <span className="sr-only">Search payment methods</span>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.1-5.15a6.25 6.25 0 11-12.5 0 6.25 6.25 0 0112.5 0z" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, UEN, description..."
              className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[13px] text-gray-700 outline-none focus:border-[#3FAE2A] focus:bg-white font-helvetica"
            />
          </label>
        </div>
      </div>

      <TableWrapper
        data={sortedMethods}
        renderRow={renderRow}
        colCount={6}
        emptyState={
          <div className="font-helvetica">
            <div className="text-[14px] font-bold text-gray-600">No payment methods found</div>
            <div className="text-[12px] text-gray-400 mt-1">
              Create a payment method or adjust your filters.
            </div>
          </div>
        }
      >
        <TableHead>
          <TableHeader sortKey="name" sortState={sortState} onSort={handleSort}>
            Name
          </TableHeader>
          <TableHeader sortKey="paynow_uen" sortState={sortState} onSort={handleSort}>
            PayNow UEN
          </TableHeader>
          <TableHeader>QR Code</TableHeader>
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
                  {formMode === "edit" ? "Edit Payment Method" : "New Payment Method"}
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 font-helvetica">
                  Active payment methods appear automatically to members when they pay.
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
              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] outline-none focus:border-[#3FAE2A]"
                  placeholder="e.g. Membership Renewal (PayNow)"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">PayNow UEN</span>
                <input
                  value={form.paynow_uen}
                  onChange={(event) => setForm((prev) => ({ ...prev, paynow_uen: event.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[13px] font-mono outline-none focus:border-[#3FAE2A]"
                  placeholder="e.g. 201234567A"
                />
              </label>

              <label className="sm:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-[#c3e6b3] bg-[#f0faf0] px-4 py-3">
                <span>
                  <span className="block text-[13px] font-bold text-[#1a2e1a]">Active (shown to members)</span>
                  <span className="block text-[12px] text-gray-500 mt-0.5">
                    Only one payment method can be active at a time. Turning this on will
                    automatically deactivate any other active method.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  className="h-5 w-5 accent-[#3FAE2A]"
                />
              </label>

              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-[12px] font-bold text-gray-600">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full min-h-24 rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#3FAE2A] resize-y"
                  placeholder="Short note for members, e.g. what this payment is for"
                />
              </label>

              <div className="sm:col-span-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="block text-[12px] font-bold text-gray-600">QR code</span>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Upload the QR code from your bank / PayNow app for members to scan.
                      </p>
                    </div>
                    {form.qr_code_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, qr_code_url: "" }))}
                        className="text-[11px] font-bold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {form.qr_code_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.qr_code_url}
                      alt="QR code preview"
                      className="mt-3 h-40 w-40 mx-auto rounded-lg border border-gray-200 object-contain bg-white p-2"
                    />
                  ) : (
                    <div className="mt-3 h-40 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-[12px] font-medium text-gray-400">
                      No QR code uploaded
                    </div>
                  )}
                  <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50">
                    {uploadingQr ? "Uploading..." : "Upload QR Code"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={uploadingQr}
                      onChange={handleQrUpload}
                    />
                  </label>
                </div>
              </div>
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
                {busy === "form" ? "Saving..." : formMode === "edit" ? "Save Changes" : "Create Payment Method"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
