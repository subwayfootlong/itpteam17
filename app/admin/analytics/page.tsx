"use client";

import { useEffect, useState, useMemo } from 'react';

interface AnalyticsData {
  kpi: {
    totalViews: number;
    totalRsvps: number;
    conversionRate: string;
    activeMembersCount: number;
    preferredPerk: string;
  };
  dailyStats: {
    date: string;
    views: number;
    rsvps: number;
    perkViews: number;
    announcementViews: number;
    activeUsers: number;
  }[];
  eventRankings: {
    id: string;
    title: string;
    category: string;
    views: number;
    rsvps: number;
    conversionRate: string;
  }[];
  benefitRankings: {
    id: string;
    name: string;
    offer: string;
    clicks: number;
  }[];
  announcementRankings: {
    id: string;
    title: string;
    clicks: number;
  }[];
  cohorts?: {
    dau: number;
    wau: number;
    mau: number;
  };
  hourlyActivity?: number[];
}

type RangeOption = '7d' | '30d' | '90d';
type GraphTab = 'events' | 'benefits' | 'announcements' | 'active_users';

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<RangeOption>('30d');
  const [activeGraphTab, setActiveGraphTab] = useState<GraphTab>('events');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Format today's date
  const todayStr = new Date().toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleRangeChange = (newRange: RangeOption) => {
    setRange(newRange);
    setLoading(true);
    setErrorMsg(null);
  };

  // CSV export helper — properly quoted, multi-section, BOM-prefixed for Excel compatibility
  const handleExportCSV = () => {
    if (!data) return;

    // Wraps cell in double-quotes, escaping any embedded double-quotes
    const q = (v: string | number | null | undefined) => {
      const str = v == null ? '' : String(v);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const row = (cells: (string | number | null | undefined)[]) => cells.map(q).join(',');

    const rangeLabel = range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days';
    const exportedAt = new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });

    const lines: string[] = [];

    // Section 1: KPI Summary
    lines.push('SECTION: KPI Summary');
    lines.push(row(['Exported At', 'Range', 'Total Event Views', 'Total RSVPs', 'Conversion Rate (%)', 'DAU', 'WAU', 'MAU', 'Top Partner']));
    lines.push(row([
      exportedAt, rangeLabel,
      data.kpi.totalViews, data.kpi.totalRsvps, data.kpi.conversionRate,
      data.cohorts?.dau ?? 0, data.cohorts?.wau ?? 0, data.cohorts?.mau ?? 0,
      data.kpi.preferredPerk
    ]));
    lines.push('');

    // Section 2: Daily Activity
    lines.push('SECTION: Daily Activity');
    lines.push(row(['Date', 'Event Views', 'RSVP Clicks', 'Benefit Clicks', 'Announcement Views', 'Active Users']));
    data.dailyStats.forEach(s => {
      lines.push(row([s.date, s.views, s.rsvps, s.perkViews, s.announcementViews ?? 0, s.activeUsers ?? 0]));
    });
    lines.push('');

    // Section 3: Event Rankings
    lines.push('SECTION: Event Performance Rankings');
    lines.push(row(['Rank', 'Event Title', 'Category', 'Views', 'RSVPs', 'Conversion Rate (%)']));
    data.eventRankings.forEach((e, i) => lines.push(row([i + 1, e.title, e.category, e.views, e.rsvps, e.conversionRate])));
    lines.push('');

    // Section 4: Announcement Rankings
    lines.push('SECTION: Announcement View Rankings');
    lines.push(row(['Rank', 'Announcement Title', 'Total Views']));
    (data.announcementRankings ?? []).forEach((a, i) => lines.push(row([i + 1, a.title, a.clicks])));
    lines.push('');

    // Section 5: Benefit Partner Rankings
    lines.push('SECTION: Merchant Partner Benefit Rankings');
    lines.push(row(['Rank', 'Partner Name', 'Offer', 'Clicks']));
    data.benefitRankings.forEach((b, i) => lines.push(row([i + 1, b.name, b.offer, b.clicks])));

    // BOM prefix ensures Excel opens UTF-8 correctly
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pergas-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute Peak Hours String for Active Members Card
  const peakHoursStr = useMemo(() => {
    if (!data || !data.hourlyActivity) return '';
    const topHours = data.hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .filter(h => h.count > 0);

    if (topHours.length === 0) return '';
    return topHours.map(h => {
      const ampm = h.hour >= 12 ? 'PM' : 'AM';
      const displayHour = h.hour % 12 === 0 ? 12 : h.hour % 12;
      return `${displayHour} ${ampm}`;
    }).join(', ');
  }, [data]);

  // Parse preferred perk into merchant name and click counts
  const preferredPerkParsed = useMemo(() => {
    if (!data || !data.kpi.preferredPerk || data.kpi.preferredPerk === 'None') {
      return { name: 'No partner clicks', clicks: 0 };
    }
    const match = data.kpi.preferredPerk.match(/^(.*?)\s*\((\d+)\s+clicks\)$/);
    if (match) {
      return { name: match[1], clicks: parseInt(match[2]) };
    }
    return { name: data.kpi.preferredPerk, clicks: 0 };
  }, [data]);

  useEffect(() => {
    fetch(`/api/admin/analytics?range=${range}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) {
          return r.json().then((errData) => {
            throw new Error(errData.error || `HTTP error! status: ${r.status}`);
          });
        }
        return r.json();
      })
      .then((res) => {
        setData(res);
        setLastRefreshed(new Date());
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load analytics data.');
      })
      .finally(() => setLoading(false));
  }, [range]);

  // Compute SVG Chart coordinates dynamically based on the selected tab
  const svgChart = useMemo(() => {
    if (!data || !data.dailyStats || data.dailyStats.length === 0) return null;

    const stats = data.dailyStats;
    const width = 800;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const pointsCount = stats.length;

    // Resolve values, labels, and colors for the chosen tab
    let values1: number[] = [];
    let values2: number[] | null = null;
    let label1 = '';
    let label2 = '';
    let color1 = '';
    let color2 = '';

    if (activeGraphTab === 'events') {
      values1 = stats.map(s => s.views);
      values2 = stats.map(s => s.rsvps);
      label1 = 'Event Views';
      label2 = 'RSVP Clicks';
      color1 = '#3FAE2A'; // Pergas Green
      color2 = '#1E9888'; // Pergas Teal
    } else if (activeGraphTab === 'benefits') {
      values1 = stats.map(s => s.perkViews);
      label1 = 'Benefit Clicks';
      color1 = '#FFB547'; // Pergas Amber
    } else if (activeGraphTab === 'announcements') {
      values1 = stats.map(s => s.announcementViews ?? 0);
      label1 = 'Announcement Views';
      color1 = '#1E9888'; // Pergas Teal
    } else {
      // active_users
      values1 = stats.map(s => s.activeUsers ?? 0);
      label1 = 'Daily Active Users';
      color1 = '#3FAE2A'; // Pergas Green
    }

    // Find Max Value to scale axis
    const maxVal = Math.max(
      ...values1,
      ...(values2 || []),
      5
    );
    const maxY = Math.ceil(maxVal * 1.2);

    const xCoords = stats.map((_, i) => 
      paddingLeft + (i * chartWidth) / Math.max(pointsCount - 1, 1)
    );

    const yCoords1 = values1.map(val => 
      paddingTop + chartHeight - (val * chartHeight) / maxY
    );

    const yCoords2 = values2 ? values2.map(val => 
      paddingTop + chartHeight - (val * chartHeight) / maxY
    ) : null;

    // Create Path Strings
    const line1 = xCoords.map((x, i) => `${x.toFixed(1)},${yCoords1[i].toFixed(1)}`).join(' L ');
    const line2 = yCoords2 ? xCoords.map((x, i) => `${x.toFixed(1)},${yCoords2[i].toFixed(1)}`).join(' L ') : null;

    const area1 = `M ${xCoords[0].toFixed(1)},${(paddingTop + chartHeight).toFixed(1)} L ${line1} L ${xCoords[xCoords.length - 1].toFixed(1)},${(paddingTop + chartHeight).toFixed(1)} Z`;
    const area2 = yCoords2 ? `M ${xCoords[0].toFixed(1)},${(paddingTop + chartHeight).toFixed(1)} L ${line2} L ${xCoords[xCoords.length - 1].toFixed(1)},${(paddingTop + chartHeight).toFixed(1)} Z` : null;

    // Pick labels (max 6 dates on X axis)
    const labelSteps = Math.ceil(pointsCount / 6);
    const xLabels = stats.map((s, i) => {
      if (i % labelSteps === 0 || i === pointsCount - 1) {
        const parts = s.date.split('-');
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return {
          text: dateObj.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
          x: xCoords[i],
          index: i
        };
      }
      return null;
    }).filter(Boolean);

    // Grid lines Y axis (4 grids)
    const yGridLines = Array.from({ length: 4 }).map((_, i) => {
      const val = Math.round((maxY * i) / 3);
      const y = paddingTop + chartHeight - (val * chartHeight) / maxY;
      return { val, y };
    });

    return {
      width,
      height,
      paddingLeft,
      paddingTop,
      chartHeight,
      chartWidth,
      line1: 'M ' + line1,
      line2: line2 ? 'M ' + line2 : null,
      area1,
      area2,
      xLabels,
      yGridLines,
      label1,
      label2,
      color1,
      color2
    };
  }, [data, activeGraphTab]);



  return (
    <div className="space-y-6 w-full pb-12">
      {/* ── Control Hub Banner (Option C) ────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden relative shadow-md"
        style={{ background: '#1c3829' }}
      >
        {/* Decorative glow circles */}
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(63,174,42,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(63,174,42,0.04)' }}
        />

        <div className="relative px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">

          {/* LEFT — Title + last-refresh timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {/* Live pulse dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FCF5A] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FAE2A]" />
              </span>
              <span className="text-white/50 text-[10px] font-semibold uppercase tracking-widest font-helvetica">
                Pergas Analytics Engine
              </span>
            </div>
            <h2 className="text-white text-[20px] font-bold leading-tight font-butler tracking-tight">
              App Engagement Metrics
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              {/* Clock icon */}
              <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
              <p className="text-white/40 text-[11px] font-medium font-helvetica">
                {lastRefreshed
                  ? `Refreshed at ${lastRefreshed.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · ${todayStr}`
                  : todayStr
                }
              </p>
            </div>
          </div>

          {/* CENTER — Time-range selector */}
          <div className="flex flex-col items-start sm:items-center gap-1">
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest font-helvetica">Time Range</span>
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
              {(['7d', '30d', '90d'] as RangeOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleRangeChange(opt)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    range === opt
                      ? 'bg-[#FFB547] text-[#1c3829] shadow-sm cursor-default'
                      : 'text-white/60 hover:text-white hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  {opt === '7d' ? '7 Days' : opt === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Export CSV button */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest font-helvetica">Export</span>
            <button
              onClick={handleExportCSV}
              disabled={!data || loading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: data && !loading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)'
              }}
              onMouseEnter={e => { if (data && !loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { if (data && !loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
            >
              {/* Download icon */}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16" />
              </svg>
              Export CSV
            </button>
          </div>

        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl font-helvetica text-[13px] space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Database Schema Error
          </div>
          <p>
            {errorMsg.includes('analytics_events')
              ? 'The required database tables are missing. Please execute the SQL migration script located in "docs/supabase-uc10-analytics-schema.sql" in your Supabase SQL Editor to initialize the engagement tracking table.'
              : errorMsg}
          </p>
        </div>
      )}

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !data ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-28" />
          ))
        ) : (
          <>
            {/* KPI: Total Views */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between overflow-hidden relative" style={{ minHeight: '160px' }}>
              <div className="-mx-5 -mt-5 mb-4 bg-[#e8f5e3] text-[#27500A] text-[9.5px] font-bold px-5 py-2.5 border-b border-green-100 flex items-center gap-1.5 rounded-t-xl uppercase">
                <svg className="w-3.5 h-3.5 text-[#27500A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Event Visibility Trend</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-gray-500 font-helvetica uppercase tracking-wider">
                    Total Event Views
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#e8f5e3] text-[#27500A] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    </svg>
                  </div>
                </div>
                <div className="text-[28px] font-bold leading-none font-helvetica tracking-tight text-[#3FAE2A]">
                  {data.kpi.totalViews.toLocaleString()}
                </div>
              </div>
              <div className="text-[11px] mt-1.5 text-gray-400 font-helvetica leading-normal border-t border-gray-50 pt-2">
                Views on details pages
              </div>
            </div>

            {/* KPI: Conversions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between overflow-hidden relative" style={{ minHeight: '160px' }}>
              <div className="-mx-5 -mt-5 mb-4 bg-[#e0f4f1] text-[#1E9888] text-[9.5px] font-bold px-5 py-2.5 border-b border-teal-100 flex items-center gap-1.5 rounded-t-xl uppercase">
                <svg className="w-3.5 h-3.5 text-[#1E9888]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Registration Efficiency</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-gray-500 font-helvetica uppercase tracking-wider">
                    RSVP Conversions
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#e0f4f1] text-[#1E9888] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-[28px] font-bold leading-none font-helvetica tracking-tight text-[#1E9888]">
                  {data.kpi.conversionRate}%
                </div>
              </div>
              <div className="text-[11px] mt-1.5 text-gray-400 font-helvetica leading-normal border-t border-gray-50 pt-2">
                {data.kpi.totalRsvps} RSVP actions logged
              </div>
            </div>

            {/* KPI: Active Members / Cohorts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between overflow-hidden relative" style={{ minHeight: '160px' }}>
              {/* Horizontal Peak Timing Bar at the very top */}
              <div className="-mx-5 -mt-5 mb-4 bg-[#fff4de] text-[#9a6800] text-[9.5px] font-bold px-5 py-2.5 border-b border-orange-100/50 flex items-center gap-1.5 rounded-t-xl uppercase">
                {/* Complete clock icon: outer circle + hour/minute hands */}
                <svg className="w-3.5 h-3.5 text-[#9a6800]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                </svg>
                <span>{peakHoursStr ? `PEAK HOURS: ${peakHoursStr}` : 'Member Traffic Peak'}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-gray-500 font-helvetica uppercase tracking-wider">
                    Active Members (DAU)
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#fff4de] text-[#9a6800] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="text-[28px] font-bold leading-none font-helvetica tracking-tight text-[#FFB547]">
                  {data.cohorts?.dau ?? 0}
                </div>
              </div>
              <div className="text-[11px] mt-1.5 text-gray-400 font-helvetica leading-normal border-t border-gray-50 pt-2">
                WAU: <span className="font-semibold text-gray-700">{data.cohorts?.wau ?? 0}</span> • MAU: <span className="font-semibold text-gray-700">{data.cohorts?.mau ?? 0}</span>
              </div>
            </div>

            {/* KPI: Top Perk */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between overflow-hidden relative" style={{ minHeight: '160px' }}>
              <div className="-mx-5 -mt-5 mb-4 bg-[#fde8e8] text-red-700 text-[9.5px] font-bold px-5 py-2.5 border-b border-red-100 flex items-center gap-1.5 rounded-t-xl uppercase">
                <svg className="w-3.5 h-3.5 text-red-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Top Merchant Partner</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-gray-500 font-helvetica uppercase tracking-wider">
                    Redemption Views
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#fde8e8] text-red-700 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                </div>
                <div className="text-[28px] font-bold leading-none font-helvetica tracking-tight text-red-700">
                  {preferredPerkParsed.clicks}
                </div>
              </div>
              <div className="text-[11px] mt-1.5 text-gray-400 font-helvetica leading-normal border-t border-gray-50 pt-2 truncate" title={preferredPerkParsed.name}>
                For <span className="font-semibold text-gray-700">{preferredPerkParsed.name}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Line-Area Trend Chart ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
          <div className="space-y-2">
            <h3 className="font-bold text-[16px] font-butler text-[#1a2e1a]">
              Engagement Activity Trends
            </h3>
            
            {/* Graph Type Switcher Tabs (Modern Sliding Pill Layout) */}
            <div className="relative flex bg-gray-100 p-1 rounded-full border border-gray-200/60 w-fit gap-1 select-none">
              {[
                { key: 'events', label: 'Events' },
                { key: 'benefits', label: 'Benefit Perks' },
                { key: 'announcements', label: 'Announcements' },
                { key: 'active_users', label: 'Active Members' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveGraphTab(tab.key as GraphTab)}
                  className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-bold transition-all duration-300 ${
                    activeGraphTab === tab.key
                      ? 'bg-[#6FCF5A] text-black shadow-sm border-transparent'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/40 cursor-pointer'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
            {/* Active range indicator (read-only — range controlled by the banner toolbar) */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 font-helvetica">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="uppercase tracking-wider">
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </span>
            </div>

            {/* Legend */}
            {svgChart && (
              <div className="flex items-center gap-3 text-[10px] font-bold font-helvetica">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded inline-block opacity-80" style={{ backgroundColor: svgChart.color1 }} />
                  <span className="text-gray-500">{svgChart.label1}</span>
                </div>
                {svgChart.label2 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded inline-block opacity-80" style={{ backgroundColor: svgChart.color2 }} />
                    <span className="text-gray-500">{svgChart.label2}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {loading || !svgChart ? (
          <div className="h-60 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 animate-pulse">
            <p className="text-[13px] text-gray-400 font-helvetica">Loading chart visualization...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[640px] max-w-[850px] mx-auto">
              <svg
                viewBox={`0 0 ${svgChart.width} ${svgChart.height}`}
                className="w-full h-auto"
                aria-label="App engagement chart"
              >
                <defs>
                  <linearGradient id="color1Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={svgChart.color1} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={svgChart.color1} stopOpacity="0.0" />
                  </linearGradient>
                  {svgChart.color2 && (
                    <linearGradient id="color2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={svgChart.color2} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={svgChart.color2} stopOpacity="0.0" />
                    </linearGradient>
                  )}
                </defs>

                {/* Y Gridlines & Labels */}
                {svgChart.yGridLines.map((line, idx) => (
                  <g key={idx}>
                    <line
                      x1={svgChart.paddingLeft}
                      y1={line.y}
                      x2={svgChart.width - 20}
                      y2={line.y}
                      stroke="#f1f3f1"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={svgChart.paddingLeft - 8}
                      y={line.y + 4}
                      textAnchor="end"
                      fill="#939498"
                      fontSize="10"
                      fontFamily="var(--font-helvetica)"
                      fontWeight="bold"
                    >
                      {line.val}
                    </text>
                  </g>
                ))}

                {/* Area fills */}
                <path d={svgChart.area1} fill="url(#color1Grad)" />
                {svgChart.area2 && <path d={svgChart.area2} fill="url(#color2Grad)" />}

                {/* Line paths */}
                <path
                  d={svgChart.line1}
                  fill="none"
                  stroke={svgChart.color1}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
                {svgChart.line2 && (
                  <path
                    d={svgChart.line2}
                    fill="none"
                    stroke={svgChart.color2}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                )}

                {/* Baseline Axis */}
                <line
                  x1={svgChart.paddingLeft}
                  y1={svgChart.height - 40}
                  x2={svgChart.width - 20}
                  y2={svgChart.height - 40}
                  stroke="#c3e6b3"
                  strokeWidth="1.5"
                />

                {/* X Labels */}
                {svgChart.xLabels.map((lbl, idx) => {
                  if (!lbl) return null;
                  return (
                    <g key={idx}>
                      <line
                        x1={lbl.x}
                        y1={svgChart.height - 40}
                        x2={lbl.x}
                        y2={svgChart.height - 35}
                        stroke="#c3e6b3"
                        strokeWidth="1.5"
                      />
                      <text
                        x={lbl.x}
                        y={svgChart.height - 20}
                        textAnchor="middle"
                        fill="#939498"
                        fontSize="10"
                        fontFamily="var(--font-helvetica)"
                        fontWeight="semibold"
                      >
                        {lbl.text}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ── Table Grid: Event Rankings | Perk Rankings | Announcement Rankings ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Event Standings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(63,174,42,0.1)]">
            <h3 className="font-bold text-[16px] font-butler text-[#1a2e1a]">
              Event Performance Rankings
            </h3>
            <p className="text-[12px] text-gray-400 font-helvetica mt-0.5">
              Ranked by views and RSVP conversions (maximum 10)
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading || !data ? (
              <div className="p-12 text-center animate-pulse space-y-4">
                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-100 rounded w-5/6 mx-auto" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
              </div>
            ) : data.eventRankings.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-[13px] font-medium text-gray-400 font-helvetica">No event engagement recorded</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-[13px] font-helvetica">
                <thead>
                  <tr className="bg-gray-50/50 text-[#585859] font-bold border-b border-gray-100">
                    <th className="py-3 px-4">Event Title</th>
                    <th className="py-3 px-2 text-center">Views</th>
                    <th className="py-3 px-2 text-center">RSVPs</th>
                    <th className="py-3 px-4 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[#1c3829]">
                  {data.eventRankings.map((evt) => {
                    const convPct = parseFloat(evt.conversionRate);
                    return (
                      <tr key={evt.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold max-w-[120px] truncate" title={evt.title}>
                          {evt.title}
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {evt.category}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600 font-semibold">{evt.views}</td>
                        <td className="py-3 px-2 text-center text-gray-600 font-semibold">{evt.rsvps}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-[12px] text-[#1E9888]">{evt.conversionRate}%</span>
                            <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full rounded-full bg-[#1E9888]"
                                style={{ width: `${Math.min(convPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Middle: Partner Benefit Standings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(63,174,42,0.1)]">
            <h3 className="font-bold text-[16px] font-butler text-[#1a2e1a]">
              Merchant Partner Clicks
            </h3>
            <p className="text-[12px] text-gray-400 font-helvetica mt-0.5">
              Ranked by total member views on redemption offer detail modal
            </p>
          </div>

          <div className="p-4 space-y-4">
            {loading || !data ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
              ))
            ) : data.benefitRankings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[13px] font-medium text-gray-400 font-helvetica">No partner benefit clicks recorded</p>
              </div>
            ) : (
              data.benefitRankings.map((ben, idx) => {
                const topCount = data.benefitRankings[0]?.clicks ?? 1;
                const ratio = Math.min((ben.clicks / topCount) * 100, 100);
                return (
                  <div key={ben.id} className="space-y-1 font-helvetica text-[13px]">
                    <div className="flex items-center justify-between text-[#1c3829]">
                      <span className="font-semibold text-gray-700 max-w-[150px] truncate" title={ben.name}>
                        {idx + 1}. {ben.name}
                        <span className="text-[10px] text-gray-400 font-normal ml-2">
                          {ben.offer}
                        </span>
                      </span>
                      <span className="font-bold text-[#FFB547]">{ben.clicks} views</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FFB547] transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Announcement Views */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(63,174,42,0.1)]">
            <h3 className="font-bold text-[16px] font-butler text-[#1a2e1a]">
              Official Announcement Views
            </h3>
            <p className="text-[12px] text-gray-400 font-helvetica mt-0.5">
              Ranked by total member details page views (maximum 10)
            </p>
          </div>

          <div className="p-4 space-y-4">
            {loading || !data ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
              ))
            ) : !data.announcementRankings || data.announcementRankings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[13px] font-medium text-gray-400 font-helvetica">No announcement views recorded</p>
              </div>
            ) : (
              data.announcementRankings.map((ann, idx) => {
                const topCount = data.announcementRankings[0]?.clicks ?? 1;
                const ratio = Math.min((ann.clicks / topCount) * 100, 100);
                return (
                  <div key={ann.id} className="space-y-1 font-helvetica text-[13px]">
                    <div className="flex items-center justify-between text-[#1c3829]">
                      <span className="font-semibold text-gray-700 max-w-[150px] truncate" title={ann.title}>
                        {idx + 1}. {ann.title}
                      </span>
                      <span className="font-bold text-[#1E9888]">{ann.clicks} views</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1E9888] transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
