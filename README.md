# NoBG

No background. No problem.

NoBG is a privacy-first, AI-powered background removal studio that runs entirely in the browser. Upload an image, remove its background with on-device AI, replace it with any color, and download the result.

No account, subscription, API key, or server-side image processing.

## What it does

1. Upload a PNG, JPG, or WebP image.
2. Remove the background with a pretrained model running on the visitor's device.
3. Choose a preset color or any HEX code. Recoloring does not run the model again.
4. Compare the original and the result.
5. Download a transparent PNG, or a PNG with the selected background color, at the original dimensions when possible.

The first usable version is upload, removal, instant recolor, and download. Manual edge cleanup comes next. Batch processing and background images wait until that core flow is solid.

## Design

The interface is minimal, black and hot pink, with the editor as the focus. It must work on desktop, tablet, and phone, with readable contrast and keyboard access.

| Element | Color |
| --- | --- |
| Main background | `#09090B` |
| Primary pink | `#FF2D95` |
| Main text | `#FFFFFF` |
| Muted text | `#A1A1AA` |
| Panel background | `#18181B` |

## Stack

- React, Vite, and Tailwind CSS
- Browser inference with ONNX Runtime Web or Transformers.js
- Canvas for masking and export
- A Web Worker for inference when that keeps the page responsive
- GitHub Pages, deployed with GitHub Actions

The first model candidate is ORMBG, as a browser-compatible ONNX model. The inference worker must check model size, segmentation quality, license, and speed before locking that choice in. Use WebGPU when the browser supports it, and WebAssembly otherwise. Cache the model weights when browser storage allows. Apply the mask to the original-resolution image for export.

The repository stays private during development. Publishing with GitHub Pages on the free plan usually requires a public repository. That choice waits for the release milestone and the owner's approval.

## Development

Three Herdr agents build this repo. Only the owner merges pull requests.

- Codex Orchestrator plans the current milestone, reviews it, and opens the pull request.
- Codex Inference Worker owns the model, the mask, and export.
- AGY owns the editor, color picker, and responsive layout.

Agent roles, file ownership, and milestones are in `AGENTS.md`. Progress is in `PROGRESS.md`.

### Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+ (Node.js 22 LTS recommended).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The foundation currently renders a static placeholder; upload, editor, and inference features arrive in later milestones.

```sh
npm run build   # Type-check and build into dist/
npm run preview # Serve the production build locally
```

Tailwind CSS is connected through its Vite plugin. The palette tokens live in `src/index.css`.
