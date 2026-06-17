"use client";

import React from 'react';


export default function EngagementTrackingPage() {
  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 font-butler" >
            Executive Engagement Overview
          </h2>
          <p className="text-[14px] text-gray-500 mt-1 font-helvetica" >
            Institutional data analysis for the period of Oct 1 - Oct 31, 2023.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all font-helvetica" >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3FAE2A] hover:bg-[#35941f] text-white rounded-lg text-sm font-bold shadow-md shadow-[#3FAE2A]/20 transition-all font-helvetica" >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            PDF Report
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total App Users', value: '12,840', change: '+12%', isPos: true, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, bg: 'bg-[#e8f5e3]', text: 'text-[#27500A]' },
          { label: 'Monthly Active Users', value: '4,212', change: '+8%', isPos: true, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, bg: 'bg-[#e3f6fb]', text: 'text-[#1a7a8f]' },
          { label: 'Event Registrations', value: '894', change: '-3%', isPos: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, bg: 'bg-[#fff4de]', text: 'text-[#9a6800]' },
          { label: 'Announcement Reach', value: '28.4k', change: '+24%', isPos: true, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>, bg: 'bg-[#f0f0f0]', text: 'text-[#585859]' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg} ${stat.text}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-md ${stat.isPos ? 'bg-[#e8f5e3] text-[#3FAE2A]' : 'bg-red-50 text-red-600'} font-helvetica`} >
                {stat.isPos ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>}
                {stat.change}
              </div>
            </div>
            <div className="text-[13px] font-medium text-gray-500 mb-1 font-helvetica" >
              {stat.label}
            </div>
            <div className="text-[28px] font-bold text-gray-900 font-butler" >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts / Funnel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-gray-900 font-butler" >
              Monthly Active Users Trend
            </h3>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-md px-2 py-1 outline-none font-medium font-helvetica" >
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
            </select>
          </div>
          <div className="relative h-64 w-full flex items-end justify-between px-2 pb-6">
            {/* Fake SVG Line Chart */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,80 Q20,80 40,60 T70,40 T100,45" fill="none" stroke="#3FAE2A" strokeWidth="2" />
              <path d="M0,80 Q20,80 40,60 T70,40 T100,45 V100 H0 Z" fill="url(#gradient)" opacity="0.1" />
              <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3FAE2A" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400 font-medium font-helvetica" >
              <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-[18px] font-bold text-gray-900 mb-6 font-butler" >
            Event Conversions
          </h3>
          <div className="flex-1 flex flex-col justify-between font-helvetica" >
            {[
              { label: 'Views', value: '12,400', pct: '100%', width: '100%', color: 'bg-[#1c3829]' },
              { label: 'Clicks', value: '3,820', pct: '31%', width: '70%', color: 'bg-[#98b898]' },
              { label: 'Registrations', value: '894', pct: '7%', width: '40%', color: 'bg-[#5e8f5e]' },
              { label: 'Attendance', value: '642', pct: '5%', width: '20%', color: 'bg-[#1c3829]' },
            ].map((step, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-600">{step.label}</span>
                  <span className="text-gray-900">{step.value} <span className="text-gray-400 font-normal">({step.pct})</span></span>
                </div>
                <div className="w-full flex justify-center">
                  <div className={`h-6 rounded-sm ${step.color} transition-all`} style={{ width: step.width }}></div>
                </div>
              </div>
            ))}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Conversion Rate</span>
              <span className="text-lg font-bold text-[#3FAE2A]">5.18%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Growth (YTD) — moved from Dashboard */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[16px] font-bold font-butler text-[#1c3829]">
              Member Growth (YTD)
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5 font-helvetica">New registrations per month</p>
          </div>
          <span className="text-[11px] text-[#3FAE2A] font-bold uppercase tracking-wider font-helvetica cursor-pointer hover:underline">Export CSV</span>
        </div>
        {/* Bar chart */}
        <div className="h-48 w-full relative overflow-hidden">
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="absolute w-full border-t border-dashed border-gray-100"
              style={{ bottom: `${pct}%` }}
            />
          ))}
          <div className="absolute bottom-0 w-full flex items-end justify-around px-2 gap-1.5 h-full">
            {[
              { h: 40, label: 'Jan' },
              { h: 65, label: 'Feb' },
              { h: 45, label: 'Mar' },
              { h: 80, label: 'Apr' },
              { h: 55, label: 'May' },
              { h: 90, label: 'Jun' },
              { h: 75, label: 'Jul' },
              { h: 110, label: 'Aug' },
              { h: 85, label: 'Sep' },
              { h: 120, label: 'Oct' },
              { h: 95, label: 'Nov' },
              { h: 130, label: 'Dec' },
            ].map(({ h, label }, i) => {
              const pct = Math.min((h / 140) * 100, 100);
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                  <div className="w-full relative rounded-t-sm overflow-hidden" style={{ height: `${pct}%` }}>
                    <div className="absolute inset-0 bg-[#e8f5e3]" />
                    <div className="absolute bottom-0 inset-x-0 bg-[#3FAE2A] rounded-t-sm" style={{ height: '70%' }} />
                  </div>
                  <span className="text-[9px] font-medium text-gray-400 font-helvetica">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Popular Events */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-[16px] font-bold text-gray-900 font-butler" >
              Most Popular Events
            </h3>
            <span className="text-xs font-bold text-[#3FAE2A] cursor-pointer font-helvetica" >View All</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-helvetica" >
              <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Registrations</th>
                  <th className="px-6 py-3 font-semibold">Score</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {[
                  { name: 'Regional Shariah Summit', reg: 452, score: '9.8/10', status: 'LIVE', statusColor: 'bg-[#e8f5e3] text-[#27500A]' },
                  { name: 'Youth Leadership Workshop', reg: 312, score: '8.4/10', status: 'CLOSED', statusColor: 'bg-gray-100 text-gray-600' },
                  { name: 'Quranic Arabic Mastery', reg: 288, score: '9.1/10', status: 'LIVE', statusColor: 'bg-[#e8f5e3] text-[#27500A]' },
                  { name: 'Community Aid Gala', reg: 154, score: '7.9/10', status: 'DRAFT', statusColor: 'bg-[#fff4de] text-[#9a6800]' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-800">{row.name}</td>
                    <td className="px-6 py-4 text-gray-600">{row.reg}</td>
                    <td className="px-6 py-4 text-gray-600">{row.score}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Engaged Members */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-[16px] font-bold text-gray-900 font-butler" >
              Most Engaged Members
            </h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-helvetica" >
              <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 font-semibold">Member Name</th>
                  <th className="px-6 py-3 font-semibold">Participation</th>
                  <th className="px-6 py-3 font-semibold">Activity Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {[
                  { name: 'Abdullah Ahmad', initials: 'AA', events: '14 Events', color: 'bg-[#1E9888]', score: 95 },
                  { name: 'Fatimah Mansur', initials: 'FM', events: '12 Events', color: 'bg-[#3BB0C9]', score: 85 },
                  { name: 'Zaid Suleiman', initials: 'ZS', events: '11 Events', color: 'bg-[#FFB547]', score: 75 },
                  { name: 'Khadijah Lutfi', initials: 'KL', events: '9 Events', color: 'bg-[#3FAE2A]', score: 60 },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${row.color} text-white flex items-center justify-center text-[10px] font-bold opacity-80`}>
                        {row.initials}
                      </div>
                      <span className="font-bold text-gray-800">{row.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{row.events}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${row.color} h-2 rounded-full`} style={{ width: `${row.score}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Administrative Insight */}
      <div className="bg-[#e8f5e3] border border-[#c3e6b3] rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#3FAE2A] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div className="font-helvetica">
          <h4 className="text-[15px] font-bold text-[#1c3829] mb-1">Administrative Insight</h4>
          <p className="text-[13px] text-[#2c5230] leading-relaxed">
            Based on the last 30 days of data, announcement engagement is at an all-time high (+24%), primarily driven by video content. However, event registrations have dipped slightly (-3%). We recommend correlating announcement timing with event launch dates to leverage high traffic spikes.
          </p>
          <button className="mt-3 text-[12px] font-bold tracking-wide text-[#3FAE2A] hover:text-[#27500A] uppercase flex items-center gap-1 transition-colors">
            Optimize Campaigns
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
