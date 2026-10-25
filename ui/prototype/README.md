# DPrism MVP1 — throwaway frontend prototype

Selected design: a horizontal DAG with node configuration below and general job information on the right, reached through two entry flows from the welcome page. The prototype remains frontend-only.

Run from the repository root:

```powershell
python ui/prototype/serve.py
```

Open <http://127.0.0.1:4173/>. No packages or internet are needed. Alternatively open `index.html` directly in a browser.

## One selected version

- No sidebar or global navigation menu. The logo and explicit **Về trang chủ** button return to the welcome page with its two entry choices.
- Expert flow: expert list, search, dedicated profile page, dedicated create/edit form and explicit return to the expert list. Profiles no longer open in a popup.
- Case creation offers two distinct routes: prominent template cards and exactly one Open Discussion button.
- Template route: select a template → editable Review plan & start → run. Context, files and related cases can be adjusted at review without traversing the four-step wizard.
- Open Discussion route: context → related cases → plan → final review → run.
- Drafts and running sessions can be reopened from My cases in the current browser session.
- Planning uses a job-style workspace: DAG at upper left, selected node configuration below, general plan settings on the right. Only the node configuration body and right settings body scroll vertically. The outer page and DAG never scroll vertically.
- The DAG supports Fit, zoom buttons, wheel zoom and dragging the background for large plans. Selection updates the configuration below.
- A running plan uses the same DAG workspace in read-only mode. Task colors and labels show waiting, assessment, review, synthesis and completion; task details appear below the DAG.
- Browser timers simulate each task for 3 seconds, sequentially in dependency order. The four-task sample takes approximately 12 seconds, then automatically opens the results dashboard. The simulation continues when navigating within the page; browser background throttling may extend elapsed time.
- The dashboard includes completion counts, elapsed time, expert/source counts, sample rating distribution, findings, dissent, expert views, source documents, event trace and JSON/Markdown export.
- Page navigation uses native View Transitions when supported and a CSS entrance fallback. Reduced-motion preferences disable animation. Node edits preserve each information pane's scroll position; selecting a different node resets its detail pane to the top.

The Prototype menu in the header contains optional immediate state previews, restart simulation, an in-memory JSON inspector and reset. Normal Start automatically runs the timed simulation; no toolbar action is needed to reach the dashboard. These are development controls, not runtime control available to a real discussion user. There is no A/B/C switcher. Old variant links resolve to the same selected design. Reload resets the in-memory data and timers.

## Click-through journeys

1. Home → Expert workspace → select expert → profile page → edit → save → profile → return to list. Create expert opens a dedicated form page.
2. Home → Discussion → Cases → Create case → choose template → Review plan & start (DAG) → optional inline input/context adjustments → Start.
3. Home → Discussion → Cases → Create case → the single Open Discussion button → four preparation steps → Start.
4. During a run, watch the active node move through the DAG every 3 seconds. Click a completed or pending node to inspect it without changing execution. Use **Theo dõi task đang chạy** to resume following the active node.
5. The final task automatically opens the dashboard. **Prototype → Màn hình mẫu** remains available only to skip ahead or preview early exit during UI review.
6. Dashboard → select a step → inspect expert views, dissent and source documents → trace → JSON/Markdown export → share full case → Cases / Shared cases.
7. Use the explicit **Về trang chủ** button or logo to return home. Dedicated return buttons lead from expert detail to expert list and from dashboard to Cases. Returning to Cases preserves a running simulation or draft in memory.

Only one example, AutoSupport, is used throughout. Baseline results are authored fixtures. Edited/custom tasks receive explicitly generic sample outputs instead of pretending AI analyzed their new instructions. Attachments in TXT/MD/CSV are read locally; PDF/DOCX only show file metadata. No uploads leave the browser.

## Scope and assumptions to validate

Confirmed decisions are appended to `../../requirements.md`. This prototype does not settle the remaining product decisions below:

- The wizard groups expert selection into each step of the plan rather than a separate global participants screen.
- The DAG from the original A variant has been selected; the other rendering variants and permanent sidebar have been removed. The information arrangement was refined to the requested job-style layout.
- Skills are preloaded examples, selectable/readable. A standalone skill authoring flow is not included yet.
- Context preview includes discussion documents, selected public cases, step references, expert skills and upstream briefs. Exact input selection rules still need product confirmation.
- Exchanges are modeled as independent assessment plus up to N cross-review rounds. The prototype uses a configurable range 0–5, with at least one round for multi-expert steps. The range is a UI assumption, not an approved backend limit.
- Early-exit preview stops at a fixture budget failure. The complete error taxonomy and rerun journey remain open.
- The timer compresses each task's independent assessment, optional review and synthesis into three seconds total. It illustrates phases and does not implement the configured number of actual AI exchanges or enforce token usage.
- Export choices JSON/Markdown, sharing scope, ownership controls and exact output layout still need validation.
- Role-based experts have no required personal name or photograph. No authentication, authorization, database, API, model, LangGraph, retrieval or real execution exists.
- Data stays in memory. Files, case content and expert/plan edits are lost on reload. No production modules were changed.

## Capture

Prototype branch: `prototype/mvp1-frontend`. The original three variants are captured at commit `eed5727`. Verdict: the user selected the DAG, removed the sidebar, and requested contextual navigation plus the job-style information arrangement. This revision implements those choices within the prototype; it has not been promoted to production. There is no configured implementation issue to link yet; keep this README as the local context pointer.

No automated tests are added to this throwaway UI. Before production implementation, select a design, complete the remaining user-story interview, then rebuild against the agreed contracts.

Verification: JavaScript parses and the main screens, wizard steps, shared-case list, running-session return, dashboard tabs, partial exit and dependency-cycle guard were exercised in an isolated JavaScript context with a minimal DOM stub. The local server serves the HTML/CSS/JavaScript. These checks do not establish browser geometry or animation quality. An attempt to inspect the page in Edge through Computer Use was stopped by the tool because it could not determine the current browser URL confidently enough to enforce policy; visual verification remains pending.

Timed-flow verification: a controlled clock confirmed task commits at 00:03, 00:06, 00:09 and 00:12, correct dependency order, continuation after navigating home, and automatic dashboard navigation. Dedicated expert view/edit pages, exactly one Open Discussion entry, direct template review and the full four-step Open Discussion route were also checked. No test suite or backend was added.

A separate real-timer JavaScript run completed a one-task plan in 3.02 seconds and opened the dashboard automatically. This verifies timer behavior, not rendered browser geometry.
