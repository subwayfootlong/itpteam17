"use client";

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  BATCH_ONBOARDING_HEADERS,
  type BatchOnboardingResult,
  type BatchOnboardingRow,
  csvCell,
  parseCsv,
} from '@/lib/batchOnboarding';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const TEMPLATE_ROW = ['mr', 'Ahmad', 'Rahman', 'ahmad@example.com', '+65 91234567', 'Pergas', 'Educator', 'active'];

function downloadCsv(filename: string, rows: ReadonlyArray<ReadonlyArray<unknown>>) {
  const content = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BatchOnboardingPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BatchOnboardingRow[]>([]);
  const [results, setResults] = useState<BatchOnboardingResult[]>([]);
  const [fileError, setFileError] = useState('');
  const [importing, setImporting] = useState(false);

  const counts = useMemo(() => ({
    created: results.filter((result) => result.status === 'created').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
    failed: results.filter((result) => result.status === 'failed').length,
  }), [results]);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults([]);
    setFileError('');

    try {
      const parsed = parseCsv(await file.text());
      const headers = parsed[0]?.map((header) => header.trim().toLowerCase().replace(/^\uFEFF/, '')) ?? [];
      const missing = BATCH_ONBOARDING_HEADERS.filter((header) => !headers.includes(header));
      if (missing.length > 0) {
        setRows([]);
        setFileError(`Missing columns: ${missing.join(', ')}`);
        return;
      }
      const mapped = parsed.slice(1).map((values, index) => {
        const row = { rowNumber: index + 2 } as BatchOnboardingRow;
        for (const header of BATCH_ONBOARDING_HEADERS) {
          row[header] = values[headers.indexOf(header)]?.trim() ?? '';
        }
        return row;
      });
      if (mapped.length === 0) setFileError('The CSV does not contain any member rows.');
      if (mapped.length > 100) setFileError('A batch can contain at most 100 member rows.');
      setRows(mapped);
    } catch {
      setRows([]);
      setFileError('The CSV could not be read. Download the template and try again.');
    }
  };

  const importMembers = async () => {
    if (!rows.length || fileError) return;
    setImporting(true);
    try {
      const response = await fetch('/api/admin/batch-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Import failed');
      setResults(data.results ?? []);
      const created = Number(data.summary?.created ?? 0);
      if (created > 0) toast.success(`${created} member${created === 1 ? '' : 's'} created. Download the report now to keep the temporary passwords.` , 7000);
      else toast.warning('No members were created. Review the result messages.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setRows([]);
    setResults([]);
    setFileName('');
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-5 pb-12 font-helvetica">
      <div>
        <h2 className="text-[22px] font-bold font-butler text-[#1a2e1a]">Batch Onboarding</h2>
        <p className="mt-1 text-[13px] text-gray-500">Create up to 100 member accounts from one CSV. New accounts start as active Basic-tier members.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#e8f5e3] text-[#27500A] font-bold">1</div>
            <div className="flex-1">
              <h3 className="font-bold text-[#1a2e1a]">Prepare the CSV</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-gray-500">Keep the header names unchanged. Salutation accepts mr, ms, ustaz or ustazah. ARS status accepts no, active, pending or expired.</p>
              <button type="button" onClick={() => downloadCsv('pergas-batch-onboarding-template.csv', [BATCH_ONBOARDING_HEADERS, TEMPLATE_ROW])} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50">
                ↓ Download template
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#e3f6fb] text-[#1a7a8f] font-bold">2</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#1a2e1a]">Upload and review</h3>
              <p className="mt-1 text-[12px] text-gray-500">Existing emails and repeated rows are skipped; they are never overwritten.</p>
              <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={selectFile} className="hidden" />
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-[#3FAE2A] px-4 py-2 text-[13px] font-bold text-white hover:brightness-105">Choose CSV</button>
                {fileName && <button type="button" onClick={clearFile} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-50">Clear</button>}
              </div>
              {fileName && <p className="mt-3 truncate text-[12px] font-semibold text-gray-600">{fileName} · {rows.length} rows</p>}
              {fileError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">{fileError}</p>}
            </div>
          </div>
        </section>
      </div>

      {rows.length > 0 && !fileError && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div><h3 className="font-bold text-[#1a2e1a]">Import preview</h3><p className="text-[12px] text-gray-500">Verify the names, emails and phone numbers before creating accounts.</p></div>
            <button type="button" onClick={importMembers} disabled={importing || results.length > 0} className="rounded-lg bg-[#3FAE2A] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
              {importing ? <LoadingSpinner label="Creating accounts…" size="sm" light /> : results.length ? 'Import completed' : `Create ${rows.length} accounts`}
            </button>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full min-w-[900px] text-left text-[12px]">
              <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Row</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Organization</th><th className="px-4 py-3">ARS</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{rows.map((row) => <tr key={row.rowNumber} className="hover:bg-gray-50/60"><td className="px-4 py-3 text-gray-400">{row.rowNumber}</td><td className="px-4 py-3 font-semibold text-gray-800">{row.first_name} {row.last_name}</td><td className="px-4 py-3 text-gray-600">{row.email}</td><td className="px-4 py-3 text-gray-600">{row.phone}</td><td className="px-4 py-3 text-gray-600">{row.organization}</td><td className="px-4 py-3 text-gray-600">{row.ars_status}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div><h3 className="font-bold text-[#1a2e1a]">Import results</h3><p className="text-[12px] text-gray-500"><span className="font-bold text-green-700">{counts.created} created</span> · {counts.skipped} skipped · {counts.failed} failed. Temporary passwords are shown only in this report.</p></div>
            <button type="button" onClick={() => downloadCsv(`pergas-onboarding-results-${Date.now()}.csv`, [['row', 'email', 'status', 'message', 'temporary_password'], ...results.map((result) => [result.rowNumber, result.email, result.status, result.message, result.temporaryPassword ?? ''])])} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50">↓ Download result report</button>
          </div>
          <div className="max-h-[360px] overflow-auto"><table className="w-full min-w-[760px] text-left text-[12px]"><thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Row</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Temporary password</th></tr></thead><tbody className="divide-y divide-gray-100">{results.map((result) => <tr key={`${result.rowNumber}-${result.email}`}><td className="px-4 py-3 text-gray-400">{result.rowNumber}</td><td className="px-4 py-3 font-medium text-gray-700">{result.email || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 font-bold ${result.status === 'created' ? 'bg-green-50 text-green-700' : result.status === 'skipped' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{result.status}</span></td><td className="px-4 py-3 text-gray-600">{result.message}</td><td className="px-4 py-3 font-mono font-semibold text-gray-800">{result.temporaryPassword ?? '—'}</td></tr>)}</tbody></table></div>
        </section>
      )}
    </div>
  );
}
