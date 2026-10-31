# Milestone 2 inference evidence

## Implementation and contract

`removeBackground(file, signal?)` returns `{ width, height, original: ImageData, mask: Uint8Array }`. Mask length is `width * height`, with values from 0 (background) to 255 (foreground). The dimensions are the browser-decoded image dimensions. This milestone deliberately has no editor integration, compositing, export, or brush implementation.

A reusable dedicated module worker performs decode, RGB preprocessing, ONNX inference, and original-size mask reconstruction. Calls are serialized to limit simultaneous model allocations. An active abort terminates the worker; the next call creates a new one and can reuse cached weights. Pending queued calls check cancellation before starting. Image bytes and masks never enter a fetch request or browser storage.

ONNX Runtime Web is pinned to 1.24.3. Its WebGPU build uses the matching **asyncify** MJS/WASM assets imported through Vite. The runtime is served from the application's own origin; no runtime CDN is required. WASM uses one thread, so GitHub Pages does not need cross-origin isolation headers. The built runtime WASM asset is about 27.2 MB before HTTP compression (about 6.5 MB gzip).

## Model decision and primary sources

Retain ORMBG as the Milestone 2 candidate based on successful local browser inference and a visually useful portrait mask. This is not a broad segmentation-quality certification.

- [Author's model card and license declaration](https://huggingface.co/schirrmacher/ormbg/blob/6253b318240ef7a8670017b88d242f9f87f5abeb/README.md): ORMBG, based on IS-Net/DIS, optimized for humans; metadata declares Apache-2.0.
- [ONNX Community conversion card](https://huggingface.co/onnx-community/ormbg-ONNX/blob/034e2d884afbab897e10e78fc5bb566b29533fd6/README.md): declares `base_model: schirrmacher/ormbg` and Apache-2.0. These declarations establish the recorded provenance and license; the pinned conversion does not contain a separate LICENSE file. No model weights are redistributed in this repository.
- [Pinned model file inventory](https://huggingface.co/api/models/onnx-community/ormbg-ONNX/revision/034e2d884afbab897e10e78fc5bb566b29533fd6?blobs=true): float32 176,116,019 bytes; uint8 44,315,205 bytes; fp16 alternative 88,117,930 bytes.
- [Pinned preprocessing config](https://huggingface.co/onnx-community/ormbg-ONNX/blob/034e2d884afbab897e10e78fc5bb566b29533fd6/preprocessor_config.json): 1024×1024 RGB rescaling by 1/255, no mean/std normalization.
- [Author's inference implementation](https://huggingface.co/schirrmacher/ormbg/blob/6253b318240ef7a8670017b88d242f9f87f5abeb/ormbg/inference.py): bilinear resizing and min/max mask normalization. Canvas interpolation/rounding is not asserted to be numerically identical to PyTorch.
- [ONNX Runtime browser documentation](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) and [WebGPU documentation](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html).

WebGPU uses float32 to avoid requiring `shader-f16`; WASM uses the smaller uint8 conversion. A missing adapter, GPU session-creation error, or GPU run error falls back to WASM. Downloads use fixed revision URLs:

```text
https://huggingface.co/onnx-community/ormbg-ONNX/resolve/034e2d884afbab897e10e78fc5bb566b29533fd6/onnx/model.onnx
https://huggingface.co/onnx-community/ormbg-ONNX/resolve/034e2d884afbab897e10e78fc5bb566b29533fd6/onnx/model_uint8.onnx
```

Hugging Face redirects downloads to its CDN. Requests omit credentials and referrers. Cache Storage `nobg-ormbg-v1` stores model responses under the pinned URL. Storage denial or quota errors are caught and processing proceeds using downloaded bytes. No persistence guarantee is made: browsers can evict the cache. A fallback may download both model variants.

## Measured browser evidence

Tested 2026-10-31 on Linux, headless Google Chrome **156.0.8078.79**, using a production-built standalone harness served over localhost. The local fixture was the real 512×512 NASA astronaut photograph [documented by scikit-image](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut), downloaded before testing and selected through the local file input. JPEG/WebP checks encode that same photograph at 384×256; these are format/dimension checks, not additional independent quality samples.

| Actual worker backend | Model | First load | First inference/postprocess | First total | Reload cache load | Reload inference/postprocess | Reload total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WebGPU | float32 | 3,854 ms | 437 ms | 4,342 ms | 1,123 ms | 473 ms | 1,661 ms |
| WASM | uint8 | 1,241 ms | 5,500 ms | 6,781 ms | 622 ms | 5,484 ms | 6,146 ms |

The GPU test launches Chrome with `--enable-unsafe-webgpu --use-angle=vulkan --enable-features=Vulkan`. The WASM test uses `--disable-gpu`, and worker diagnostics confirm no available adapter and actual WASM selection. The main-page adapter probe returned null even in the successful worker WebGPU run; no claim is made about which physical adapter Chrome selected. Backend labels come from successful ONNX session creation with the explicitly selected provider, not merely from `navigator.gpu` existence. Some individual operators may still execute on the CPU. Hardware and browser-default performance remain to be checked. Timing varies with network, browser disk cache, compilation, and hardware; these are individual measurements, not benchmark averages.

Both backends returned a 262,144-byte 512×512 mask spanning 0–255. Visual inspection of the masked portrait showed the face, hair, and suit retained and most surrounding background removed. Fine edge fidelity and ambiguous foreground objects were not quantitatively scored; no ground-truth IoU/F1 was measured. The model is human-focused, and pets/products/glass/general-object quality is unverified. Upstream validation scores were not independently reproduced.

Checks completed:

- `npm install`: succeeds; audit reports zero vulnerabilities.
- `npm run build`: TypeScript and existing interface production build pass.
- `node src/inference/validation/build.mjs`: bundles the harness, actual worker, and runtime assets successfully. This matters because the interface does not import inference until Milestone 3.
- Real local PNG inference on WebGPU and WASM; dimensions, mask length and range asserted.
- Real-photo JPEG and WebP encodings preserve 384×256 dimensions and 98,304 mask entries.
- Empty file, GIF MIME type, and corrupt PNG reject with explicit readable errors before model loading.
- Blocked model download produces an explicit connection/download error, and a subsequent retry succeeds (WASM check).
- Reload creates a fresh worker/session and reads weights from Cache Storage. Model-host requests are blocked after the first run; processing still succeeds. This checks model cache reuse, not full offline application startup.
- Active abort returns `AbortError`; another call after abort succeeds from cached weights.
- Browser-context request inspection asserts every observed request is GET with no body. Observed paths were the local harness/worker/runtime and fixed model/CDN downloads. No image bytes were uploaded.
- `git diff --check`: passes.

Not run: Safari, Firefox, mobile, default-settings headed WebGPU, deliberate GPU device loss, storage-quota/denial injection, large-image/memory-pressure tests, broad quality corpus, numerical comparison against upstream, UI integration, downloads, deployment. No small UI hook is required for this milestone. The current app intentionally still shows the Milestone 1 interface.

## Reproduce

Run from the assigned worktree. No model or photo fixture is committed.

```sh
npm install
npm run build
node src/inference/validation/build.mjs
curl -fL https://raw.githubusercontent.com/scikit-image/scikit-image/v0.25.2/skimage/data/astronaut.png -o /tmp/nobg-astronaut.png
```

Serve the built harness with any static HTTP server, for example in another terminal:

```sh
npx vite preview --outDir /tmp/nobg-harness-dist --host 127.0.0.1 --port 5174
```

The browser runner uses an externally installed Playwright package to avoid adding a product/test dependency just for this harness:

```sh
npm install --prefix /tmp/nobg-browser-tools playwright
HARNESS_ORIGIN=http://127.0.0.1:5174 PLAYWRIGHT_MODULE=/tmp/nobg-browser-tools/node_modules/playwright/index.mjs node src/inference/validation/browser.mjs /tmp/nobg-astronaut.png
TEST_WEBGPU=1 HARNESS_ORIGIN=http://127.0.0.1:5174 PLAYWRIGHT_MODULE=/tmp/nobg-browser-tools/node_modules/playwright/index.mjs node src/inference/validation/browser.mjs /tmp/nobg-astronaut.png
```

Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome`. Each run prints backend diagnostics, error checks, dimensions/range, timings, cache keys, and request URLs. Preview screenshots are written only to `/tmp/nobg-mask-0.png` and `/tmp/nobg-mask-1.png`. For manual testing open `/src/inference/validation/harness.html` on the dev server or built harness server and select a local image.
