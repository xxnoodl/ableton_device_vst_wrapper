# Codex master implementation prompt — VST-to-Max for Live Interface Studio

You are the lead engineer building a production-quality, local-first desktop application that inspects third-party VST2/VST3 audio plugins and helps users design polished, configurable Max for Live (M4L) control interfaces for the ORIGINAL plugins. Do not reimplement plugin DSP. Do not claim functionality that cannot be verified against the actual host/plugin. This is a real engineering project, not a UI-only prototype.

## 0. Operating instructions

1. Inspect the repository and host environment before coding. Report OS, architecture, installed tools, Ableton Live/Max availability, licensing constraints, and gaps. Do not assume Live, Max, SDKs, or sample plugins are installed.
2. Read current official documentation and licenses for Steinberg VST3 SDK, JUCE, Cycling '74 Max/Max for Live, Ableton Live API, and relevant packaging frameworks. Record source links, versions, and decisions in `docs/research.md`. If network access is unavailable, record assumptions and defer verification; never fabricate capabilities.
3. Create `docs/architecture.md`, `docs/risks.md`, `docs/roadmap.md`, and an executable test plan before implementing high-risk integrations. Maintain an ADR log.
4. Implement vertical slices with tests. After each slice, report exactly what works, what is mocked, what is blocked, and how to reproduce the result.
5. Do not ask unnecessary questions. Make sensible defaults and document them. Ask only when a missing external dependency, legal authorization, or architectural fork prevents meaningful progress.
6. Prefer working, maintainable code over generated scaffolding. No hardcoded success screens, invented parameter bindings, fake telemetry presented as real, or placeholders described as finished.
7. Never overwrite user presets or plugin files. Make generated files deterministic where feasible; provide rollback and migration paths.

## 1. Product definition

Build a visual interface studio for creating highly customized M4L wrappers/controllers around existing VST2/VST3 plugins. The workflow is:

- Discover or import a plugin.
- Inspect its host-visible parameters, ranges, normalized values, text formatting, units, categories (when available), automation capabilities, and presets/state where supported.
- Optionally inspect screenshots of the original GUI and propose control groupings or styles. Computer vision/AI is optional and advisory; it must never be the sole source of parameter mappings.
- Let the user select ONLY the functions they want exposed.
- Offer functionality presets (Essential, Mixing, Mastering, Full, Custom) and user-defined presets; these are editable templates, not assumptions that every plugin exposes the same parameters.
- Design the interface using a highly interactive drag-and-drop, resizeable, snap-to-grid canvas with layers, grouping, alignment, distribution, responsive constraints, styling, and live preview.
- Offer a rich component library: knobs, faders, toggles, dropdowns, buttons, labels, value readouts, XY pads, envelopes, graphs, EQ curves, compressor transfer curves, level meters, spectrum analyzers, oscilloscopes, and custom vector widgets.
- Bind widgets to verified plugin parameters, calculated/derived data, audio analysis, or explicitly identified mock data.
- Generate/load a reusable M4L renderer/controller, plus project-specific schema/assets, with host-specific parameter mappings. Ideally use ONE reusable rendering engine instead of generating a large unique patch for every plugin.
- Persist multiple interface layouts for a single plugin, import/export projects, version presets, and permit re-editing.

The aesthetic bar is premium commercial audio software, not stock Max controls. Provide keyboard navigation, accessible contrast, precise value editing, high-DPI support, consistent typography, animation performance controls, and undo/redo.

## 2. Non-negotiable feasibility boundaries

