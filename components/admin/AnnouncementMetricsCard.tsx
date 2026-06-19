"use client";

import StatCard from '@/components/admin/ui/StatCard';

export default function AnnouncementMetricsCard({ metrics }: { metrics: { views: number, clicks: number, reactions: number } }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 font-butler">Engagement Metrics</h3>
        <p className="text-xs text-gray-500 mt-1 font-helvetica">Performance of this announcement.</p>
      </div>
      
      <div className="p-6 flex flex-col gap-4 font-helvetica bg-gray-50/30 flex-1">
        <StatCard 
          label="Total Views" 
          value={metrics.views} 
          accent="#3FAE2A" 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>} 
        />
        <StatCard 
          label="Unique Clicks" 
          value={metrics.clicks} 
          accent="#1E9888" 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>} 
        />
        <StatCard 
          label="Reactions" 
          value={metrics.reactions} 
          accent="#FFB547" 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
        />
        
        {/* <div className="mt-4 p-4 bg-[#e3f6fb] rounded-xl border border-[#3BB0C9]/30">
          <p className="text-[13px] text-[#1a7a8f] font-medium leading-relaxed">
            <strong className="font-bold block mb-1">💡 Performance Tip:</strong>
            Announcements with images receive 3x more engagement. Ensure your content is concise and visually appealing.
          </p>
        </div> */}
      </div>
    </div>
  );
}
