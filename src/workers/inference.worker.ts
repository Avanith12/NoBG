import * as ort from 'onnxruntime-web/webgpu'
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import wasmModuleUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import type { InferenceDiagnostics, WorkerResult } from '../inference/removeBackground'

// Pinned ONNX Community conversion of schirrmacher/ormbg (Apache-2.0).
const REVISION = '034e2d884afbab897e10e78fc5bb566b29533fd6'
const BASE = `https://huggingface.co/onnx-community/ormbg-ONNX/resolve/${REVISION}/onnx/`
const SIZE = 1024
const modelDownloadError = () => new Error('The background-removal model could not be downloaded. Check your connection and try again.')
ort.env.wasm.numThreads = 1 // Works on static hosts without cross-origin isolation.
ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl }
let loaded: { session: ort.InferenceSession; diagnostics: InferenceDiagnostics } | undefined

async function load(backend: 'webgpu' | 'wasm') {
  const start = performance.now()
  const modelUrl = BASE + (backend === 'webgpu' ? 'model.onnx' : 'model_uint8.onnx')
  let cache: Cache | undefined
  let response: Response | undefined
  let cacheState: InferenceDiagnostics['cache'] = 'unavailable'
  try {
    cache = await caches.open('nobg-ormbg-v1')
    response = await cache.match(modelUrl)
    if (response) cacheState = 'hit'
  } catch { /* Storage denial must not prevent inference. */ }
  if (!response) {
    try {
      response = await fetch(modelUrl, { credentials: 'omit', referrerPolicy: 'no-referrer' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
    } catch {
      throw modelDownloadError()
    }
    if (cache) {
      try { await cache.put(modelUrl, response.clone()); cacheState = 'stored' } catch { /* Quota/full/private storage. */ }
    }
  }
  let bytes: ArrayBuffer
  try {
    bytes = await response.arrayBuffer()
  } catch {
    throw modelDownloadError()
  }
  const session = await ort.InferenceSession.create(bytes, { executionProviders: [backend] })
  return { session, diagnostics: { backend, cache: cacheState, modelUrl, modelBytes: bytes.byteLength,
    loadMs: performance.now() - start, inferenceMs: 0 } satisfies InferenceDiagnostics }
}

async function initialize() {
  if (loaded) return loaded
  let fallbackReason: string | undefined
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  if (gpu) {
    try {
      if (await gpu.requestAdapter()) { loaded = await load('webgpu'); return loaded }
      fallbackReason = 'No WebGPU adapter available.'
    } catch (error) { fallbackReason = String(error) }
  }
  loaded = await load('wasm')
  loaded.diagnostics.fallbackReason = fallbackReason
  return loaded
}

async function processImage(file: File): Promise<WorkerResult> {
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) } catch {
    throw new Error('This image could not be decoded. Choose a valid PNG, JPG, or WebP image.')
  }
  const { width, height } = bitmap
  let original: ImageData
  let inputPixels: Uint8ClampedArray
  try {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas unavailable')
    ctx.drawImage(bitmap, 0, 0)
    original = ctx.getImageData(0, 0, width, height)
    const small = new OffscreenCanvas(SIZE, SIZE)
    const context = small.getContext('2d', { willReadFrequently: true })!
    context.drawImage(bitmap, 0, 0, SIZE, SIZE)
    inputPixels = context.getImageData(0, 0, SIZE, SIZE).data
  } finally { bitmap.close() }
  // Upstream processor: bilinear resize, RGB / 255, no mean/std normalization.
  const plane = SIZE * SIZE
  const rgb = new Float32Array(plane * 3)
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) rgb[c * plane + i] = inputPixels[i * 4 + c] / 255
  }
  let runtime = await initialize()
  const tensor = new ort.Tensor('float32', rgb, [1, 3, SIZE, SIZE])
  const start = performance.now()
  let outputs: ort.InferenceSession.ReturnType
  try {
    try { outputs = await runtime.session.run({ [runtime.session.inputNames[0]]: tensor }) }
    catch (error) {
      if (runtime.diagnostics.backend !== 'webgpu') throw error
      const reason = String(error)
      await runtime.session.release()
      loaded = undefined
      runtime = await load('wasm')
      loaded = runtime
      runtime.diagnostics.fallbackReason = reason
      outputs = await runtime.session.run({ [runtime.session.inputNames[0]]: tensor })
    }
  } finally { tensor.dispose() }
  try {
    const output = outputs[runtime.session.outputNames[0]]
    const values = await output.getData() as Float32Array
    let min = Infinity, max = -Infinity
    for (const v of values) { min = Math.min(min, v); max = Math.max(max, v) }
    if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('Model returned an invalid mask.')
    const mw = Number(output.dims[output.dims.length - 1])
    const mh = Number(output.dims[output.dims.length - 2])
    if (values.length !== mw * mh) throw new Error('Model returned unexpected mask dimensions.')
    const maskCanvas = new OffscreenCanvas(mw, mh)
    const mc = maskCanvas.getContext('2d')!
    const pixels = new ImageData(mw, mh)
    for (let i = 0; i < mw * mh; i++) {
      const alpha = max > min ? Math.round((values[i] - min) / (max - min) * 255) : Math.round(Math.max(0, Math.min(1, values[i])) * 255)
      pixels.data.set([alpha, alpha, alpha, 255], i * 4)
    }
    mc.putImageData(pixels, 0, 0)
    const full = new OffscreenCanvas(width, height)
    const fc = full.getContext('2d')!
    fc.drawImage(maskCanvas, 0, 0, width, height)
    const rgba = fc.getImageData(0, 0, width, height).data
    const mask = new Uint8Array(width * height)
    for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4]
    return { width, height, pixels: new Uint8ClampedArray(original.data), mask,
      diagnostics: { ...runtime.diagnostics, inferenceMs: performance.now() - start } }
  } finally { for (const output of Object.values(outputs)) output.dispose() }
}

self.onmessage = async ({ data }: MessageEvent<File>) => {
  try {
    const result = await processImage(data)
    self.postMessage(result, { transfer: [result.pixels.buffer, result.mask.buffer] })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Background removal failed. Try again.' })
  }
}
