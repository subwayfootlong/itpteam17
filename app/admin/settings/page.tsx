"use client";

import { useState } from 'react';

type SettingsTab = 'general' | 'membership' | 'notifications' | 'security' | 'appearance' | 'data';

interface SaveState {
  tab: SettingsTab | null;
  status: 'idle' | 'saving' | 'saved' | 'error';
}

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'general',
    label: 'General',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    key: 'membership',
    label: 'Membership',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    key: 'security',
    label: 'Security',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    key: 'appearance',
    label: 'Appearance',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
      </svg>
    ),
  },
  {
    key: 'data',
    label: 'Data & Privacy',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
];

// ── Reusable UI primitives ────────────────────────────────────────────────────

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-[15px] font-butler text-[#1a2e1a]">{title}</h3>
        {description && <p className="text-[12px] text-gray-400 font-helvetica mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
      <div className="sm:w-52 flex-shrink-0 pt-1">
        <label className="block text-[13px] font-semibold text-gray-700 font-helvetica">{label}</label>
        {hint && <p className="text-[11px] text-gray-400 font-helvetica mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 bg-gray-50 text-gray-800 font-helvetica focus:outline-none focus:border-[#3FAE2A] focus:ring-1 focus:ring-[#3FAE2A]/30 transition-all"
    />
  );
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3FAE2A]/40 ${
        checked ? 'bg-[#3FAE2A]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

function ToggleRow({ label, hint, checked, onChange, id }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px] font-semibold text-gray-700 font-helvetica">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 font-helvetica mt-0.5 leading-snug">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} id={id} />
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 bg-gray-50 text-gray-800 font-helvetica focus:outline-none focus:border-[#3FAE2A] focus:ring-1 focus:ring-[#3FAE2A]/30 transition-all cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SaveButton({ onSave, state, tab }: { onSave: () => void; state: SaveState; tab: SettingsTab }) {
  const isSaving = state.tab === tab && state.status === 'saving';
  const isSaved  = state.tab === tab && state.status === 'saved';
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
      {isSaved && (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3FAE2A] font-helvetica">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Changes saved
        </span>
      )}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-5 py-2 rounded-lg text-[12px] font-bold font-helvetica transition-all disabled:opacity-60 hover:brightness-110"
        style={{ background: '#3FAE2A', color: '#fff' }}
      >
        {isSaving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saveState, setSaveState] = useState<SaveState>({ tab: null, status: 'idle' });

  // ── General ──────────────────────────────────────────────────────────────
  const [portalName, setPortalName]         = useState('Pergas Member Portal');
  const [orgName, setOrgName]               = useState('Pergas');
  const [supportEmail, setSupportEmail]     = useState('admin@pergas.org.sg');
  const [timezone, setTimezone]             = useState('Asia/Singapore');
  const [language, setLanguage]             = useState('en');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // ── Membership ───────────────────────────────────────────────────────────
  const [defaultMemberType, setDefaultMemberType] = useState('ordinary');
  const [memberIdPrefix, setMemberIdPrefix]        = useState('PGS');
  const [requireApproval, setRequireApproval]      = useState(false);
  const [renewalReminderDays, setRenewalReminderDays] = useState('30');
  const [gracePeriodDays, setGracePeriodDays]      = useState('14');
  const [autoExpire, setAutoExpire]                = useState(true);

  // ── Notifications ────────────────────────────────────────────────────────
  const [notifEmailEnabled, setNotifEmailEnabled]      = useState(true);
  const [notifInAppEnabled, setNotifInAppEnabled]      = useState(true);
  const [notifDigestFreq, setNotifDigestFreq]          = useState('daily');
  const [notifEventRsvp, setNotifEventRsvp]            = useState(true);
  const [notifNewMember, setNotifNewMember]            = useState(true);
  const [notifRenewalDue, setNotifRenewalDue]          = useState(true);
  const [notifCommentFlagged, setNotifCommentFlagged]  = useState(true);
  const [notifSystemAlerts, setNotifSystemAlerts]      = useState(true);

  // ── Security ─────────────────────────────────────────────────────────────
  const [sessionTimeout, setSessionTimeout]   = useState('60');
  const [loginRateLimit, setLoginRateLimit]   = useState('5');
  const [require2FA, setRequire2FA]           = useState(false);
  const [allowedDomains, setAllowedDomains]   = useState('');
  const [auditLog, setAuditLog]               = useState(true);

  // ── Appearance ───────────────────────────────────────────────────────────
  const [primaryColor, setPrimaryColor]   = useState('#3FAE2A');
  const [accentColor, setAccentColor]     = useState('#FFB547');
  const [darkMode, setDarkMode]           = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);

  // ── Data & Privacy ───────────────────────────────────────────────────────
  const [retentionDays, setRetentionDays]       = useState('365');
  const [analyticsOptIn, setAnalyticsOptIn]     = useState(true);
  const [cookieConsent, setCookieConsent]       = useState(true);
  const [dataExportEnabled, setDataExportEnabled] = useState(true);

  const handleSave = (tab: SettingsTab) => {
    setSaveState({ tab, status: 'saving' });
    setTimeout(() => {
      setSaveState({ tab, status: 'saved' });
      setTimeout(() => setSaveState({ tab: null, status: 'idle' }), 2500);
    }, 750);
  };

  return (
    <div className="space-y-6 w-full pb-12">

      {/* ── Header Banner ────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden relative shadow-md" style={{ background: '#1c3829' }}>
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(63,174,42,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <div className="relative px-7 py-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FAE2A]" />
            <span className="text-white/60 text-[11px] font-semibold uppercase tracking-widest font-helvetica">Admin Portal</span>
          </div>
          <h2 className="text-white text-[24px] font-bold leading-tight font-butler tracking-tight">Settings</h2>
          <p className="text-white/50 text-[13px] mt-1 font-helvetica">
            Configure your portal preferences, membership rules, security policies, and more.
          </p>
        </div>
      </div>

      {/* ── Tab Layout ───────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar nav */}
        <aside className="lg:w-52 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium font-helvetica text-left transition-all border-l-[3px] ${
                  activeTab === tab.key
                    ? 'bg-[#e8f5e3] text-[#1a2e1a] border-[#3FAE2A] font-bold'
                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className={activeTab === tab.key ? 'text-[#3FAE2A]' : 'text-gray-400'}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* ── GENERAL ────────────────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <>
              <SettingsSection title="Portal Identity" description="Displayed throughout the member-facing application.">
                <FieldRow label="Portal Name" hint="Shown in the browser tab and email subjects.">
                  <TextInput value={portalName} onChange={setPortalName} placeholder="Pergas Member Portal" />
                </FieldRow>
                <FieldRow label="Organisation Name" hint="Your full legal organisation name.">
                  <TextInput value={orgName} onChange={setOrgName} placeholder="Pergas" />
                </FieldRow>
                <FieldRow label="Support Email" hint="Members contact this address for help.">
                  <TextInput value={supportEmail} onChange={setSupportEmail} type="email" placeholder="admin@pergas.org.sg" />
                </FieldRow>
                <SaveButton onSave={() => handleSave('general')} state={saveState} tab="general" />
              </SettingsSection>

              <SettingsSection title="Localisation" description="Timezone and language defaults for all users.">
                <FieldRow label="Timezone">
                  <SelectInput value={timezone} onChange={setTimezone} options={[
                    { value: 'Asia/Singapore',    label: 'Asia/Singapore (SGT, UTC+8)' },
                    { value: 'UTC',               label: 'UTC' },
                    { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala Lumpur (MYT, UTC+8)' },
                    { value: 'Asia/Jakarta',      label: 'Asia/Jakarta (WIB, UTC+7)' },
                  ]} />
                </FieldRow>
                <FieldRow label="Interface Language">
                  <SelectInput value={language} onChange={setLanguage} options={[
                    { value: 'en', label: 'English' },
                    { value: 'ms', label: 'Bahasa Melayu' },
                  ]} />
                </FieldRow>
                <SaveButton onSave={() => handleSave('general')} state={saveState} tab="general" />
              </SettingsSection>

              <SettingsSection title="Maintenance" description="Temporarily restrict member access for planned downtime.">
                <ToggleRow
                  id="maintenance-mode"
                  label="Maintenance Mode"
                  hint="When on, members see a maintenance page. Admins can still log in."
                  checked={maintenanceMode}
                  onChange={setMaintenanceMode}
                />
                <SaveButton onSave={() => handleSave('general')} state={saveState} tab="general" />
              </SettingsSection>
            </>
          )}

          {/* ── MEMBERSHIP ─────────────────────────────────────────────────── */}
          {activeTab === 'membership' && (
            <>
              <SettingsSection title="Member Registration" description="Control how new members are onboarded.">
                <FieldRow label="Default Member Type" hint="Applied to all newly registered accounts.">
                  <SelectInput value={defaultMemberType} onChange={setDefaultMemberType} options={[
                    { value: 'ordinary',  label: 'Ordinary Member' },
                    { value: 'associate', label: 'Associate Member' },
                    { value: 'student',   label: 'Student Member' },
                    { value: 'honorary',  label: 'Honorary Member' },
                  ]} />
                </FieldRow>
                <FieldRow label="Member ID Prefix" hint="Prepended to auto-generated member IDs (e.g. PGS-0001).">
                  <TextInput value={memberIdPrefix} onChange={setMemberIdPrefix} placeholder="PGS" />
                </FieldRow>
                <ToggleRow
                  id="require-approval"
                  label="Require Admin Approval"
                  hint="New registrations are held as 'pending' until an admin approves them."
                  checked={requireApproval}
                  onChange={setRequireApproval}
                />
                <SaveButton onSave={() => handleSave('membership')} state={saveState} tab="membership" />
              </SettingsSection>

              <SettingsSection title="Renewal & Expiry" description="Configure how membership renewal is handled.">
                <FieldRow label="Renewal Reminder (days)" hint="Days before expiry to send the first renewal reminder email.">
                  <TextInput value={renewalReminderDays} onChange={setRenewalReminderDays} type="number" placeholder="30" />
                </FieldRow>
                <FieldRow label="Grace Period (days)" hint="After expiry, members retain access for this many days before losing it.">
                  <TextInput value={gracePeriodDays} onChange={setGracePeriodDays} type="number" placeholder="14" />
                </FieldRow>
                <ToggleRow
                  id="auto-expire"
                  label="Auto-Expire Memberships"
                  hint="Automatically mark memberships as expired when the expiry date passes."
                  checked={autoExpire}
                  onChange={setAutoExpire}
                />
                <SaveButton onSave={() => handleSave('membership')} state={saveState} tab="membership" />
              </SettingsSection>
            </>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <>
              <SettingsSection title="Delivery Channels" description="Choose how admins receive notifications.">
                <ToggleRow id="notif-email" label="Email Notifications" hint="Send event alerts to the admin support email address." checked={notifEmailEnabled} onChange={setNotifEmailEnabled} />
                <ToggleRow id="notif-inapp" label="In-App Notifications" hint="Show a notification badge and slide-in panel inside the admin portal." checked={notifInAppEnabled} onChange={setNotifInAppEnabled} />
                <FieldRow label="Digest Frequency" hint="How often to bundle multiple notifications into a single digest email.">
                  <SelectInput value={notifDigestFreq} onChange={setNotifDigestFreq} options={[
                    { value: 'realtime', label: 'Real-time (immediate)' },
                    { value: 'daily',    label: 'Daily digest' },
                    { value: 'weekly',   label: 'Weekly digest' },
                    { value: 'off',      label: 'No digest (triggers only)' },
                  ]} />
                </FieldRow>
                <SaveButton onSave={() => handleSave('notifications')} state={saveState} tab="notifications" />
              </SettingsSection>

              <SettingsSection title="Admin Alert Triggers" description="Select which events trigger a notification to the admin.">
                <ToggleRow id="notif-rsvp"    label="Member RSVPs for an Event"    hint="Fired each time any member registers for an event."              checked={notifEventRsvp}      onChange={setNotifEventRsvp} />
                <ToggleRow id="notif-member"  label="New Member Registration"       hint="Fired when a new account is created."                           checked={notifNewMember}      onChange={setNotifNewMember} />
                <ToggleRow id="notif-renewal" label="Membership Renewal Due"        hint="Fired when a member enters the renewal reminder window."        checked={notifRenewalDue}     onChange={setNotifRenewalDue} />
                <ToggleRow id="notif-flagged" label="Community Comment Flagged"     hint="Fired when a member post is automatically or manually flagged." checked={notifCommentFlagged} onChange={setNotifCommentFlagged} />
                <ToggleRow id="notif-system"  label="System Alerts"                 hint="DB errors, failed email sends, schema issues, etc."             checked={notifSystemAlerts}   onChange={setNotifSystemAlerts} />
                <SaveButton onSave={() => handleSave('notifications')} state={saveState} tab="notifications" />
              </SettingsSection>
            </>
          )}

          {/* ── SECURITY ───────────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <>
              <SettingsSection title="Session Management" description="Control how long admin sessions remain active.">
                <FieldRow label="Session Timeout (minutes)" hint="Admins are automatically logged out after this period of inactivity.">
                  <TextInput value={sessionTimeout} onChange={setSessionTimeout} type="number" placeholder="60" />
                </FieldRow>
                <FieldRow label="Max Failed Login Attempts" hint="Account is temporarily locked after this many consecutive failures.">
                  <TextInput value={loginRateLimit} onChange={setLoginRateLimit} type="number" placeholder="5" />
                </FieldRow>
                <SaveButton onSave={() => handleSave('security')} state={saveState} tab="security" />
              </SettingsSection>

              <SettingsSection title="Access Controls" description="Restrict who can access the admin portal.">
                <ToggleRow
                  id="require-2fa"
                  label="Require Two-Factor Authentication"
                  hint="All admin accounts must set up TOTP (e.g. Google Authenticator) before logging in."
                  checked={require2FA}
                  onChange={setRequire2FA}
                />
                <FieldRow label="Allowed Email Domains" hint="Comma-separated list. Leave blank to allow any domain.">
                  <TextInput value={allowedDomains} onChange={setAllowedDomains} placeholder="pergas.org.sg, muis.gov.sg" />
                </FieldRow>
                <SaveButton onSave={() => handleSave('security')} state={saveState} tab="security" />
              </SettingsSection>

              <SettingsSection title="Audit Logging" description="Track all administrative actions in the system.">
                <ToggleRow
                  id="audit-log"
                  label="Enable Audit Log"
                  hint="Record every admin action (login, edit, delete) with a timestamp and user attribution."
                  checked={auditLog}
                  onChange={setAuditLog}
                />
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-2">
                  <button
                    className="px-4 py-2 rounded-lg text-[12px] font-bold font-helvetica text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                    onClick={() => alert('Audit log export — coming soon.')}
                  >
                    Export Audit Log
                  </button>
                  <button
                    onClick={() => handleSave('security')}
                    disabled={saveState.tab === 'security' && saveState.status === 'saving'}
                    className="px-5 py-2 rounded-lg text-[12px] font-bold font-helvetica transition-all disabled:opacity-60 hover:brightness-110"
                    style={{ background: '#3FAE2A', color: '#fff' }}
                  >
                    {saveState.tab === 'security' && saveState.status === 'saving' ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </SettingsSection>
            </>
          )}

          {/* ── APPEARANCE ─────────────────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <>
              <SettingsSection title="Brand Colours" description="Customise the portal colour palette. Changes apply to buttons, highlights, and accents.">
                <FieldRow label="Primary Colour" hint="Main brand colour — used on buttons and active nav states.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white flex-shrink-0"
                    />
                    <TextInput value={primaryColor} onChange={setPrimaryColor} placeholder="#3FAE2A" />
                  </div>
                </FieldRow>
                <FieldRow label="Accent / CTA Colour" hint="Used on call-to-action buttons (currently Pergas Amber #FFB547).">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white flex-shrink-0"
                    />
                    <TextInput value={accentColor} onChange={setAccentColor} placeholder="#FFB547" />
                  </div>
                </FieldRow>
                <SaveButton onSave={() => handleSave('appearance')} state={saveState} tab="appearance" />
              </SettingsSection>

              <SettingsSection title="Layout Preferences" description="Control how the admin interface is displayed.">
                <ToggleRow id="dark-mode"       label="Dark Mode"       hint="Switch the admin portal to a dark colour scheme. (Coming soon)"           checked={darkMode}       onChange={setDarkMode} />
                <ToggleRow id="compact-layout"  label="Compact Layout"  hint="Reduce padding and font sizes for higher information density. (Coming soon)" checked={compactLayout}  onChange={setCompactLayout} />
                <SaveButton onSave={() => handleSave('appearance')} state={saveState} tab="appearance" />
              </SettingsSection>
            </>
          )}

          {/* ── DATA & PRIVACY ─────────────────────────────────────────────── */}
          {activeTab === 'data' && (
            <>
              <SettingsSection title="Data Retention" description="Control how long member and activity data is kept.">
                <FieldRow label="Analytics Retention Period" hint="Engagement events older than this are automatically purged.">
                  <SelectInput value={retentionDays} onChange={setRetentionDays} options={[
                    { value: '90',  label: '90 days' },
                    { value: '180', label: '180 days' },
                    { value: '365', label: '1 year (default)' },
                    { value: '730', label: '2 years' },
                    { value: '0',   label: 'Keep forever' },
                  ]} />
                </FieldRow>
                <ToggleRow id="analytics-opt-in" label="Portal-wide Analytics"       hint="Enable aggregated engagement tracking across the member app."              checked={analyticsOptIn}     onChange={setAnalyticsOptIn} />
                <ToggleRow id="cookie-consent"   label="Cookie Consent Banner"        hint="Show the PDPA-compliant cookie consent notice to new visitors."           checked={cookieConsent}      onChange={setCookieConsent} />
                <SaveButton onSave={() => handleSave('data')} state={saveState} tab="data" />
              </SettingsSection>

              <SettingsSection title="Member Data Export" description="Allow or restrict data portability features.">
                <ToggleRow
                  id="data-export"
                  label="Enable Member Data Export"
                  hint="Admins can download full member datasets as CSV from the Members page."
                  checked={dataExportEnabled}
                  onChange={setDataExportEnabled}
                />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-700 font-helvetica">Export All Member Data</p>
                    <p className="text-[11px] text-gray-400 font-helvetica mt-0.5">Download a complete CSV of all registered members for compliance or migration.</p>
                  </div>
                  <button
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold font-helvetica border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                    onClick={() => alert('Full member export — coming soon.')}
                  >
                    Export CSV
                  </button>
                </div>
              </SettingsSection>

              <SettingsSection title="Danger Zone" description="Irreversible actions — proceed with extreme caution.">
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-red-700 font-helvetica">Flush Analytics Events</p>
                      <p className="text-[11px] text-red-400 font-helvetica mt-0.5">Permanently delete all rows in the analytics_events table. This cannot be undone.</p>
                    </div>
                    <button
                      className="flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold font-helvetica bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-all"
                      onClick={() => {
                        if (window.confirm('This will permanently delete all analytics data. Are you absolutely sure?')) {
                          alert('Flush Events — coming soon.');
                        }
                      }}
                    >
                      Flush Events
                    </button>
                  </div>
                </div>
              </SettingsSection>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
