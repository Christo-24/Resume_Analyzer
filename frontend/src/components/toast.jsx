import { useCallback, useMemo, useRef, useState } from 'react'

import ToastContext from './toastContext'

const TOAST_TTL_MS = 4500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeoutRefs = useRef(new Map())

  const removeToast = useCallback((id) => {
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    if (!message) {
      return
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current, { id, message, type }])

    const timeoutId = window.setTimeout(() => {
      removeToast(id)
    }, TOAST_TTL_MS)
    timeoutRefs.current.set(id, timeoutId)
  }, [removeToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
        {toasts.map((toast) => {
          const typeStyles =
            toast.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : toast.type === 'error'
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : 'border-cyan-300 bg-cyan-50 text-cyan-900'

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${typeStyles}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="leading-relaxed">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-full border border-current/25 px-2 py-0.5 text-xs font-bold hover:bg-white/50"
                  aria-label="Dismiss notification"
                >
                  x
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
