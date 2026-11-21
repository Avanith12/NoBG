import React, { useRef, useState, useEffect } from 'react'
import { SampleOriginalArtwork, SampleCutoutArtwork } from './SampleArtwork'
import type { UploadedImage } from './Dropzone'
import type { RemovalResult } from '../inference/removeBackground'
import { composite } from '../inference/composite'

interface EditorStageProps {
  currentImage: UploadedImage | null
  removalResult: RemovalResult | null
  isProcessing: boolean
  backgroundColor: string
  isTransparent: boolean
  sliderPosition: number
  onSliderChange: (position: number) => void
}

const ProcessedCanvas: React.FC<{
  removalResult: RemovalResult
  backgroundColor: string
  isTransparent: boolean
  alt: string
}> = ({ removalResult, backgroundColor, isTransparent, alt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const rendered = composite(
        removalResult.original,
        removalResult.mask,
        isTransparent ? null : backgroundColor,
      )
      canvas.width = rendered.width
      canvas.height = rendered.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(rendered, 0, 0)
      }
    } catch (err) {
      console.error('Failed to composite canvas:', err)
    }
  }, [removalResult, backgroundColor, isTransparent])

  return (
    <canvas
      ref={canvasRef}
      width={removalResult.width}
      height={removalResult.height}
      aria-label={alt}
      role="img"
      className="max-h-full max-w-full object-contain pointer-events-none"
    />
  )
}

export const EditorStage: React.FC<EditorStageProps> = ({
  currentImage,
  removalResult,
  isProcessing,
  backgroundColor,
  isTransparent,
  sliderPosition,
  onSliderChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  const handlePointerMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const pct = Math.round((x / rect.width) * 100)
    onSliderChange(pct)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSlider(true)
    handlePointerMove(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDraggingSlider(true)
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX)
    }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handlePointerMove(e.clientX)
      }
    }
    const onMouseUp = () => {
      if (isDraggingSlider) {
        setIsDraggingSlider(false)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX)
      }
    }
    const onTouchEnd = () => {
      if (isDraggingSlider) {
        setIsDraggingSlider(false)
      }
    }

    if (isDraggingSlider) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', onTouchEnd)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [isDraggingSlider])

  return (
    <div className="flex flex-col gap-3">
      {/* Required ID: editor-stage */}
      <div
        id="editor-stage"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="group relative select-none overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-2xl transition-all aspect-[4/3] w-full max-h-[560px] cursor-ew-resize flex items-center justify-center"
      >
        {/* Layer 1: Underneath (Processed result, or sample cutout artwork, or loading state) */}
        <div
          className={`absolute inset-0 flex items-center justify-center overflow-hidden transition-colors ${
            isTransparent ? 'bg-checkers' : ''
          }`}
          style={{ backgroundColor: isTransparent ? undefined : backgroundColor }}
        >
          {currentImage ? (
            isProcessing ? (
              <div className="relative flex h-full w-full items-center justify-center p-4">
                <img
                  src={currentImage.url}
                  alt={`Processing ${currentImage.name}`}
                  className="max-h-full max-w-full object-contain opacity-50 pointer-events-none"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-xs">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink border-t-transparent" />
                  <span className="rounded bg-black/85 px-3 py-1 text-xs font-semibold text-white border border-zinc-700 shadow">
                    Removing background...
                  </span>
                </div>
              </div>
            ) : removalResult ? (
              <div className="relative flex h-full w-full items-center justify-center p-4">
                <ProcessedCanvas
                  removalResult={removalResult}
                  backgroundColor={backgroundColor}
                  isTransparent={isTransparent}
                  alt={`Processed image ${currentImage.name}`}
                />
              </div>
            ) : (
              <div className="relative flex h-full w-full items-center justify-center p-4">
                <img
                  src={currentImage.url}
                  alt={`Unprocessed image ${currentImage.name}`}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
                <div className="absolute bottom-3 right-3 rounded bg-black/85 px-2.5 py-1 text-[11px] font-medium text-zinc-300 border border-zinc-700 shadow">
                  Unprocessed
                </div>
              </div>
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4">
              <SampleCutoutArtwork className="max-h-full max-w-full object-contain pointer-events-none" />
            </div>
          )}
        </div>

        {/* Layer 2: Before / Original (Clipped on top based on sliderPosition) */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#121215]"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          {currentImage ? (
            <div className="flex h-full w-full items-center justify-center p-4">
              <img
                src={currentImage.url}
                alt={`Original image ${currentImage.name}`}
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4">
              <SampleOriginalArtwork className="max-h-full max-w-full object-contain pointer-events-none" />
            </div>
          )}
        </div>

        {/* Badges for Before / After */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex gap-2">
          <span className="rounded bg-black/75 px-2.5 py-1 text-xs font-semibold text-zinc-200 backdrop-blur-sm border border-zinc-700">
            Original
          </span>
        </div>
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex gap-2">
          <span className="rounded bg-black/75 px-2.5 py-1 text-xs font-semibold text-pink backdrop-blur-sm border border-pink/30">
            {isProcessing
              ? 'Processing...'
              : removalResult
              ? isTransparent
                ? 'Transparent'
                : backgroundColor
              : currentImage
              ? 'Unprocessed'
              : isTransparent
              ? 'Transparent'
              : backgroundColor}
          </span>
        </div>

        {/* Split Divider Line and Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-pink shadow-[0_0_8px_rgba(255,45,149,0.8)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink bg-black shadow-lg shadow-pink/30 text-white">
            <svg className="h-4 w-4 text-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3m8-6l4 3-4 3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Accessible Slider Control (Required ID: compare-slider) */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-zinc-800 bg-panel px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-medium text-white">Before & After Comparison</span>
          <span className="font-mono text-zinc-400">{sliderPosition}% Split</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase">Original</span>
          {/* Required ID: compare-slider */}
          <input
            id="compare-slider"
            type="range"
            min={0}
            max={100}
            value={sliderPosition}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            aria-label="Before and after comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={sliderPosition}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-pink outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
          />
          <span className="text-xs font-semibold text-pink uppercase">
            {isProcessing
              ? 'Processing'
              : removalResult
              ? 'Processed'
              : currentImage
              ? 'Unprocessed'
              : 'Sample Preview'}
          </span>
        </div>
      </div>
    </div>
  )
}
