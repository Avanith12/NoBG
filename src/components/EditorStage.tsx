import React, { useRef, useState, useEffect, useCallback } from 'react'
import { SampleOriginalArtwork, SampleCutoutArtwork } from './SampleArtwork'
import type { UploadedImage } from './Dropzone'
import type { RemovalResult } from '../inference/removeBackground'
import { composite } from '../inference/composite'
import { applyBrushStroke, type BrushPoint } from '../inference/refineMask'

export type StudioTool = 'compare' | 'erase' | 'restore'

interface EditorStageProps {
  currentImage: UploadedImage | null
  removalResult: RemovalResult | null
  isProcessing: boolean
  backgroundColor: string
  isTransparent: boolean
  sliderPosition: number
  activeTool: StudioTool
  brushSize: number
  onSliderChange: (position: number) => void
  onToolChange: (tool: StudioTool) => void
  onBrushSizeChange: (size: number) => void
}

const ProcessedCanvas: React.FC<{
  removalResult: RemovalResult
  backgroundColor: string
  isTransparent: boolean
  activeTool: StudioTool
  brushSize: number
  alt: string
}> = ({
  removalResult,
  backgroundColor,
  isTransparent,
  activeTool,
  brushSize,
  alt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPaintingRef = useRef<boolean>(false)
  const activePointerIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<BrushPoint | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !removalResult) return
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

  // Redraw when dependencies change; cancel any pending frame so stale frame cannot overwrite newly recolored canvas
  useEffect(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    redrawCanvas()
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [redrawCanvas])

  // Accurately map pointer coordinates accounting for internal letterboxing/object-contain
  const getCanvasImagePoint = (e: React.PointerEvent<HTMLCanvasElement>): BrushPoint | null => {
    const canvas = canvasRef.current
    if (!canvas || !removalResult) return null
    const rect = canvas.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    const iw = removalResult.width
    const ih = removalResult.height
    if (cw <= 0 || ch <= 0 || iw <= 0 || ih <= 0) return null

    // Compute actual fitted image rectangle under object-contain
    const scale = Math.min(cw / iw, ch / ih)
    const renderedWidth = iw * scale
    const renderedHeight = ih * scale
    const offsetX = (cw - renderedWidth) / 2
    const offsetY = (ch - renderedHeight) / 2

    const pointerX = e.clientX - rect.left
    const pointerY = e.clientY - rect.top
    const clampedX = Math.max(0, Math.min(renderedWidth, pointerX - offsetX))
    const clampedY = Math.max(0, Math.min(renderedHeight, pointerY - offsetY))

    const x = Math.max(0, Math.min(iw - 1, (clampedX / renderedWidth) * iw))
    const y = Math.max(0, Math.min(ih - 1, (clampedY / renderedHeight) * ih))
    return { x, y }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary || (activeTool !== 'erase' && activeTool !== 'restore')) return
    const point = getCanvasImagePoint(e)
    if (!point) return

    activePointerIdRef.current = e.pointerId
    isPaintingRef.current = true
    lastPointRef.current = point

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture fails
    }

    applyBrushStroke(
      removalResult.mask,
      removalResult.width,
      removalResult.height,
      point,
      point,
      brushSize,
      activeTool,
    )
    redrawCanvas()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      !isPaintingRef.current ||
      e.pointerId !== activePointerIdRef.current ||
      (activeTool !== 'erase' && activeTool !== 'restore')
    ) {
      return
    }
    const point = getCanvasImagePoint(e)
    if (!point || !lastPointRef.current) return

    const last = lastPointRef.current
    applyBrushStroke(
      removalResult.mask,
      removalResult.width,
      removalResult.height,
      last,
      point,
      brushSize,
      activeTool,
    )
    lastPointRef.current = point

    if (animFrameRef.current === null) {
      animFrameRef.current = requestAnimationFrame(() => {
        animFrameRef.current = null
        redrawCanvas()
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return
    activePointerIdRef.current = null
    isPaintingRef.current = false
    lastPointRef.current = null

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    redrawCanvas()
  }

  const handleLostPointerCapture = () => {
    activePointerIdRef.current = null
    isPaintingRef.current = false
    lastPointRef.current = null
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    redrawCanvas()
  }

  const isBrushActive = activeTool === 'erase' || activeTool === 'restore'

  return (
    <canvas
      ref={canvasRef}
      width={removalResult.width}
      height={removalResult.height}
      aria-label={alt}
      role="img"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
      style={{ aspectRatio: `${removalResult.width} / ${removalResult.height}` }}
      className={`max-h-full max-w-full object-contain ${
        isBrushActive ? 'cursor-crosshair touch-none' : 'pointer-events-none'
      }`}
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
  activeTool,
  brushSize,
  onSliderChange,
  onToolChange,
  onBrushSizeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  const handlePointerMove = (clientX: number) => {
    if (!containerRef.current || activeTool !== 'compare') return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const pct = Math.round((x / rect.width) * 100)
    onSliderChange(pct)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'compare') return
    setIsDraggingSlider(true)
    handlePointerMove(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTool !== 'compare') return
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
  }, [isDraggingSlider, activeTool])

  const isPaintingMode = activeTool === 'erase' || activeTool === 'restore'

  return (
    <div className="flex flex-col gap-3">
      {/* Refine / Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-panel px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">Mode:</span>

          {/* Compare Mode Button */}
          <button
            type="button"
            onClick={() => onToolChange('compare')}
            aria-pressed={activeTool === 'compare'}
            aria-label="Compare mode: before and after split view"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel cursor-pointer border ${
              activeTool === 'compare'
                ? 'border-pink bg-pink text-black shadow-md shadow-pink/20'
                : 'border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3m8-6l4 3-4 3" />
            </svg>
            Compare
          </button>

          {/* Erase Brush Button */}
          <button
            type="button"
            onClick={() => onToolChange('erase')}
            disabled={!removalResult}
            aria-pressed={activeTool === 'erase'}
            aria-label="Erase brush tool. Remove background areas."
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTool === 'erase'
                ? 'border-pink bg-pink text-black shadow-md shadow-pink/20'
                : 'border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Erase Brush
          </button>

          {/* Restore Brush Button */}
          <button
            type="button"
            onClick={() => onToolChange('restore')}
            disabled={!removalResult}
            aria-pressed={activeTool === 'restore'}
            aria-label="Restore brush tool. Restore foreground areas."
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTool === 'restore'
                ? 'border-pink bg-pink text-black shadow-md shadow-pink/20'
                : 'border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Restore Brush
          </button>
        </div>

        {/* Brush Size Slider (Keyboard reachable with visible focus) */}
        {isPaintingMode && (
          <div className="flex items-center gap-2.5">
            <label htmlFor="brush-size-slider" className="text-xs font-medium text-zinc-300 whitespace-nowrap">
              Brush Radius: <span className="font-mono text-pink">{brushSize}px</span>
            </label>
            <input
              id="brush-size-slider"
              type="range"
              min={4}
              max={80}
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              aria-label="Brush radius in pixels"
              className="h-2 w-28 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-pink outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
            />
          </div>
        )}
      </div>

      {/* Required ID: editor-stage */}
      <div
        id="editor-stage"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`group relative select-none overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-2xl transition-all aspect-[4/3] w-full max-h-[560px] flex items-center justify-center ${
          activeTool === 'compare' ? 'cursor-ew-resize' : 'cursor-crosshair'
        }`}
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
                  style={{ aspectRatio: `${currentImage.width} / ${currentImage.height}` }}
                  className="max-h-full max-w-full object-contain opacity-50 pointer-events-none"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-xs">
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
                  activeTool={activeTool}
                  brushSize={brushSize}
                  alt={`Processed image ${currentImage.name}`}
                />
              </div>
            ) : (
              <div className="relative flex h-full w-full items-center justify-center p-4">
                <img
                  src={currentImage.url}
                  alt={`Unprocessed image ${currentImage.name}`}
                  style={{ aspectRatio: `${currentImage.width} / ${currentImage.height}` }}
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

        {/* Layer 2: Before / Original (Clipped on top based on sliderPosition when in compare mode) */}
        <div
          className={`absolute inset-0 flex items-center justify-center overflow-hidden bg-[#121215] transition-opacity ${
            isPaintingMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            clipPath: isPaintingMode ? 'inset(0 100% 0 0)' : `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          {currentImage ? (
            <div className="flex h-full w-full items-center justify-center p-4">
              <img
                src={currentImage.url}
                alt={`Original image ${currentImage.name}`}
                style={{ aspectRatio: `${currentImage.width} / ${currentImage.height}` }}
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
        {!isPaintingMode && (
          <div className="pointer-events-none absolute top-3 left-3 z-10 flex gap-2">
            <span className="rounded bg-black/75 px-2.5 py-1 text-xs font-semibold text-zinc-200 backdrop-blur-sm border border-zinc-700">
              Original
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex gap-2">
          <span className="rounded bg-black/75 px-2.5 py-1 text-xs font-semibold text-pink backdrop-blur-sm border border-pink/30">
            {isProcessing
              ? 'Processing...'
              : activeTool === 'erase'
              ? 'Erase Brush Active'
              : activeTool === 'restore'
              ? 'Restore Brush Active'
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

        {/* Split Divider Line and Handle (Only when in compare mode) */}
        {!isPaintingMode && (
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
        )}
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
            onChange={(e) => {
              onSliderChange(Number(e.target.value))
              if (activeTool !== 'compare') onToolChange('compare')
            }}
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