- The original plugin retains its DSP and runs in a compatible plugin host. The M4L device is a controller/visualizer, not a replacement plugin binary.
- Ableton Live's public APIs may not provide a reliable, general-purpose, bidirectional path to every arbitrary third-party VST parameter or proprietary internal meter. Verify actual behavior with a real plugin in the supported Live version.
- Explore and benchmark these approaches, in this order: (A) Live API control of exposed parameters on a plugin device on the same track or a selected track; (B) a separate controlled plugin host/bridge with explicit audio and state management; (C) an opt-in plugin-specific adapter. Choose the narrowest reliable MVP. Do not silently switch to an external host and imply identical audio routing, latency, automation, or preset behavior.
- Verify parameter discovery, mapping, host automation, state restoration, device order, track targeting, latency, feedback loops, and two-way updates. Record unsupported cases explicitly.
- No generic VST API guarantees proprietary visualization data. If an EQ response can be derived from verified filter parameters, label it derived; if a spectrum requires an audio tap, implement and label the tap; if true gain reduction is inaccessible, do not fake it.
- Do not assume Max supports arbitrary HTML/CSS inside Live's device panel. Use supported native rendering facilities (e.g. JSUI/MGraphics or currently supported equivalents), subject to official documentation and benchmarks. A separate desktop design editor may use web technology.
- Device panel size, layout behavior, Live/Max versions, and supported UI features must be measured and documented rather than hardcoded from outdated assumptions.
- VST2 SDK availability/licensing is constrained. Treat VST2 as best-effort legacy support through lawfully available compatible technology; prioritize VST3. Do not bundle proprietary SDKs or bypass licensing/DRM.
- Never reverse-engineer copy protection, extract proprietary graphics without authorization, or redistribute copyrighted plugin assets. Screenshot-assisted layout inference should produce original components and require user-supplied/authorized inputs.
- Third-party plugin binaries are untrusted. Scan in a sandboxed/isolated helper process with timeouts, crash recovery, resource limits where possible, and no modification of binaries.

## 3. Architecture and repository

Use a modular monorepo with clear boundaries. Suggested structure (adjust after research):

```
apps/studio/                 # Desktop UI: Tauri + React + TypeScript (or justified alternative)
packages/schema/             # Versioned, typed interface IR + validation + migrations
packages/component-library/  # Design-time widgets and themes
packages/layout-engine/      # Grid, responsive sizing, snapping, constraints
packages/bindings/           # Parameter mapping, transforms, automation-safe updates
packages/project-store/      # Local projects, presets, assets, migrations
native/plugin-inspector/     # C++/JUCE/VST3 discovery and inspection process
native/bridge/               # Only if needed and proven viable
max/renderer/                # Reusable M4L renderer and controller source
max/examples/                # Verified sample patches and exported devices
fixtures/                    # Synthetic plugins/parameters and test schemas
scripts/                     # Build, verify, package, export, diagnostics
docs/                        # Research, ADRs, compatibility, troubleshooting
```

Use TypeScript for the studio and schema, C++ for plugin inspection where required, and Max-supported scripting/rendering for the M4L runtime. Prefer SQLite for metadata/project indexing if justified, but keep project export portable as versioned JSON plus assets. Avoid cloud dependencies for core use.

Keep the studio preview renderer and Max runtime renderer separate, but drive both from the same declarative interface schema. Document differences and feature parity tests. Do not assume pixel-perfect parity where Max cannot support it.

## 4. Versioned intermediate representation (IR)

Design a validated schema that includes:

- schema version, project ID, target platform/Live/Max versions
- plugin identity: vendor, name, format, plugin/class ID, binary fingerprint, installed path (local only), discovered capabilities
- parameter registry: stable host/plugin IDs where available, display name, unit, normalized range, actual range, step count, enum labels, defaults, directionality, automation flags, display formatting, discovered group, validation confidence
- binding target: Live device/track/parameter, bridge target, derived expression, analyzer source, or demo-only source
- widget tree: IDs, type, labels, styles, bounds, constraints, responsive rules, z-order, interaction behavior, keyboard bindings, tooltips
- graph data contracts: input source, update frequency, units, axes, smoothing, calibration, unavailable-state behavior
- themes, typography, colors, accessibility tokens, assets, breakpoints, device-panel profiles
- functionality presets and layout presets as distinct concepts
- export manifest, compatibility diagnostics, unresolved mappings, and migration metadata

Implement strict validation, safe parsing, schema migrations, round-trip serialization, golden fixtures, and explicit failure states. Never use arbitrary user-provided code evaluation in the runtime. Transform expressions should use a restricted typed DSL or enumerated transform operators.

## 5. Plugin discovery and inspection

Implement a separate native worker that:

