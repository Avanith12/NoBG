# Progress

NoBG is built through six sequential milestones. Only the owner merges pull requests. A milestone is complete only after its pull request is merged.

| Milestone | Owner | Status | Branch | PR | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Foundation | Codex Orchestrator | Ready for review | `milestone/00-foundation` | [#1](https://github.com/Avanith12/NoBG/pull/1) | `npm install` passed (0 vulnerabilities); `npm run build` passed; `npm run dev` started and HTTP checks passed for the page and transformed React module; `git diff --check` passed. |
| 1. Interface | AGY | Not started | `milestone/01-ui` | — | — |
| 2. Background removal | Codex Inference Worker | Not started | `milestone/02-ai` | — | — |
| 3. Working studio | Codex Orchestrator | Not started | `milestone/03-integration` | — | — |
| 4. Quality | Codex Orchestrator | Not started | `milestone/04-quality` | — | — |
| 5. Release | Codex Orchestrator | Not started | `milestone/05-release` | — | — |

Allowed statuses: Not started, In progress, Ready for review, Merged, Blocked.

Agents:

- Codex Orchestrator plans, reviews, and opens pull requests.
- Codex Inference Worker owns the model, mask, and export.
- AGY owns the editor and layout.

Milestone 0 is being prepared in an isolated worktree. The documented shared interface remains unchanged. Both existing workers wait for their assigned milestones; no editor or inference implementation belongs in the foundation.

Foundation verification used Node.js 25.8.2 and npm 11.11.1. Roles, file ownership, and the shared interface remain documented in `AGENTS.md`. No credentials, editor behavior, inference code, or model weights were added. Browser rendering was not tested; the owner should visually check the placeholder after `npm run dev`. No deployment was run.
