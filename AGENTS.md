# NoBG — Agent Instructions

## 1. Project Goal

Build NoBG, a background-removal studio that runs entirely in the visitor's browser.

The visitor uploads an image, the app removes the background on that device, the visitor picks a background color, and the visitor downloads the result.

No account, subscription, API key, or server-side image upload. Do not add a Python backend or an external inference API.

Read this file and `README.md` before working.

## 2. Technology and Scope

- React, Vite, and Tailwind CSS.
- ONNX Runtime Web or Transformers.js for inference.
- Canvas API for compositing and export.
- Web Worker for inference when it keeps the interface responsive.
- Static hosting on GitHub Pages through GitHub Actions.
- WebGPU when the browser supports it. WebAssembly otherwise.
- Cache model weights when browser storage allows.
- The first model candidate is ORMBG in a browser-compatible ONNX build. Record size, quality, license, and speed in the milestone PR before locking it in.
- Never commit model weights that the license forbids redistributing. Document how the browser downloads them.
- Never commit API keys, credentials, or private configuration.
- The repository stays private until the owner decides to publish.

The core flow is upload, remove, recolor, and download. Manual mask cleanup is a later milestone. Batch processing and image backgrounds are out of scope until the owner asks for them.

## 3. Agent Roles

### Codex Orchestrator

Responsibilities:

- Inspect the repository and read this file.
- Coordinate exactly two workers: Codex Inference Worker and AGY.
- Assign only the current milestone.
- Confirm the shared interface before implementation.
- Prepare separate Git worktrees and branches.
- Monitor progress and resolve coordination questions.
- Review changes and verify milestone requirements.
- Maintain `PROGRESS.md`.
- Push the milestone branch and open one pull request.
- Report the PR link, verification results, and blockers.
- Wait for the owner to merge before starting the next milestone.

The orchestrator owns shared documentation and repository setup:

- `AGENTS.md`
- `PROGRESS.md`
- `README.md`
- `.gitignore`
- GitHub Actions and Pages configuration

The orchestrator does not implement the editor or the inference code. Assign that work to the worker who owns it.

Never merge a pull request. Never force-push. Never push directly to `main`.

### Codex Inference Worker

Owns browser AI and image processing:

- Model loading, caching, and runtime selection
- Foreground mask generation
- Web Worker inference
- Canvas compositing and file export
- Mask edits made by the refinement tools

Do not edit the visual layout, marketing copy, or shared documentation without orchestrator agreement.

### AGY

Owns the interface:

- Page structure and editor layout
- Drag-and-drop upload
- Background color presets and HEX input
- Before-and-after comparison
- Refinement brush controls
- Responsive layout, contrast, and keyboard access

Do not change model loading, mask math, or shared documentation without orchestrator agreement.

## 4. Shared Interface

Confirm this contract before implementation. Change it only through the orchestrator.

### Visitor flow

Upload, then remove the background, then pick a color, then preview, then download.

Changing the color or downloading must not run the model again. A new image runs the model again.

### Files the workers share

Inference worker:

- `src/inference/removeBackground.ts`
- `src/inference/composite.ts`
- `src/workers/inference.worker.ts`

AGY:

- `src/App.tsx`
- `src/components/`
- `src/index.css`

Either worker may add files inside the folders they own. The orchestrator owns the Vite, TypeScript, and Tailwind setup files created in the foundation milestone.

### Removal result

`removeBackground` accepts a `File` and an optional `AbortSignal`. It resolves to:

- `width` and `height` of the original image
- the original pixels
- `mask`: a `Uint8Array` of length `width * height`, where `0` is background and `255` is foreground

`composite` accepts the original pixels, the mask, and a background. The background is a `#RRGGBB` string, or `null` for transparency. It returns a canvas the same size as the original image.

### Editor controls

Use these element ids:

- `image-dropzone`: drop target and file picker
- `image-input`: file input accepting PNG, JPG, and WebP
- `editor-stage`: preview area
- `compare-slider`: before-and-after control
- `color-presets`: preset color buttons
- `color-hex`: HEX text field
- `download-button`: export control
- `app-message`: status text with `aria-live="polite"`

Show a visible message when the file is empty, is not PNG, JPG, or WebP, or cannot be decoded. Keep the message understandable without relying only on color.

Preset colors must include at least white, black, and `#FF2D95`. Any valid `#RRGGBB` value must work. The HEX field is the source of truth for the current color.

### Download

Offer a transparent PNG and a PNG flattened onto the selected color. Preserve the original pixel dimensions when the browser can do so.

### Refinement

The brush edits the existing mask. Erase sets mask pixels toward `0`. Restore sets them toward `255`. Recolor and download use the edited mask. The brush does not run inference again.

## 5. Milestone Workflow

Complete the milestones in order.

For every milestone:

1. Confirm the previous milestone pull request is merged.
2. Fetch the latest `origin/main`.
3. Create a fresh milestone branch from `origin/main`.
4. Assign the milestone to its owner.
5. Implement only that milestone.
6. Verify its acceptance criteria.
7. Update `PROGRESS.md`.
8. Push the branch and open one pull request targeting `main`.
9. Report the pull request link and verification results.
10. Wait for the owner to merge.

Only the owner merges pull requests.

Opening a pull request does not finish the milestone. Mark it complete only after confirming the merge.

