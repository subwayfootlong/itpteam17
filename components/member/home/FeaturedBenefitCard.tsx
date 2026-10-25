import NavLink from "@/components/ui/NavLink";
import { Gift, Tag, ChevronRight } from "lucide-react";

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
    <section className="mt-4 overflow-hidden rounded-2xl border border-neutral-100 member-dark:border-neutral-700 bg-white member-dark:bg-neutral-900 p-4.5 shadow-sm transition-all hover:border-neutral-200 member-dark:hover:border-neutral-700 hover:shadow-md">
      {/* Top Header Row with Category and Pill Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#E8F4E6] member-dark:bg-neutral-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F6E00] member-dark:text-brand-primary-200">
          Featured Partner
        </span>

        {benefit.discountText && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#F5C985] bg-[#FFF0D9] member-dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-[#7A4B00] member-dark:text-amber-200 shadow-2xs">
            <Tag size={12} className="text-[#7A4B00] member-dark:text-amber-200" />
            <span>{benefit.discountText}</span>
          </span>
        )}
      </div>

      {/* Main Merchant Details in Horizontal Flex Layout */}
      <div className="mt-3.5 flex items-center gap-3.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-100 member-dark:border-neutral-700 bg-stone-50 member-dark:bg-neutral-900 text-[#0F6E00] member-dark:text-brand-primary-200 shadow-2xs">
          {benefit.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={benefit.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Gift size={24} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold leading-snug text-neutral-900 member-dark:text-neutral-100">
            {benefit.merchantName || benefit.title}
          </h3>

          {benefit.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-500 member-dark:text-neutral-400">
              {benefit.description}
            </p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <NavLink
        href="/member/benefit"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200/80 member-dark:border-neutral-700/80 bg-stone-50/50 member-dark:bg-neutral-900/50 px-4 py-2.5 text-center text-xs font-semibold text-neutral-800 member-dark:text-neutral-100 shadow-2xs transition-all hover:border-neutral-300 member-dark:hover:border-neutral-700 hover:bg-stone-100/80 member-dark:hover:bg-neutral-800/80 active:scale-[0.98]"
      >
        <span>Explore Member Benefits</span>
        <ChevronRight size={14} className="text-neutral-500 member-dark:text-neutral-400" />
      </NavLink>
    </section>
  );
}