1. Scans configured plugin directories, plus user-selected plugin paths.
2. Identifies VST3 and eligible VST2 binaries without executing unknown code in the main UI process.
3. Loads plugins using legally available host APIs and extracts exposed parameters and metadata.
4. Handles initialization failures, architecture mismatches, missing dependencies, GUI-less plugins, hangs, crashes, and duplicates.
5. Records plugin capabilities, fingerprint, discovery timestamp, and diagnostic logs.
6. Normalizes parameter values and supports display-string conversions when APIs allow.
7. Separates verified metadata from inferred classifications and user edits.
8. Supports manual parameter labeling/grouping and rescanning while preserving user bindings where IDs remain stable.

Provide a synthetic plugin fixture and at least one freely distributable VST3 test plugin. Never ship proprietary binaries in the repository.

## 6. Visual editor UX

Implement a desktop application with these workspaces:

- **Library:** scanned plugins, search, tags, health status, compatibility.
- **Inspector:** discovered controls and mappings, parameter search/filter, values/units, verification state.
- **Function selector:** multi-select controls, groups, presets, hide/show, user-created presets.
- **Canvas:** direct manipulation, pan/zoom, snap, resize, align, distribute, group, lock, reorder, duplicate, delete, multi-select, keyboard shortcuts, undo/redo.
- **Properties:** styling, component type, bounds, typography, behavior, binding, value formatting, graph configuration.
- **Preview:** target Live panel dimensions, overflow diagnostics, responsive layouts, demo/real-data status, performance indicators.
- **Export/Diagnostics:** validation checklist, target Live/Max compatibility, generated artifacts, setup instructions, binding test status.

Support dark/light themes, reusable design tokens, component variants, templates, custom themes, compact and expanded layouts. Distinguish functionality presets (which parameters are exposed) from layout presets (how they are displayed).

For the first end-to-end sample, design a premium compressor interface with threshold, ratio, attack, release, mix, and a clearly labeled gain-reduction placeholder until actual telemetry is supported. Then implement an EQ layout with derived response curve only when filter semantics are verified.

## 7. Reusable Max for Live runtime

Build a generic M4L controller/renderer that:

- Reads a validated exported schema and associated assets.
- Draws supported controls using native Max-supported APIs and handles pointer/keyboard input.
- Supports configurable component bounds, theming, value display, responsive behavior within measured panel limits, and optional page/tab navigation.
- Resolves target Live plugin device and exposed parameters via documented APIs; requires explicit target selection if ambiguity exists.
- Uses a robust parameter-binding lifecycle: discovery, validation, subscription/polling as supported, debounce/throttle, state update, teardown, and remapping.
- Prevents update feedback loops, handles Live undo/automation semantics carefully, and reports disconnected/unavailable controls visibly.
- Separates high-frequency visual rendering from lower-frequency control updates and never blocks the audio thread.
- Persists/restores the correct target and schema where supported; documents any limitations with device moves, duplicate tracks, racks, or project reload.
- Provides diagnostics showing parameter target IDs, current values, mapping status, and last error.

Research whether exported `.amxd` can be generated reliably in the build environment. If not, deliver the Max patch source and a reproducible export procedure in Max/Live. Never rename an arbitrary file `.amxd` and claim it is a valid device.

## 8. Graphs, analyzers, and advanced widgets

Create a visualization capability matrix with levels:

- Level 0: static visual widget.
- Level 1: control-bound visualization derived from host-visible parameters.
- Level 2: visualization using verified audio tap/analyzer data.
- Level 3: plugin-specific proprietary telemetry through an authorized adapter.

Implement graphs with correct axes, scaling, calibration, smoothing, and unit labels. Examples:

- EQ curve: only calculate from known filter type/frequency/Q/gain and verified transfer function; otherwise display an unavailable/approximation label.
- Spectrum analyzer: compute from actual tapped audio with configurable FFT/window/refresh rate, if routing is supported.
- Compressor curve: use known threshold/ratio/knee; actual gain-reduction meter needs real telemetry or clearly labeled approximation.
- Oscilloscope: real waveform from a documented audio tap.

Set CPU/render budgets and test on low-to-midrange machines. Avoid unnecessary redraws and memory allocations.

## 9. AI-assisted interpretation (later milestone)

Make AI optional, offline-capable, and pluggable. It may propose component detection, groupings, labels, layouts, and theme suggestions from authorized screenshots. It must show confidence and require user confirmation for uncertain mappings. Never infer a parameter ID solely from pixel coordinates or treat image analysis as evidence of host control access. Keep a fully functional manual workflow without AI.

## 10. Security, portability, and licensing

