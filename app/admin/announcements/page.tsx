"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    fetch(`/api/admin/announcements?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.announcements ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [statusFilter]); // eslint-disable-line

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchItems();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage official Pergas announcements shown in the member feed
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#3FAE2A] hover:bg-[#35941f] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Announcement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: items.length },
          { label: 'Published', value: items.filter((i) => i.status === 'published').length, color: 'text-green-600' },
          { label: 'Drafts', value: items.filter((i) => i.status === 'draft').length, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color ?? 'text-gray-800'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        {['all', 'published', 'draft', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              statusFilter === s
                ? 'bg-[#3FAE2A] text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-[#3FAE2A]'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Last Updated</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="text-gray-400 mb-2">No announcements yet</div>
                  <Link href="/admin/announcements/new" className="text-[#3FAE2A] text-sm hover:underline">
                    Post your first announcement →
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-800">{item.title}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLE[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {new Date(item.updated_at).toLocaleDateString('en-SG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'published')}
                          className="text-xs text-green-600 hover:underline font-medium"
                        >
                          Publish
                        </button>
                      )}
                      {item.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'archived')}
                          className="text-xs text-amber-600 hover:underline font-medium"
                        >
                          Archive
                        </button>
                      )}
                      <Link
                        href={`/admin/announcements/${item.id}/edit`}
                        className="text-xs text-[#3FAE2A] hover:underline font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="text-xs text-red-500 hover:underline font-medium disabled:opacity-40"
                      >
                        {deleting === item.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {items.length} announcement{items.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
