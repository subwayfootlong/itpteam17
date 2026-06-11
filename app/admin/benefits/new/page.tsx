import Link from 'next/link';
import BenefitForm from '@/components/admin/BenefitForm';

export default function NewBenefitPage() {
  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-400">
        <Link href="/admin/benefits" className="hover:text-[#3FAE2A]">Benefits</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Add New Benefit</span>
      </nav>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Add New Benefit</h2>
        <p className="text-gray-500 text-sm mt-0.5">Register a new partner merchant discount for Pergas members.</p>
      </div>
      <BenefitForm />
    </div>
  );
}
