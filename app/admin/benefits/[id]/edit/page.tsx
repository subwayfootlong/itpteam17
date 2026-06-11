"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BenefitForm, { BenefitFormData } from '@/components/admin/BenefitForm';

export default function EditBenefitPage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<BenefitFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/benefits/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.benefit) { setNotFound(true); return; }
        const b = d.benefit;
        setInitialData({
          merchant_name: b.merchant_name ?? '',
          category: b.category ?? 'Islamic Books',
          discount_description: b.discount_description ?? '',
          discount_amount: b.discount_amount ?? '',
          address: b.address ?? '',
          description: b.description ?? '',
          logo_initials: b.logo_initials ?? '',
          is_active: b.is_active ?? true,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" /></div>;
  if (notFound) return <div className="text-center py-20 text-gray-400">Benefit not found. <Link href="/admin/benefits" className="text-[#3FAE2A] hover:underline">Back</Link></div>;

  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/benefits" className="hover:text-[#3FAE2A]">Benefits</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Edit Benefit</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Edit Benefit</h2>
        <p className="text-gray-500 text-sm mt-0.5">Update this merchant's details or toggle its visibility.</p>
      </div>
      {initialData && <BenefitForm initialData={initialData} benefitId={id} />}
    </div>
  );
}
