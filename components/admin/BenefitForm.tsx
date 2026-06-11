"use client";
// components/admin/BenefitForm.tsx
// ─────────────────────────────────
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface BenefitFormData {
  merchant_name: string;
  category: string;
  discount_description: string;
  discount_amount: string;
  address: string;
  description: string;
  logo_initials: string;
  is_active: boolean;
}

const EMPTY: BenefitFormData = {
  merchant_name: '',
  category: 'Islamic Books',
  discount_description: '',
  discount_amount: '',
  address: '',
  description: '',
  logo_initials: '',
  is_active: true,
};

const CATEGORIES = [
  'Islamic Books', 'Halal Dining', 'Islamic Apparel',
  'Religious Goods', 'Islamic Art', 'Education', 'Other',
];

interface BenefitFormProps {
  initialData?: Partial<BenefitFormData>;
  benefitId?: string;
}

export default function BenefitForm({ initialData, benefitId }: BenefitFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BenefitFormData>({ ...EMPTY, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof BenefitFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = benefitId ? `/api/admin/benefits/${benefitId}` : '/api/admin/benefits';
    const method = benefitId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/benefits');
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? 'Failed to save.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-800">Merchant Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Merchant Name *</label>
            <input required value={form.merchant_name} onChange={(e) => set('merchant_name', e.target.value)}
              placeholder="e.g. Wardah Books" className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Logo Initials</label>
            <input value={form.logo_initials} onChange={(e) => set('logo_initials', e.target.value.slice(0, 3).toUpperCase())}
              placeholder="e.g. WB" maxLength={3} className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount Amount</label>
            <input value={form.discount_amount} onChange={(e) => set('discount_amount', e.target.value)}
              placeholder="e.g. 15% off" className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount Description *</label>
          <input required value={form.discount_description} onChange={(e) => set('discount_description', e.target.value)}
            placeholder="e.g. All Islamic titles, children's books & stationery"
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</label>
          <input value={form.address} onChange={(e) => set('address', e.target.value)}
            placeholder="e.g. 58 Bussorah St, Singapore 199474"
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Additional Notes</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={3} placeholder="Any T&Cs or usage notes for members…"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] resize-none" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            className="w-4 h-4 accent-[#3FAE2A]" />
          <span className="text-sm text-gray-700">Active — visible in member Perks directory</span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/benefits')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-[#3FAE2A] hover:bg-[#35941f] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
          {saving ? 'Saving…' : benefitId ? 'Save Changes' : 'Add Benefit'}
        </button>
      </div>
    </form>
  );
}
