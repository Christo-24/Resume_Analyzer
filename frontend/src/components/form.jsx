import { useRef, useState } from 'react';
import { useToast } from './toastContext';

function Form({onAnalyze, loading = false, disabled = false}) {
      const [jobDesc, setJobDesc] = useState("");
      const [file, setFile] = useState(null);
      const [isDragOver, setIsDragOver] = useState(false);
      const [fileError, setFileError] = useState("");
      const fileInputRef = useRef(null);
  const { showToast } = useToast();

      const formatFileSize = (sizeInBytes) => {
        if (!Number.isFinite(sizeInBytes)) {
          return "";
        }
        if (sizeInBytes < 1024) {
          return `${sizeInBytes} B`;
        }
        if (sizeInBytes < 1024 * 1024) {
          return `${(sizeInBytes / 1024).toFixed(1)} KB`;
        }
        return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
      };

      const validateFile = (nextFile) => {
        if (!nextFile) {
          return "Please choose a file.";
        }

        const fileName = String(nextFile.name || "").toLowerCase();
        const isPdfByName = fileName.endsWith(".pdf");
        const mimeType = String(nextFile.type || "").toLowerCase();
        const isPdfByMime = mimeType === "application/pdf" || mimeType === "";

        if (!isPdfByName || !isPdfByMime) {
          return "Invalid file type. PDF only.";
        }

        return "";
      };

      const handleFileSelection = (nextFile) => {
        const validationMessage = validateFile(nextFile);

        if (validationMessage) {
          setFile(null);
          setFileError(validationMessage);
          showToast(validationMessage, 'error');
          return;
        }

        setFile(nextFile);
        setFileError("");
      };

      const clearSelectedFile = () => {
        setFile(null);
        setFileError("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      const handleSubmit = () => {
        if (disabled) {
          return;
        }
        if (!file || !jobDesc) {
          showToast('Please provide both a resume and a job description.', 'error');
          return;
        }
        onAnalyze(file, jobDesc);
      };

      const dropzoneStateClasses = fileError
        ? "border-rose-400 bg-rose-50/80 shadow-[0_0_0_3px_rgba(251,113,133,0.18)]"
        : file
          ? "border-emerald-400 bg-emerald-50/70 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]"
          : isDragOver
            ? "border-cyan-500 bg-cyan-50/90 shadow-[0_0_0_4px_rgba(14,165,233,0.18)]"
            : "border-cyan-400 bg-[linear-gradient(180deg,#ecfeff,#f8fafc)]";

      const dashStyle = !file && !isDragOver && !fileError
        ? { borderStyle: 'dashed', borderWidth: '2px' }
        : { borderStyle: 'solid', borderWidth: '2px' };

      return(
        <div className="space-y-5 rounded-2xl border border-cyan-200 bg-white/75 p-4 shadow-inner shadow-cyan-100/40">
        <label
          className={`group relative block cursor-pointer rounded-2xl p-5 transition focus-within:border-cyan-500 ${dropzoneStateClasses}`}
          style={dashStyle}
          onDragOver={(event) => {
            event.preventDefault();
            if (!fileError) {
              setIsDragOver(true);
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!fileError) {
              setIsDragOver(true);
            }
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsDragOver(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            const droppedFile = event.dataTransfer.files && event.dataTransfer.files[0];
            handleFileSelection(droppedFile || null);
          }}
        >
          <div className="flex items-center gap-3">
            {file ? (
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : (
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 18a4 4 0 01-.35-7.98A5.5 5.5 0 0117 9.5h.5a3.5 3.5 0 010 7H14" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v7m0-7l-3 3m3-3l3 3" />
                </svg>
              </span>
            )}
            <div>
              <p className="text-sm font-bold text-cyan-950">
                {isDragOver ? 'Drop it!' : 'Upload Resume PDF'}
              </p>
              {!file && <p className="text-xs font-medium text-slate-700">Click to browse or drag and drop your file here</p>}
              {!file && <p className="mt-0.5 text-xs text-slate-500">Accepted format: PDF only</p>}
            </div>
          </div>

          {file ? (
            <div className="mt-3 rounded-xl bg-white/90 px-3 py-2.5 pr-12 text-xs relative">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  clearSelectedFile();
                }}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-sm font-bold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 cursor-pointer"
                aria-label="Remove selected file"
              >
                x
              </button>

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700">
              No file selected
            </p>
          )}

          {fileError && (
            <p className="mt-2 text-xs font-semibold text-rose-700">{fileError}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={(e) => handleFileSelection(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          />
        </label>


      <textarea
      placeholder="Enter job description..."
      className="min-h-44 w-full rounded-2xl border border-cyan-300 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_88%_14%,rgba(20,184,166,0.08),transparent_26%),radial-gradient(circle_at_40%_84%,rgba(59,130,246,0.05),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-cyan-100"
      onChange={(e) => setJobDesc(e.target.value)}
    />
 
    <button
    type="button"
    disabled={loading || disabled}
    className="w-full rounded-2xl bg-[linear-gradient(90deg,#14b8a6,#0ea5e9,#6366f1)] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-[0_16px_34px_-12px_rgba(14,165,233,0.45)] transition duration-200 hover:bg-[linear-gradient(90deg,#0f766e,#0284c7,#4f46e5)] hover:shadow-[0_18px_38px_-12px_rgba(79,70,229,0.5)] focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[linear-gradient(90deg,#14b8a6,#0ea5e9,#6366f1)] disabled:hover:shadow-[0_16px_34px_-12px_rgba(14,165,233,0.45)]" 
    onClick={handleSubmit}>{loading ? "Analyzing..." : disabled ? "Daily Limit Reached" : "Analyze"}</button>
    </div>

      );
    }


export default Form;