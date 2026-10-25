# DPrism MVP1 — throwaway frontend prototype

Question: which presentation makes a discussion plan easiest to understand and review before Start?

Run from the repository root:

```powershell
python ui/prototype/serve.py
```

Open <http://127.0.0.1:4173/?variant=A>. No packages or internet are needed. Alternatively open `index.html` directly in a browser.

## Three structural variants

- `?variant=A`: workspace sidebar, horizontal DAG and step inspector. Large plans scroll within the canvas instead of shrinking labels.
- `?variant=B`: top navigation, ordered step rail and expanded configuration form.
- `?variant=C`: compact workspace navigation, step/expert assignment matrix and inspector.

The floating PROTOTYPE bar switches variants without discarding edits. Left/right arrow keys work outside form fields. State opens an in-memory JSON inspector. Reload resets everything. The switcher exists only in this explicitly named throwaway artifact; there is no production app/build to gate it in.

## Click-through journeys

1. Home → Create expert → enter role, approach, instructions and skills → save → inspect profile.
2. Home → Discussion → choose template → STAR and documents → optional shared cases → edit plan → Review → Start.
3. No suitable template → describe problem → see fixture recommendations → choose a template or create a new one manually.
4. Open discussion → topic/desired output → optional shared cases → inspect proposed fixture plan → edit → Review → Start.
5. During the running storyboard use **Màn hình mẫu** on the prototype toolbar to preview complete or early-exit results. This toolbar is outside the product UI. It does not represent a user's ability to control a real run.
6. Dashboard → select a step → inspect expert views, dissent and source documents → trace → JSON/Markdown export → share full case → Case Library.

Only one example, AutoSupport, is used throughout. Baseline results are authored fixtures. Edited/custom tasks receive explicitly generic sample outputs instead of pretending AI analyzed their new instructions. Attachments in TXT/MD/CSV are read locally; PDF/DOCX only show file metadata. No uploads leave the browser.

## Scope and assumptions to validate

Confirmed decisions are appended to `../../requirements.md`. This prototype does not settle the remaining product decisions below:

- The wizard groups expert selection into each step of the plan rather than a separate global participants screen.
- Three presentation variants are exploratory; none has been chosen as the final UI.
- Skills are preloaded examples, selectable/readable. A standalone skill authoring flow is not included yet.
- Context preview includes discussion documents, selected public cases, step references, expert skills and upstream briefs. Exact input selection rules still need product confirmation.
- Exchanges are modeled as independent assessment plus up to N cross-review rounds. The prototype uses a configurable range 0–5, with at least one round for multi-expert steps. The range is a UI assumption, not an approved backend limit.
- Early-exit preview stops at a fixture budget failure. The complete error taxonomy and rerun journey remain open.
- Export choices JSON/Markdown, sharing scope, ownership controls and exact output layout still need validation.
- Role-based experts have no required personal name or photograph. No authentication, authorization, database, API, model, LangGraph, retrieval or real execution exists.
- Data stays in memory. Files, case content and expert/plan edits are lost on reload. No production modules were changed.

## Capture

Prototype branch: `prototype/mvp1-frontend`. The source and journey notes are the primary reference for discussion. Verdict: **pending user review**, no variant has been validated or promoted to production. There is no configured implementation issue to link yet; keep this README as the local context pointer.

No automated tests are added to this throwaway UI. Before production implementation, select a design, complete the remaining user-story interview, then rebuild against the agreed contracts.

Verification performed: JavaScript parses; 29 screen/variant render combinations execute in an isolated JavaScript context with a minimal DOM stub; complete/partial fixture states, dependency cycle rejection and generic output for edited steps were checked. The local server serves HTML/CSS/JavaScript with HTTP 200. This is not browser automation or visual verification: no browser surface was connected during implementation.