Do not start the next milestone while the current one is waiting for review. If the owner requests changes, update the existing pull request.

## 6. Milestones

### Milestone 0 — Foundation

Owner: Codex Orchestrator
Branch: `milestone/00-foundation`

Deliver:

- `README.md` with the product goal, design palette, stack, and agent overview.
- `AGENTS.md` with roles, file ownership, and this shared interface.
- `PROGRESS.md` listing every milestone.
- `.gitignore` for dependencies, build output, env files, and local configuration.
- The React, Vite, TypeScript, and Tailwind project skeleton, with a script that starts the dev server.
- No background-removal behavior yet.

Acceptance:

- Both workers have clear roles and file ownership.
- The shared interface is documented.
- `npm install` and `npm run dev` start a page.
- No credentials are committed.

### Milestone 1 — Interface

Owner: AGY
Branch: `milestone/01-ui`

Deliver:

- The black and hot-pink editor.
- Drop zone, file picker, preset colors, HEX field, compare slider, download button, and status message.
- Responsive layout for a phone-width viewport and a desktop viewport.
- Visible keyboard focus.

Acceptance:

- The agreed element ids exist.
- Colors match the palette in `README.md`.
- The layout is usable at a narrow mobile width and on a desktop width.
- Controls can be reached from the keyboard.
- The page does not call a model yet. Sample preview state is enough.

### Milestone 2 — Background removal

Owner: Codex Inference Worker
Branch: `milestone/02-ai`

Deliver:

- On-device background removal for a PNG, JPG, or WebP file.
- WebGPU when available, and WebAssembly otherwise.
- Model download and cache.
- Inference off the main thread when practical.
- A mask at the original image size.

Acceptance:

- A local image produces a foreground mask without sending the image to a server.
- The PR records the chosen model, its license, its approximate size, and how it is loaded.
- Unsupported files fail with a clear message.
- The UI from milestone 1 still builds.

### Milestone 3 — Working studio

Owner: Codex Orchestrator, with both workers contributing in sequence
Branch: `milestone/03-integration`

Deliver:

- Upload runs removal once.
- Preset and HEX changes recolor instantly from the saved mask.
- Before-and-after comparison works on the processed image.
- Download produces a transparent PNG and a colored PNG.

Acceptance:

- Recoloring does not run inference again.
- A second uploaded image replaces the previous result.
- Download uses the original dimensions when feasible.
- The orchestrator verifies the full path: upload, remove, recolor, download.

### Milestone 4 — Quality

Owner: Codex Orchestrator, with fixes assigned to the owning worker
Branch: `milestone/04-quality`

Deliver:

- Erase and restore tools for the mask.
- Clear errors for a failed model download, a failed decode, and an aborted run.
- A responsive page while the model loads and while inference runs.

Acceptance:

- Brush edits survive recolor and download.
- The page stays usable during processing.
- Errors are visible in `app-message`.
- No image bytes are uploaded to an application server.

### Milestone 5 — Release

Owner: Codex Orchestrator
Branch: `milestone/05-release`

Deliver:

- Final README with running and build instructions.
- GitHub Actions workflow that builds the static site.
- Documented browser checks, model-load behavior, and known limits.
- A release note that GitHub Pages on the free plan usually needs a public repository.

Acceptance:

- `npm run build` succeeds.
- The README matches the app that is actually in the repo.
- The workflow is ready, and the owner has been asked before any public or Pages setting is changed.
- No agent publishes the site or makes the repository public.

## 7. Git and Worktree Rules

- Each worker uses its own worktree.
- Never switch branches in another agent's folder.
- Use the milestone branch names listed above.
- Start each milestone from updated `origin/main`.
- Keep commits focused.
- Push only the assigned milestone branch.
- Never push directly to `main`.
- Never merge pull requests.
- Never force-push or rewrite shared history.
- Never delete another agent's worktree or branch.
- Do not overwrite unrelated owner changes.

For each milestone, there is one shared milestone branch.

When a milestone needs both workers:

- Coordinate access through the orchestrator.
- Commit changes one agent at a time.
- Fetch and fast-forward before the other agent contributes.
- Do not let two agents write the same worktree at the same time.

Git remotes for this repo use SSH: `git@github.com:Avanith12/NoBG.git`. Open pull requests with `gh`. If authentication fails, report the blocker and do not claim that a push or pull request succeeded.

## 8. Progress Tracking

`PROGRESS.md` lists every milestone with owner, status, branch, pull request, and verification.

Allowed statuses:

- Not started
- In progress
- Ready for review
- Merged
- Blocked

Before opening a milestone pull request, mark that milestone Ready for review and record the checks. After opening it, put the pull request link in `PROGRESS.md` and update the same pull request. Record Merged only after the owner merges.

## 9. Pull Request Requirements

Title format:

`Milestone N: Short description`

The description must include:

- The goal and the changes.
- The files changed.
- Acceptance checks and their results.
- Checks that were not run.
- Known issues or blockers.

Keep each pull request inside its milestone.

## 10. Verification Honesty

- Run checks that match the milestone.
- Do not claim a browser test, a model run, or a production deploy that did not happen.
- Say which checks the owner still needs to do.
- For inference, test with a real local image when the model is wired up. State the browser and whether WebGPU or WebAssembly ran.
