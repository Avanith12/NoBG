import React from 'react'

export type StatusSeverity = 'ready' | 'info' | 'success' | 'warning' | 'error'

export interface StatusState {
  severity: StatusSeverity
  title: string
  message: string
}

interface StatusBarProps {
  status: StatusState
  isProcessing?: boolean
  onCancel?: () => void
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, isProcessing = false, onCancel }) => {
  const getBadgeStyle = () => {
    switch (status.severity) {
      case 'error':
        return {
          container: 'border-red-500/50 bg-red-950/40 text-red-200',
          badge: 'bg-red-500 text-white',
          tag: 'ERROR',
        }
      case 'warning':
        return {
          container: 'border-amber-500/50 bg-amber-950/40 text-amber-200',
          badge: 'bg-amber-500 text-black',
          tag: 'WARNING',
        }
      case 'success':
        return {
          container: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200',
          badge: 'bg-emerald-500 text-black',
          tag: 'SUCCESS',
        }
      case 'info':
        return {
          container: 'border-pink/40 bg-pink/10 text-pink-100',
          badge: 'bg-pink text-white',
          tag: 'NOTICE',
        }
      case 'ready':
      default:
        return {
          container: 'border-zinc-700 bg-zinc-900/80 text-zinc-300',
          badge: 'bg-zinc-700 text-white',
          tag: 'STATUS',
        }
    }
  }

  const { container, badge, tag } = getBadgeStyle()

  return (
    <aside
      id="app-message"
      aria-live="polite"
      role="status"
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-200 ${container}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${badge}`}>
          {tag}
        </span>
        <div className="flex-1 min-w-0">
          <strong className="font-semibold block sm:inline mr-2 text-white">{status.title}</strong>
          <span className="text-sm opacity-95">{status.message}</span>
        </div>
      </div>

      {isProcessing && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel background removal"
          className="shrink-0 rounded bg-zinc-800 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 hover:text-pink transition-colors border border-zinc-600 focus-visible:ring-2 focus-visible:ring-pink cursor-pointer shadow-xs"
        >
          Cancel
        </button>
      )}
    </aside>
  )
}