- Default local-only storage; no telemetry, cloud account, or network dependency for core functionality.
- Avoid shipping third-party plugin assets or binaries.
- Document licenses for SDKs, JUCE, Max assets, icons, and dependencies.
- Handle native plugin crashes in isolated processes and never trust plugin-reported strings or serialized project files.
- Validate IPC payloads and JSON schema; avoid arbitrary code execution in themes or expressions.
- Provide backup/export, project migration, and corrupted-project recovery.
- State supported OS and CPU architectures explicitly. Do not promise Windows/macOS/Linux parity without testing; Ableton Live/Max target platforms may constrain deployment.

## 11. Tests and acceptance criteria

Automated:

- schema validation, migrations, serialization, malformed inputs
- parameter normalization/denormalization, enums, unit formatting, mapping stability
- layout constraints, snap, resize, undo/redo, preset application
- UI component rendering snapshots and accessibility checks
- worker crash/timeouts and duplicate discovery
- deterministic export and import round trips
- graph numeric tests with known filter coefficients/signals

Manual integration, on a real licensed Ableton Live + Max for Live installation:

1. Load a known VST3 into Live and verify parameter visibility.
2. Open the generated M4L controller and explicitly bind it to the plugin.
3. Change a control in M4L; verify the original plugin parameter changes audibly/visually.
4. Change the original plugin parameter; verify the M4L control updates when supported.
5. Record and play back automation; verify no oscillation or unexpected state changes.
6. Save, close, and reopen the Live Set; verify restoration.
7. Move/duplicate the device and track; verify mapping behavior or clear reconnection prompts.
8. Exercise presets and multiple UI layouts.
9. Measure UI responsiveness, CPU use, memory use, and stability.
10. Test missing plugin, unavailable parameter, incompatible architecture, and broken mappings.

Mark every feature as `verified`, `partially verified`, `prototype`, or `unsupported`, with evidence. Do not claim complete VST2/VST3 coverage or universal wrappers.

## 12. Milestones and stop/go gates

**M0 — Feasibility spike (mandatory first).** Research official APIs; create a tiny M4L controller targeting one exposed parameter on one real VST3 in Live. Test read, write, automation, project reload, and target selection. Record exact versions and reproducible steps. If bidirectional control is blocked, demonstrate the limitation and propose alternatives before building a large editor.

**M1 — Core data pipeline.** Native VST3 inspector, synthetic fixture, typed schema, local project storage, discovery diagnostics, parameter browser.

**M2 — Studio MVP.** Premium component library, function selection, preset system, interactive canvas, properties panel, themes, undo/redo, schema-driven preview.

**M3 — Runtime MVP.** Reusable Max renderer for knobs/sliders/toggles/labels, verified Live parameter mapping, validation, and real `.amxd` export when supported.

**M4 — Visualizations.** Derived EQ/compressor graphs, then actual audio-analysis meters and scopes with explicit data provenance.

**M5 — Hardening.** Compatibility matrix, packaging, migrations, diagnostics, crash isolation, docs, accessibility and performance.

**M6 — Optional intelligence and legacy support.** Screenshot-assisted UI proposals, offline model integration, and legally feasible VST2 support.

Do not proceed from M0 to large-scale implementation until a real host/plugin control path is proven or the user explicitly accepts a changed scope.

## 13. Deliverables

Provide:

- Buildable repository with documented commands.
- Local-first desktop studio and reusable Max runtime sources.
- Sample project, fixtures, themes, functionality presets, and layout presets.
- At least one real VST3-to-M4L working demo, contingent on a test installation.
- Generated artifacts and export instructions.
- Documentation: architecture, compatibility, risks, limitations, testing, troubleshooting, and extension APIs.
- A machine-readable feature/verification matrix and screenshots/video instructions for demo validation.

## 14. First execution directive

Start NOW with M0. Inspect the environment and repository. Research the official interfaces. Produce a concise feasibility report and a minimal, testable proof of concept for controlling an actual VST3 parameter from Max for Live. If Live/Max is unavailable, implement the smallest runnable mock-backed contract test and prepare a precise manual verification script for the user's Live machine; do not call that integration verified. Then build the foundational schema and studio shell only after explaining the feasibility result and risks. Continue milestone by milestone, reporting actual test evidence and blockers.
