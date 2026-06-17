import React from 'react';

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-helvetica">
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
      <tr className="border-b border-gray-100">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeader({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3 font-semibold ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-gray-100 text-[13px] ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = '',
  colSpan,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  style?: React.CSSProperties;
}) {
  return (
    <td className={`px-5 py-4 ${className}`} colSpan={colSpan} style={style}>
      {children}
    </td>
  );
}
