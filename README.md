# NoBG

NoBG removes image backgrounds in your browser. Images, masks, and PNG exports stay on your device. The app requires no account, API key, or backend.

## Run locally

Use Node.js 22.12 or newer (Node.js 22 LTS is used in CI). Node.js 20.19 or newer on the 20.x line also satisfies the project’s engine requirement.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. To type-check and build the static site, then preview the result locally, run:

```sh
npm run build
npm run preview
```

The build writes to `dist/` and uses relative asset URLs so it can be served from a subdirectory. The GitHub Actions workflow runs `npm ci` and `npm run build` for pull requests targeting `main`. A push to `main` also publishes `dist/` to GitHub Pages.

## Use the studio

1. Drop a PNG, JPEG, or WebP onto the upload zone, or use the file picker. The editor runs background removal once per image. Use **Cancel** to stop an active run.
2. Use **Compare** and the slider to inspect the original and the cutout. Pick a preset, enter a `#RRGGBB` value, or show the transparent preview.
3. Select **Erase** to remove parts of the cutout or **Restore** to bring parts of the original image back. Adjust the brush radius to work around edges.
4. Choose **Transparent PNG** or **Flattened PNG** and download. The flattened export uses the selected color even when the preview is transparent. Both formats preserve the original pixel dimensions when the browser can allocate and encode the canvas.

Recoloring, brush edits, and downloads reuse the current mask. Upload another image to start a new run.

## How the model loads

The first upload starts a Web Worker. It tries ONNX Runtime Web with WebGPU when an adapter is available and falls back to WebAssembly if GPU initialization or inference fails, or if no adapter is available.

The worker downloads the [ONNX Community ORMBG conversion](https://huggingface.co/onnx-community/ormbg-ONNX/tree/034e2d884afbab897e10e78fc5bb566b29533fd6), pinned at revision `034e2d884afbab897e10e78fc5bb566b29533fd6`. The model card declares Apache-2.0. The float32 WebGPU weights are about 176 MB. The uint8 WebAssembly weights are about 44 MB. The WASM runtime is served with the app and is about 27 MB before HTTP compression.

The browser stores downloaded weights in Cache Storage (`nobg-ormbg-v1`) when storage is available. A GPU fallback can fetch both weight variants. The first run needs access to Hugging Face and its CDN, and clearing or losing the cache can require another download. Model requests contain no image data.

## Browser checks and known limits

- The production build served from a local `/NoBG/` subdirectory was verified in headless Chrome 158 on Linux with real WebAssembly inference, including PNG, JPEG, and WebP uploads, comparison, recoloring, brush edits, both PNG exports, cancellation, and readable decode and model-download errors. A 375 CSS pixel viewport was checked with the brush active.
- Earlier inference-only checks exercised WebGPU under explicit headless Chrome flags and verified cached model reuse with the model host blocked. See the [model validation record](src/inference/validation/RESULTS.md) and [milestone progress](PROGRESS.md) for the exact scope.
- Default-settings WebGPU in the full editor, Firefox, Safari, and physical mobile devices remain unverified.
- Model accuracy varies by image, especially on fine edges. Large images may exceed browser memory or canvas limits. Processing time depends on the device and whether the weights are cached.
- The editor handles one image at a time and exports PNG. Batch processing and image backgrounds are outside the current scope.

## Release note

GitHub Pages on GitHub Free generally requires a public repository. Eligible paid plans support Pages from private repositories. The workflow builds the site for review. Publishing, enabling Pages, or changing repository visibility requires separate owner approval. [GitHub Pages availability](https://docs.github.com/en/pages/quickstart#who-can-use-this-feature)

## Project

NoBG uses React, TypeScript, Vite, Tailwind CSS, ONNX Runtime Web, and the Canvas API. The palette is near-black `#09090B`, hot pink `#FF2D95`, white `#FFFFFF`, muted zinc `#A1A1AA`, and charcoal `#18181B`.

The orchestrator handles integration and releases, the inference worker owns model and mask processing, and AGY owns the editor. See [agent instructions](AGENTS.md) for ownership and workflow.
