import { useState } from 'react'
import { Header } from './components/Header'
import { StatusBar, type StatusState } from './components/StatusBar'
import { Dropzone, type UploadedImage } from './components/Dropzone'
import { EditorStage } from './components/EditorStage'
import { ColorControls } from './components/ColorControls'
import { DownloadControls } from './components/DownloadControls'

export default function App() {
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string>('#FF2D95')
  const [isTransparent, setIsTransparent] = useState<boolean>(false)
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [status, setStatus] = useState<StatusState>({
    severity: 'ready',
    title: 'Sample Preview',
    message:
      'Explore presets, enter a custom HEX code, compare before and after, or upload an image. Background removal and downloads are not available yet.',
  })

  const handleImageLoaded = (image: UploadedImage) => {
    if (currentImage) {
      URL.revokeObjectURL(currentImage.url)
    }
    setCurrentImage(image)
  }

  const handleResetToSample = () => {
    if (currentImage) {
      URL.revokeObjectURL(currentImage.url)
    }
    setCurrentImage(null)
    setStatus({
      severity: 'info',
      title: 'Sample Restored',
      message: 'Showing sample artwork preview. Background removal and downloads are not available yet.',
    })
  }

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
            Sample preview • Runs entirely in your browser
          </span>
        </div>
      </footer>
    </div>
  )
}
