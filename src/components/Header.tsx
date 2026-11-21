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
            <span className="text-lg font-black tracking-tight text-white">NoBG</span>
            <p className="text-xs text-muted">No background. No problem.</p>
          </div>
        </div>
      </div>
    </header>
  )
}
