import React, { useState } from 'react'
import type { StatusState } from './StatusBar'
import type { UploadedImage } from './Dropzone'
import type { RemovalResult } from '../inference/removeBackground'
import { exportPng } from '../inference/composite'

interface DownloadControlsProps {
  currentImage: UploadedImage | null
  removalResult: RemovalResult | null
  isProcessing: boolean
  backgroundColor: string
  isTransparent: boolean
  onStatusChange: (status: StatusState) => void
}

export const DownloadControls: React.FC<DownloadControlsProps> = ({
  currentImage,
  removalResult,
  isProcessing,
  backgroundColor,
  onStatusChange,
}) => {
  const [exportFormat, setExportFormat] = useState<'transparent' | 'colored'>('colored')
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const handleDownloadClick = async () => {
    if (!currentImage || !removalResult) {
      if (isProcessing) {
        onStatusChange({
          severity: 'info',
          title: 'Processing',
          message: 'Please wait for background removal to finish before downloading.',
        })
        return
      }
      onStatusChange({
        severity: 'info',
        title: 'Upload Required',
        message: 'Upload an image first to remove its background and download the result.',
      })
      return
    }

    try {
      setIsExporting(true)
      // Both PNG export options including selected color regardless of transparent preview
      const exportBackground = exportFormat === 'transparent' ? null : backgroundColor
      const formatDescription =
        exportFormat === 'transparent' ? 'transparent PNG' : `flattened PNG (${backgroundColor})`

      onStatusChange({
        severity: 'info',
        title: 'Exporting PNG',
        message: `Generating ${formatDescription} at original resolution (${removalResult.width}×${removalResult.height}px)...`,
      })

      const blob = await exportPng(removalResult.original, removalResult.mask, exportBackground)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const baseName = currentImage.name.replace(/\.[^/.]+$/, '') || 'image'
      const suffix = exportFormat === 'transparent' ? 'transparent' : 'recolored'
      link.download = `${baseName}-${suffix}.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onStatusChange({
        severity: 'success',
        title: 'Download Started',
        message: `Downloaded ${link.download} (${removalResult.width}×${removalResult.height}px).`,
      })
    } catch (err) {
      onStatusChange({
        severity: 'error',
        title: 'Export Failed',
        message: err instanceof Error ? err.message : 'Could not encode or download the image.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white">Export Options</h3>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">PNG</span>
      </div>

      {/* Format Selection Radios */}
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Choose export background type</legend>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 font-medium transition-all focus-within:ring-2 focus-within:ring-pink ${
              exportFormat === 'transparent'
                ? 'border-pink bg-pink/10 text-white'
                : 'border-zinc-800 bg-zinc-900/60 text-muted hover:border-zinc-700 hover:text-white'
            }`}
          >
            <input
              type="radio"
              name="export-type"
              value="transparent"
              checked={exportFormat === 'transparent'}
              onChange={() => setExportFormat('transparent')}
              className="sr-only"
            />
            <span className="h-2 w-2 rounded-full border border-pink bg-transparent" />
            Transparent PNG
          </label>

          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 font-medium transition-all focus-within:ring-2 focus-within:ring-pink ${
              exportFormat === 'colored'
                ? 'border-pink bg-pink/10 text-white'
                : 'border-zinc-800 bg-zinc-900/60 text-muted hover:border-zinc-700 hover:text-white'
            }`}
          >
            <input
              type="radio"
              name="export-type"
              value="colored"
              checked={exportFormat === 'colored'}
              onChange={() => setExportFormat('colored')}
              className="sr-only"
            />
            <span
              className="h-2.5 w-2.5 rounded-full border border-zinc-700"
              style={{ backgroundColor }}
            />
            Flattened PNG
          </label>
        </div>
      </fieldset>

      {/* Required ID: download-button */}
      <button
        id="download-button"
        type="button"
        onClick={handleDownloadClick}
        disabled={isExporting}
        aria-label="Download image"
        className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-pink font-semibold text-black transition-all hover:brightness-110 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-panel cursor-pointer shadow-lg shadow-pink/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg
          className={`h-5 w-5 text-black ${isExporting ? 'animate-spin' : 'group-hover:translate-y-0.5 transition-transform'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          {isExporting ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8v8H4z" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          )}
        </svg>
        <span>
          {isExporting
            ? 'Exporting...'
            : `Download ${exportFormat === 'transparent' ? 'Transparent' : 'Flattened'} PNG`}
        </span>
      </button>

      <p className="text-[11px] leading-relaxed text-muted">
        Preserves original pixel dimensions. Exports directly from your browser.
      </p>
    </div>
  )
}
