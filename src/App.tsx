import { useState, useRef, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { StatusBar, type StatusState } from './components/StatusBar'
import { Dropzone, type UploadedImage } from './components/Dropzone'
import { EditorStage } from './components/EditorStage'
import { ColorControls } from './components/ColorControls'
import { DownloadControls } from './components/DownloadControls'
import { removeBackground, type RemovalResult } from './inference/removeBackground'

export default function App() {
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(null)
  const [removalResult, setRemovalResult] = useState<RemovalResult | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [backgroundColor, setBackgroundColor] = useState<string>('#FF2D95')
  const [isTransparent, setIsTransparent] = useState<boolean>(false)
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [status, setStatus] = useState<StatusState>({
    severity: 'ready',
    title: 'Sample Preview',
    message:
      'Explore presets, enter a custom HEX code, compare before and after, or upload a PNG, JPG, or WebP image to remove its background.',
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const activeRequestIdRef = useRef<number>(0)
  const currentImageRef = useRef<UploadedImage | null>(null)

  const handleImageLoaded = useCallback((image: UploadedImage) => {
    // Abort previous in-flight inference if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Revoke old URL if different
    if (currentImageRef.current?.url && currentImageRef.current.url !== image.url) {
      URL.revokeObjectURL(currentImageRef.current.url)
    }
    currentImageRef.current = image

    const requestId = ++activeRequestIdRef.current
    const controller = new AbortController()
    abortControllerRef.current = controller

    setCurrentImage(image)
    setRemovalResult(null)
    setIsProcessing(true)

    setStatus({
      severity: 'info',
      title: 'Removing Background',
      message: `Removing background for "${image.name}" with on-device AI...`,
    })

    removeBackground(image.file, controller.signal)
      .then((result) => {
        if (requestId !== activeRequestIdRef.current || controller.signal.aborted) {
          return
        }
        abortControllerRef.current = null
        setRemovalResult(result)
        setIsProcessing(false)
        setStatus({
          severity: 'success',
          title: 'Background Removed',
          message: `Background removed for "${image.name}" (${result.width}×${result.height}px). Choose a background color or export.`,
        })
      })
      .catch((err: unknown) => {
        if (requestId !== activeRequestIdRef.current || controller.signal.aborted) {
          return
        }
        abortControllerRef.current = null
        setIsProcessing(false)
        setRemovalResult(null)
        const message = err instanceof Error ? err.message : 'Failed to remove background.'
        setStatus({
          severity: 'error',
          title: 'Removal Failed',
          message,
        })
      })
  }, [])

  const handleResetToSample = useCallback(() => {
    // Cancel in-flight inference
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    activeRequestIdRef.current++

    if (currentImageRef.current?.url) {
      URL.revokeObjectURL(currentImageRef.current.url)
      currentImageRef.current = null
    }

    setCurrentImage(null)
    setRemovalResult(null)
    setIsProcessing(false)
    setStatus({
      severity: 'info',
      title: 'Sample Restored',
      message: 'Showing sample artwork preview. Upload a PNG, JPG, or WebP image to remove its background.',
    })
  }, [])

  // Unmount-only cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      if (currentImageRef.current?.url) {
        URL.revokeObjectURL(currentImageRef.current.url)
        currentImageRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-white selection:bg-pink selection:text-black flex flex-col">
      <Header />

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8 flex flex-col gap-6">
        {/* Persistent Status Bar (app-message with aria-live="polite") */}
        <StatusBar status={status} />

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Main Stage Column (lg:col-span-8) */}
          <section className="flex flex-col gap-4 lg:col-span-8">
            <EditorStage
              currentImage={currentImage}
              removalResult={removalResult}
              isProcessing={isProcessing}
              backgroundColor={backgroundColor}
              isTransparent={isTransparent}
              sliderPosition={sliderPosition}
              onSliderChange={setSliderPosition}
            />
          </section>

          {/* Controls Sidebar (lg:col-span-4) */}
          <aside className="flex flex-col gap-5 lg:col-span-4">
            {/* Upload Zone */}
            <Dropzone
              currentImage={currentImage}
              isProcessing={isProcessing}
              onImageLoaded={handleImageLoaded}
              onResetToSample={handleResetToSample}
              onStatusChange={setStatus}
            />

            {/* Background Color Controls */}
            <ColorControls
              currentColor={backgroundColor}
              isTransparent={isTransparent}
              onColorChange={setBackgroundColor}
              onToggleTransparent={setIsTransparent}
            />

            {/* Export & Download Controls */}
            <DownloadControls
              currentImage={currentImage}
              removalResult={removalResult}
              isProcessing={isProcessing}
              backgroundColor={backgroundColor}
              isTransparent={isTransparent}
              onStatusChange={setStatus}
            />
          </aside>
        </div>
      </main>

      <footer className="mt-auto border-t border-zinc-800/80 bg-[#0c0c0f] py-4 text-center text-xs text-muted">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NoBG • In-Browser Background Removal</span>
          <span className="text-[11px] text-zinc-500">
            Runs entirely on-device • Privacy-first AI
          </span>
        </div>
      </footer>
    </div>
  )
}
