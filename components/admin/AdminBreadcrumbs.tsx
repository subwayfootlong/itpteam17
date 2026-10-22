import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail for admin sub-pages. Always starts at "Admin" (the dashboard);
 * the last item is rendered as the current page.
 */
export default function AdminBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const trail: BreadcrumbItem[] = [{ label: 'Admin', href: '/admin/dashboard' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="text-[13px] font-medium font-helvetica">
      <ol className="flex flex-wrap items-center gap-1.5 text-gray-400">
        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
              {isLast || !item.href ? (
                <span
                  className={isLast ? 'text-gray-700 truncate' : 'truncate'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-[#3FAE2A] transition-colors truncate">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
