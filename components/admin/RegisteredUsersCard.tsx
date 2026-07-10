"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Shared progress bar function
function RegistrationBar({ capacity, spotsAvailable }: { capacity: number | null; spotsAvailable: number | null }) {
  if (!capacity) return <span className="text-gray-400 text-[12px]">—</span>;
  const taken = capacity - (spotsAvailable ?? 0);
  const pct = Math.min(100, Math.max(0, (taken / capacity) * 100));
  const barColor = pct >= 90 ? '#C51A4A' : pct >= 70 ? '#FFB547' : '#3FAE2A';
  const bgColor = pct >= 90 ? '#fde8ef' : pct >= 70 ? '#fff4de' : '#e8f5e3';

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: bgColor }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums whitespace-nowrap" style={{ color: barColor }}>
        {taken}/{capacity}
      </span>
    </div>
  );
}

interface UserRegistration {
  id: string;
  user_id: string;
  name: string;
  email: string;
  date: string;
}

export default function RegisteredUsersCard({ 
  eventId, 
  capacity, 
  spotsAvailable,
  externalRsvpUrl 
}: { 
  eventId: string, 
  capacity: number | null, 
  spotsAvailable: number | null,
  externalRsvpUrl?: string | null 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToRemove, setUserToRemove] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState('');

  useEffect(() => {
    fetch(`/api/admin/events/${eventId}/registrations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.registrations) {
          setUsers(data.registrations);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRemove = async (registrationId: string) => {
    try {
      const messageParam = encodeURIComponent(rejectionMessage.trim() || 'Registration cancelled by administrator.');
      const res = await fetch(`/api/admin/events/${eventId}/registrations?registrationId=${registrationId}&rejectionMessage=${messageParam}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== registrationId));
      } else {
        console.error('Failed to reject registration');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserToRemove(null);
      setRejectionMessage('');
    }
  };

  // Dynamically calculate spots available based on our local users list so the UI updates instantly
  const dynamicSpotsAvailable = capacity ? capacity - users.length : spotsAvailable;

  const isExternal = Boolean(externalRsvpUrl?.trim());

  if (isExternal) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-6 font-helvetica">
        <h3 className="text-lg font-bold text-gray-800 font-butler">Registrations</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4 leading-normal font-helvetica">Attendee roster is managed externally.</p>
        
        <div className="rounded-xl border border-[#3BB0C9]/20 bg-[#e3f6fb] p-4 text-xs text-[#1a7a8f] leading-relaxed flex gap-2.5">
          <svg className="w-5 h-5 shrink-0 text-[#1a7a8f] mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <span className="font-bold">Managed via Zoho Backstage</span>
            <p className="mt-1 text-[#1a7a8f]/90 font-medium">
              This event is configured with an external registration URL. Spot availability, ticketing, and student/active roster collections are handled outside of this portal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 font-butler">Registrations</h3>
            <p className="text-xs text-gray-500 mt-1 font-helvetica">Manage attendees for this event.</p>
          </div>
          <div className="hidden sm:block">
            <RegistrationBar capacity={capacity} spotsAvailable={dynamicSpotsAvailable} />
          </div>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-4 font-helvetica overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 outline-none focus:bg-white focus:border-[#3FAE2A] focus:ring-2 focus:ring-[#3FAE2A]/10 transition-all"
            />
          </div>
          <div className="sm:hidden flex items-center justify-center bg-gray-50/50 border border-gray-200 px-4 py-3 rounded-xl">
            <RegistrationBar capacity={capacity} spotsAvailable={dynamicSpotsAvailable} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-2 min-h-[300px]">
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-6 h-6 border-2 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" />
             </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">No registered users found.</div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-[#3FAE2A]/30 hover:bg-[#e8f5e3]/30 transition-all group">
                <Link href={`/admin/members/${u.user_id}`} className="flex-1 min-w-0 flex flex-col hover:text-[#3FAE2A] transition-colors pr-2">
                  <span className="text-sm font-bold text-gray-800 truncate">{u.name}</span>
                  <span className="text-[11px] text-gray-500 truncate">{u.email}</span>
                </Link>
                <button 
                  onClick={() => setUserToRemove(u.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Remove User"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {userToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 font-helvetica">
            <h4 className="text-lg font-bold text-gray-800 font-butler mb-2">Reject Registration</h4>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason/message for rejecting this registration. The user will see this message in their portal.</p>
            
            <textarea
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              placeholder="e.g. This event requires active Associate or Ordinary membership status."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all resize-none mb-6"
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setUserToRemove(null);
                  setRejectionMessage('');
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRemove(userToRemove)}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20"
              >
                Reject Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
