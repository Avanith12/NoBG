# Progress

NoBG is built through six sequential milestones. Only the owner merges pull requests. A milestone is complete only after its pull request is merged.

| Milestone | Owner | Status | Branch | PR | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Foundation | Codex Orchestrator | Merged | `milestone/00-foundation` | [#1](https://github.com/Avanith12/NoBG/pull/1) | `npm install` passed (0 vulnerabilities); `npm run build` passed; `npm run dev` started and HTTP checks passed for the page and transformed React module; `git diff --check` passed. |
| 1. Interface | AGY | Merged | `milestone/01-ui` | [#2](https://github.com/Avanith12/NoBG/pull/2) | `npm install` and `npm run build` passed; `git diff --check` passed; headless Chrome checks passed for required IDs, palette, presets/HEX, comparison, file validation and uploads, keyboard focus, and phone/desktop layouts. |
| 2. Background removal | Codex Inference Worker | Merged | `milestone/02-ai` | [#3](https://github.com/Avanith12/NoBG/pull/3) | `npm install` (0 vulnerabilities), `npm run build`, production worker-harness build, and diff checks passed. Independent Chrome 156 WebGPU/WASM real-photo inference, original-size masks, PNG/JPEG/WebP, errors, blocked-network cache reuse, and abort/recovery passed. |
| 3. Working studio | Codex Orchestrator | Merged | `milestone/03-integration` | [#4](https://github.com/Avanith12/NoBG/pull/4) | `npm ci`, `npm run build`, and `git diff --check` passed. Independent Chrome 158 WASM upload, replace, compare, recolor, and both original-size PNG exports passed. |
| 4. Quality | Codex Orchestrator | Ready for review | `milestone/04-quality` | — | `npm ci`, `npm run build`, and `git diff --check` passed. Independent Chrome 158 WASM brush, PNG, live error and cancellation, responsiveness, and narrow layout checks passed. |
| 5. Release | Codex Orchestrator | Not started | `milestone/05-release` | — | — |

Allowed statuses: Not started, In progress, Ready for review, Merged, Blocked.

Agents:

- Codex Orchestrator plans, reviews, and opens pull requests.
- Codex Inference Worker owns the model, mask, and export.
- AGY owns the editor and layout.

Milestone 0 was confirmed merged via GitHub PR #1 on 2026-10-31. Milestone 1 starts from origin/main at 5b88b97 in /tmp/nobg-ui. The documented shared interface remains unchanged. AGY owns the interface milestone; the Codex Inference Worker continues waiting. AGY completed the preserved interface in commit `4b3d36d`; the orchestrator reviewed it against the unchanged shared interface. Milestone 1 was confirmed merged via PR #2 on 2026-10-31 at 16:55:29 UTC. Milestone 2 starts from fresh origin/main at `19fc666` in `/tmp/nobg-ai` on `milestone/02-ai`. The prior local progress edit in `/tmp/nobg-ui` was not committed, pushed, or copied. The inference worker owns Milestone 2; AGY remains idle.

Foundation verification used Node.js 25.8.2 and npm 11.11.1. Roles, file ownership, and the shared interface remain documented in `AGENTS.md`. No credentials, editor behavior, inference code, or model weights were added. Browser rendering was not tested; the owner should visually check the placeholder after `npm run dev`. No deployment was run.


Milestone 1 verification (2026-10-31): AGY ran the production build. The orchestrator independently ran `npm install` (0 vulnerabilities), `npm run build`, `git diff --check`, source review, and a temporary CDP browser script using Google Chrome 156.0.8078.79 on Linux. Verified all eight required IDs and polite live status; README palette; white/black/hot-pink presets; custom HEX recoloring; comparison slider; download placeholder feedback; empty, unsupported, and undecodable file errors; generated PNG/JPG/WebP uploads through drag-and-drop; reset to sample; Tab navigation and visible focus. Inspected rendered screenshots at 1280×800 and 375×667, including the phone controls; no phone horizontal overflow. AGY also reports checks at 1280×900 and 375×812.

Milestone 1 limits: sample artwork and unprocessed local image previews only. No model, mask math, real export, inference test, or deployment was implemented or run. Firefox, Safari, real mobile hardware, and assistive-technology testing were not run; owner review should cover those browsers/devices as available. No application network upload code or model dependencies were found in source review. The existing local `AGY-ASSIGNMENT.md` remains untracked and is excluded from the PR. Coordination used the herdr CLI directly; the original project worktree was not edited.


Milestone 2 review (2026-10-31): the inference worker delivered commit `39ee869` through herdr. The orchestrator reviewed the unchanged result contract and source, then independently ran dependency installation, the existing UI build, the production harness/worker build, diff checks, and the committed browser runner on Linux Chrome 156.0.8078.79 against a local 512×512 NASA astronaut PNG. Both actual ONNX providers returned 262,144 mask entries spanning 0–255. JPEG and WebP encodings preserved 384×256 dimensions and 98,304 entries. Empty/unsupported/corrupt files and blocked model downloads produced readable errors; aborted processing recovered. Reloaded sessions worked with model-host requests blocked, confirming persistent weight-cache reuse. Observed requests were GETs with no body; source review confirms image bytes stay in the worker and never enter network requests or persistent storage. The existing editor files were not changed; AGY stayed idle. No UI hook was needed.

Independent timings: WebGPU first load 5,368 ms, inference/postprocess 428 ms, total 5,858 ms; cached reload total 1,578 ms. WASM first load 1,368 ms, inference/postprocess 5,455 ms, total 6,864 ms; cached reload total 7,345 ms. These single observations vary with network, compilation, and hardware. Headless WebGPU used explicit Chrome flags; the physical adapter was not established. Both backend labels are from successful explicitly selected ONNX providers, not a browser capability probe.

Model retained as the Milestone 2 candidate: [ONNX Community ORMBG](https://huggingface.co/onnx-community/ormbg-ONNX), pinned revision `034e2d884afbab897e10e78fc5bb566b29533fd6`, based on [schirrmacher/ormbg](https://huggingface.co/schirrmacher/ormbg). Both model cards declare Apache-2.0; the pinned conversion has no separate LICENSE file. Browser GET downloads use the pinned Hugging Face `/resolve/<revision>/onnx/` paths and its CDN, omitting credentials/referrers, and Cache Storage `nobg-ormbg-v1` when available. Float32 WebGPU weights: 176,116,019 bytes (~176.1 MB); uint8 WASM weights: 44,315,205 bytes (~44.3 MB). Runtime assets are served locally; uncompressed WASM is ~27.2 MB. No weights are committed. GPU initialization/run failures fall back to WASM; fallback can download both variants. Storage denial/quota exceptions permit uncached operation. Full provenance, measurements, reproduction commands, and limits are in `src/inference/validation/RESULTS.md`.

Quality review: the inspected portrait mask retains the face, hair, and suit and removes most surroundings. This single portrait does not validate general objects or fine-edge accuracy. Not run: Firefox, Safari, real mobile devices, default-settings headed WebGPU, deliberate GPU device loss, storage-denial/quota injection, large-image memory pressure, broad quality corpus, quantitative ground-truth scoring, upstream numeric parity, editor integration, real export, or deployment. The previous `/tmp/nobg-ui/PROGRESS.md` edit was neither committed nor pushed.

Milestone 2 was confirmed merged via PR #3 on 2026-10-31. Milestone 3 starts from origin/main at `8b2f301`.

Milestone 3 verification: the inference worker delivered the compositor and PNG encoder in `378d4f2`. AGY delivered the editor integration in `f5aa269`. The orchestrator rebuilt the integration branch and verified byte-for-byte matching output against the production build used in browser checks.

Headless Chrome 158.0.8127.36 on Linux ran the actual ORMBG WASM provider on a local 512×512 astronaut PNG, then replaced it with 384×256 JPEG and 320×240 WebP encodings of the same photo. The file picker and drag-and-drop worked. Browser instrumentation observed exactly one worker submission per valid upload and zero additional submissions on comparison, preset or HEX changes, transparency toggle, or downloads. The keyboard slider showed the original and processed views. Preview pixel checks confirmed the white preset and custom `#12AB34`. Independently decoded exports confirmed original dimensions, transparent and opaque pixels in the cutout, and a fully opaque flattened PNG with the selected HEX even when the preview was transparent. Empty, unsupported, and corrupt files produced readable status messages. The 375px viewport had no horizontal overflow. All 12 observed network requests were bodyless GETs. A separate canvas pixel check verified that source alpha and mask values are combined and inputs remain intact.

WebGPU editor integration, Firefox, Safari, physical mobile devices, and deployment were not verified for Milestone 3.

Milestone 3 was confirmed merged via PR #4 at `68f1c48` on 2026-11-21 UTC. Milestone 4 starts from that merge.

Milestone 4 verification: the inference worker committed mask strokes and model download error handling in `565e65a`. AGY committed brush integration and cancellation in `7626a6a` and resolved a narrow toolbar overflow found during review in `adc5069`. The orchestrator rebuilt the milestone branch and verified identical production assets to those used for the browser checks.

Independent mask checks covered a continuous segment, soft edges, clipping at image boundaries, and exact erase and restore values at the stroke center. Headless Chrome 158.0.8127.36 on Linux showed readable live messages for a corrupt image, a blocked model download, and cancellation of a paused download. The HEX control remained interactive during the paused download and during processing with the actual ORMBG WASM worker. The app then completed removal and accepted subsequent uploads.

On a local 512×512 portrait, the erased foreground pixel stayed transparent after recoloring and downloading. The flattened PNG held the selected HEX at the same pixel, and Restore recovered the original foreground pixel in the downloaded PNG. Both exports kept the source dimensions. Brush, recolor, and download submitted no new inference jobs. At 375×812 the active brush toolbar fit without horizontal overflow and a point on a 360×230 JPEG mapped to the intended mask pixel. All observed requests were bodyless GETs. WebGPU, Firefox, Safari, physical touch devices, and deployment were not verified for Milestone 4.
