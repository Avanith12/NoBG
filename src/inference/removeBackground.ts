export interface RemovalResult {
  width: number
  height: number
  original: ImageData
  mask: Uint8Array
}

export interface InferenceDiagnostics {
  backend: 'webgpu' | 'wasm'
  cache: 'hit' | 'stored' | 'unavailable'
  modelUrl: string
  modelBytes: number
  loadMs: number
  inferenceMs: number
  fallbackReason?: string
}

export type WorkerResult = Omit<RemovalResult, 'original'> & {
  pixels: Uint8ClampedArray<ArrayBuffer>
  diagnostics: InferenceDiagnostics
}

let worker: Worker | undefined
let queue: Promise<unknown> = Promise.resolve()
const aborted = () => new DOMException('Background removal was aborted.', 'AbortError')

/** Image bytes remain on this device. Only model/runtime assets are downloaded. */
export async function removeBackground(file: File, signal?: AbortSignal): Promise<RemovalResult> {
  if (signal?.aborted) throw aborted()
  if (!file.size) throw new Error('The image is empty. Choose a PNG, JPG, or WebP image.')
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Unsupported image. Choose a PNG, JPG, or WebP image.')
  }
  // Serialize jobs to avoid allocating several large model sessions at once.
  const job = queue.catch(() => {}).then(() => new Promise<RemovalResult>((resolve, reject) => {
    if (signal?.aborted) { reject(aborted()); return }
    try {
      worker ??= new Worker(new URL('../workers/inference.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      reject(new Error('This browser cannot start the image-processing worker. Try a current browser.'))
      return
    }
    const current = worker
    const cleanup = () => {
      signal?.removeEventListener('abort', cancel)
      current.onmessage = null
      current.onerror = null
    }
    const cancel = () => {
      cleanup()
      current.terminate()
      worker = undefined
      reject(aborted())
    }
    signal?.addEventListener('abort', cancel, { once: true })
    current.onerror = () => {
      cleanup()
      current.terminate()
      worker = undefined
      reject(new Error('Image processing failed. Your browser may have run out of memory. Try a smaller image.'))
    }
    current.onmessage = ({ data }: MessageEvent<WorkerResult | { error: string }>) => {
      cleanup()
      if ('error' in data) { reject(new Error(data.error)); return }
      // Local diagnostics for validation; no telemetry or image data leaves the browser.
      console.info('NoBG inference', data.diagnostics)
      resolve({ width: data.width, height: data.height,
        original: new ImageData(data.pixels, data.width, data.height), mask: data.mask })
    }
    current.postMessage(file)
  }))
  queue = job
  return job
}
