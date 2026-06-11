"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Benefit {
  id: string;
  merchant_name: string;
  category: string;
  discount_description: string;
  discount_amount: string | null;
  address: string | null;
  logo_initials: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Islamic Books': 'bg-blue-50 text-blue-700',
  'Halal Dining': 'bg-orange-50 text-orange-700',
  'Islamic Apparel': 'bg-purple-50 text-purple-700',
  'Religious Goods': 'bg-green-50 text-green-700',
  'Islamic Art': 'bg-pink-50 text-pink-700',
};

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBenefits = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeFilter === 'active') params.set('active', 'true');
    if (activeFilter === 'inactive') params.set('active', 'false');
    fetch(`/api/admin/benefits?${params}`)
      .then((r) => r.json())
      .then((d) => setBenefits(d.benefits ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBenefits(); }, [activeFilter]); // eslint-disable-line

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/benefits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    fetchBenefits();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this benefit listing?')) return;
    setDeleting(id);
    await fetch(`/api/admin/benefits/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchBenefits();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Member Benefits</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage partner merchant discounts shown in the member Perks directory
          </p>
        </div>
        <Link
          href="/admin/benefits/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#3FAE2A] hover:bg-[#35941f] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Benefit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Partners', value: benefits.length },
          { label: 'Active', value: benefits.filter((b) => b.is_active).length, color: 'text-green-600' },
          { label: 'Inactive', value: benefits.filter((b) => !b.is_active).length, color: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color ?? 'text-gray-800'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              activeFilter === f
                ? 'bg-[#3FAE2A] text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-[#3FAE2A]'
            }`}
          >
            {f === 'all' ? 'All Benefits' : f}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : benefits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <div className="text-gray-400 mb-2">No benefits listed yet</div>
          <Link href="/admin/benefits/new" className="text-[#3FAE2A] text-sm hover:underline">
            Add your first partner merchant →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {benefits.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-xl border p-5 flex flex-col gap-3 ${b.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e8f5e3] flex items-center justify-center text-[#3FAE2A] text-sm font-bold flex-shrink-0">
                    {b.logo_initials ?? b.merchant_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{b.merchant_name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded mt-0.5 inline-block ${CATEGORY_COLORS[b.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.category}
                    </span>
                  </div>
                </div>
                {b.discount_amount && (
                  <div className="text-[#3FAE2A] font-bold text-lg">{b.discount_amount}</div>
                )}
              </div>

              <p className="text-gray-500 text-xs flex-1">{b.discount_description}</p>
              {b.address && <p className="text-gray-400 text-xs">📍 {b.address}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(b.id, b.is_active)}
                  className={`text-xs font-medium ${b.is_active ? 'text-amber-600 hover:underline' : 'text-green-600 hover:underline'}`}
                >
                  {b.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex gap-3">
                  <Link href={`/admin/benefits/${b.id}/edit`} className="text-xs text-[#3FAE2A] hover:underline font-medium">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deleting === b.id}
                    className="text-xs text-red-500 hover:underline font-medium disabled:opacity-40"
                  >
                    {deleting === b.id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
