import React, { useRef, useState } from 'react'
import type { StatusState } from './StatusBar'

export interface UploadedImage {
  file: File
  url: string
  name: string
  width: number
  height: number
  size: number
}

interface DropzoneProps {
  currentImage: UploadedImage | null
  isProcessing?: boolean
  onImageLoaded: (image: UploadedImage) => void
  onResetToSample: () => void
  onStatusChange: (status: StatusState) => void
}

export const Dropzone: React.FC<DropzoneProps> = ({
  currentImage,
  isProcessing = false,
  onImageLoaded,
  onResetToSample,
  onStatusChange,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const decodeTokenRef = useRef(0)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const token = ++decodeTokenRef.current

    // 1. Check if empty (0 bytes)
    if (file.size === 0) {
      onStatusChange({
        severity: 'error',
        title: 'Empty File',
        message: `The selected file "${file.name}" is 0 bytes. Please select a valid PNG, JPG, or WebP image.`,
      })
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // 2. Check unsupported formats
    const validExtensions = /\.(png|jpe?g|webp)$/i
    const validMimes = ['image/png', 'image/jpeg', 'image/webp']
    const hasValidExtension = validExtensions.test(file.name)
    const hasValidMime = validMimes.includes(file.type)

    if (!hasValidExtension && !hasValidMime) {
      onStatusChange({
        severity: 'error',
        title: 'Unsupported Format',
        message: `File "${file.name}" is not supported. Please upload a PNG, JPG, or WebP image.`,
      })
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // 3. Check image decodability
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      if (token !== decodeTokenRef.current) {
        URL.revokeObjectURL(objectUrl)
        return
      }
      onImageLoaded({
        file,
        url: objectUrl,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
      })
    }

    img.onerror = () => {
      if (token !== decodeTokenRef.current) {
        URL.revokeObjectURL(objectUrl)
        return
      }
      URL.revokeObjectURL(objectUrl)
      onStatusChange({
        severity: 'error',
        title: 'Decoding Error',
        message: `Could not decode image "${file.name}". The image may be corrupted or in an unreadable format.`,
      })
    }

    img.src = objectUrl
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleResetClick = () => {
    decodeTokenRef.current++
    onResetToSample()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Required ID: image-dropzone */}
      <div
        id="image-dropzone"
        role="button"
        tabIndex={0}
        aria-label="Upload image drop zone. Press Enter or Space to open file picker, or drag and drop a PNG, JPG, or WebP image."
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isDragging
            ? 'border-pink bg-pink/10 shadow-lg shadow-pink/20'
            : 'border-zinc-700 bg-panel hover:border-zinc-500 hover:bg-zinc-900/60'
        }`}
      >
        {/* Required ID: image-input */}
        <input
          id="image-input"
          ref={inputRef}
          type="file"
          tabIndex={-1}
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Select PNG, JPG, or WebP image"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-pink group-hover:scale-110 transition-transform">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <p className="text-base font-semibold text-white">
          <span className="text-pink underline decoration-pink/40 underline-offset-4 group-hover:decoration-pink">
            Click to upload
          </span>{' '}
          or drag and drop
        </p>

        <p className="mt-1 text-xs text-muted">
          Supports PNG, JPG, WebP (Runs 100% on-device)
        </p>

        <div className="mt-3 flex gap-2">
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">.PNG</span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">.JPG</span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">.WEBP</span>
        </div>
      </div>

      {/* Current File Metadata or Sample Status */}
      {currentImage ? (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs">
          <div className="truncate pr-2">
            <span className="font-medium text-white block truncate">{currentImage.name}</span>
            <span className="text-muted">
              {currentImage.width}×{currentImage.height}px • {formatFileSize(currentImage.size)}
              {isProcessing && <span className="ml-2 text-pink font-semibold">• Processing...</span>}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetClick}
            className="shrink-0 rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-pink cursor-pointer"
          >
            Reset to Sample
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-xs text-muted">
          <span>Active: Sample artwork</span>
          <span className="font-mono text-[11px] text-pink">Sample</span>
        </div>
      )}
    </div>
  )
}
