import Link from "next/link";
import BenefitForm from "@/components/admin/BenefitForm";

export default function NewBenefitPage() {
  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-400" aria-label="Breadcrumb">
        <Link
          href="/admin/engagement"
          className="hover:text-[#3FAE2A]"
        >
          Benefits
        </Link>
        <span className="mx-2" aria-hidden="true">
          &rsaquo;
        </span>
        <span className="text-gray-700">Create New Benefit</span>
      </nav>

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
