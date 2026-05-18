'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function PaymentUploadPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const eventId      = params.id as string;
  const registrationId = searchParams.get('registration') ?? '';

  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [isDragging,  setIsDragging]  = useState(false);
  const [notes,       setNotes]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /* -- File selection -- */
  function handleFileSelect(selected: File) {
    if (!selected.type.startsWith('image/')) return;
    if (selected.size > 5 * 1024 * 1024) return; // 5MB cap
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadState('idle');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  /* -- Drag and drop -- */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setUploadState('idle');
    if (inputRef.current) inputRef.current.value = '';
  }

  /* -- Submit -- */
  async function handleSubmit() {
    if (!file) return;
    setUploadState('uploading');
    // TODO: replace with real upload API call
    await new Promise((r) => setTimeout(r, 1500));
    setUploadState('success');
    await new Promise((r) => setTimeout(r, 800));
    router.push(`/events/${eventId}/registration-success`);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '2021-00142', department: 'BSCS 3A' }} />

      <main className="flex-1 w-full max-w-[560px] mx-auto px-6 py-10 flex flex-col gap-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <Link href="/events" className="hover:text-green-700 transition-colors no-underline">Events</Link>
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Link href={`/events/${eventId}`} className="hover:text-green-700 transition-colors no-underline">Event Details</Link>
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-gray-600 font-medium">Payment Upload</span>
        </div>

        {/* ── Page header ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Upload proof of payment</h1>
          <p className="text-[14px] text-gray-500">
            Upload a screenshot of your payment transaction to confirm your registration.
          </p>
        </div>

        {/* ── Registration info strip ── */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h0a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[12px] font-medium text-gray-400">Registration ID</span>
            <span className="text-[13px] font-semibold text-gray-800 truncate">{registrationId || 'reg_mock_001'}</span>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full">
              Pending payment
            </span>
          </div>
        </div>

        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-[14px] font-semibold text-gray-800">Payment screenshot</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Accepted formats: JPG, PNG, WEBP · Max size: 5MB</p>
          </div>

          <div className="px-6 py-6 flex flex-col gap-5">

            {/* Upload zone */}
            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150
                  ${isDragging
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                  ${isDragging ? 'bg-green-100' : 'bg-white border border-gray-200'}`}>
                  <svg className={`w-6 h-6 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className={`text-[14px] font-semibold ${isDragging ? 'text-green-700' : 'text-gray-700'}`}>
                    {isDragging ? 'Drop your screenshot here' : 'Click or drag to upload'}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* Preview */
              <div className="flex flex-col gap-3">
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={preview}
                    alt="Payment proof"
                    className="w-full max-h-64 object-contain"
                  />
                  {/* Remove button */}
                  <button
                    onClick={removeFile}
                    className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>

                {/* File info */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="none">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-gray-800 truncate">{file?.name}</span>
                    <span className="text-[11px] text-gray-400">{file ? formatBytes(file.size) : ''}</span>
                  </div>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-[12px] font-medium text-green-700 hover:text-green-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Replace
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Optional notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-600">
                Additional notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Reference number, transaction ID, or any note for the officer..."
                rows={3}
                className="w-full px-4 py-3 text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[12px] text-blue-700 leading-relaxed">
                An officer will review your screenshot and confirm your payment. You will be notified once your registration is confirmed. Your slot is reserved in the meantime.
              </p>
            </div>

            {/* Error state */}
            {uploadState === 'error' && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <p className="text-[13px] text-red-600 font-medium">Upload failed. Please try again.</p>
              </div>
            )}
          </div>

          {/* Card footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <Link
              href={`/events/${eventId}`}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors no-underline"
            >
              ← Back
            </Link>
            <button
              onClick={handleSubmit}
              disabled={!file || uploadState === 'uploading' || uploadState === 'success'}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {uploadState === 'uploading' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Uploading...
                </>
              ) : uploadState === 'success' ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Uploaded!
                </>
              ) : (
                <>
                  Submit proof of payment
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Cavite State University · SALIKOP</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}