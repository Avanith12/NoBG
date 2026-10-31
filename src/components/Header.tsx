import React from 'react'

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-800 bg-[#0c0c0f]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink font-extrabold text-black text-sm shadow-md shadow-pink/30">
            NB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">NoBG</span>
              <span className="rounded-full border border-pink/40 bg-pink/10 px-2 py-0.5 text-[10px] font-semibold text-pink uppercase tracking-wider">
                Sample Preview
              </span>
            </div>
            <p className="text-xs text-muted">No background. No problem.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% On-Device (Zero Server Uploads)</span>
          </div>
        </div>
      </div>
    </header>
  )
}
