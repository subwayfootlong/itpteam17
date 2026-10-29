import BenefitForm from "@/components/admin/BenefitForm";
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export default function NewBenefitPage() {
  return (
    <div className="space-y-5">
      <AdminBreadcrumbs items={[{ label: 'Benefits', href: '/admin/engagement' }, { label: 'Create New Benefit' }]} />

      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Create New Benefit
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Add a partner offer and set it to Active when it is ready for members.
        </p>
      </div>

      <BenefitForm />
    </div>
  );
}
