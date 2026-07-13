import Link from "next/link";
import { Gift } from "lucide-react";

type FeaturedBenefit = {
  id: string;
  title: string;
  description: string | null;
  discountText: string | null;
  imageUrl: string | null;
  merchantName: string | null;
};

export default function FeaturedBenefitCard({
  benefit,
}: {
  benefit: FeaturedBenefit;
}) {
  return (
    <section className="mt-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[#F8FBF7] text-[#0F6E00]">
          {benefit.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={benefit.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Gift size={26} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="member-text-xs font-semibold uppercase tracking-wide text-[#0F6E00]">
            Featured Benefit
          </p>
          <h2 className="member-text-lg mt-1 break-words font-semibold text-[#151C27]">
            {benefit.merchantName || benefit.title}
          </h2>
        </div>
      </div>

      {benefit.discountText && (
        <div className="member-text-base mt-5 rounded-lg border border-[#F5C985] bg-[#FFF0D9] px-4 py-3 text-center font-bold text-[#7A4B00]">
          {benefit.discountText}
        </div>
      )}

      {benefit.description && (
        <p className="member-text-sm mt-4 text-[#5F5E5E]">
          {benefit.description}
        </p>
      )}

      <Link
        href="/member/benefit"
        className="member-text-base mt-5 block rounded-xl border border-gray-300 px-4 py-3 text-center font-semibold text-[#151C27]"
      >
        Explore Benefits
      </Link>
    </section>
  );
}
