# VST-to-M4L Interface Studio

Local-first tools for designing Max for Live controls for original VST3 plugins. The plugin keeps its DSP in Live.

## Current state

The M0 feasibility gate passed for Arturia Augmented Strings' exposed Morph parameter on Live 12.3.2 with bundled Max 9.0.9. User-guided tests confirmed two-way control, automation recording/playback, explicit target switching, track movement, disconnect and delete/restore recovery. The original probe uses manual rebinding; generated Morph/Motion wrappers passed automatic load and reopen checks. Manual writes override automation until re-enabled. These results do not establish support for every plugin.

The intended workflow is choose a plugin, check the controls to show, generate a wrapper with a sensible default layout, and optionally customize it. Manual Max assembly is not a product requirement.

The [single-device hosting investigation](docs/plugin-hosting.md) evaluates putting the VST3 inside a Max device so the producer can load one reusable device with a generated panel and an Open plugin button. Max documents the needed hosting primitives; real state, automation, latency and sidechain tests are adoption gates. A separate four-control Pro-C 3 hosting prototype now passes user checks for native-editor access, floating-window interaction, two-way formatted control and audible compression. Independent Threshold recall passed after a startup fix and native shell save. Studio Threshold automation recording/playback also passed. Opening the native editor causes playback glitches; a UI-overhead fix is awaiting a host check. The regular generated wrappers still control a separately Live-hosted plugin.

The new **Live session** path reads actual plugin instances and their exposed controls through a read-only Max bridge. Choose an instance, check controls and generate an automatically arranged wrapper without a plugin-specific SDK adapter or JSON handoff. The user verified real session discovery, refresh after exposing Color, and a generated Color wrapper with two-way control in Live. Automatic reconnection after reopening the Set also passed for Color. Color automation and broader plugin coverage remain pending. Controls not exposed by Live still require Configure. See [Live session discovery](docs/live-session.md).

Canvas editing includes absolute grid snapping, nearby alignment guides, overlap protection with an explicit override, panel seams and visual cables. Layout presets retain the panel styling and cables. Numeric readouts no longer carry a redundant VALUE caption. Visual cables do not route parameters; the planned cross-plugin macro, XY and scene system is described in [performance routing](docs/performance-routing.md).

The new [performance workbench](http://127.0.0.1:5173/apps/studio/performance.html) implements the first cross-plugin macro slice: independently bound target slots, staged response curves, reversed ranges, explicit detents, smoothing, local rack saves and experimental device generation. The Strings example controls Morph and Motion on two separate instances. Browser previews and simulated host tests pass. The user verified delayed binding and staged Energy control across two Augmented Strings instances in Live; automation and lifecycle checks for this separate controller remain pending. XY, scenes and functional canvas sockets remain future work. See [performance routing](docs/performance-routing.md).

The browser studio provides a validated project format, local saves with backups, JSON import/export, function selection, interactive knob designs, multi-selection, layout tools, separate presets, properties, undo/redo and panel themes. Generate device now creates a ZIP containing a locally supplied Max-saved device shell, selected-control manifest and runtime dependencies. Extract together and drag Wrapper.amxd into Live; no patch copying or positioning is required by this path. The shell is copied unchanged, not encoded or rewritten. The first generated Morph/Motion bundle loaded and worked in Live after explicit binding. Automatic connection and reconnection after reopening passed user tests for the Morph/Motion configuration. A public release needs an approved distributable shell; generic native-to-Live routing remains unfinished. Preview controls never write plugin values; the optional bridge supplies metadata only.

Morph and Motion passed independent two-way control, simultaneous automation and compact in-Live visibility in user tests. Capture reading works; Node-for-Max capture saving is suspended after two native host crashes and is excluded from generated bundles. See [device generation](docs/device-generation.md).


Native Windows x64 discovery now reads real plugin controls in an isolated C++ helper. Installed Augmented Strings returned 2,748 parameters. In the studio, choose it from Installed plugins and check Morph and Motion; their measured mappings can generate a wrapper. Other native controls are currently Preview only until Live routing is verified. No manual parameter list or Max editing is needed for the measured pair. See [native inspection](docs/native-inspection.md).

## Run

Requires Node 24 or later. No npm packages are required. Native discovery also needs the locally built C++ helper; development setup uses `npm run build:inspector` with installed Visual Studio C++ Build Tools. This is developer setup, not the intended producer onboarding.

```sh
npm start
```

Open **http://127.0.0.1:5173**. Keep that terminal running; Ctrl+C stops the server. The server listens only on loopback and serves allowlisted project assets.

```sh
npm test
```

With the server running, `npm run smoke` checks local asset delivery and request guards. `npm run inventory` prints a static Windows VST3 inventory. Neither command loads plugin code.

Eighty-three automated tests cover Max contracts, schema validation, round trips, range transforms, layout bounds and local save backup recovery, isolated-worker failures and simulated-DOM studio workflows. The user confirmed the initial canvas arrangement works. Updated knob interactions, visual/accessibility checks and performance measurements remain pending. TypeScript is stripped at runtime; static typechecking is not configured yet.

## Try the studio

- Open the compressor study, select controls and drag their headers to position them.
- Shift-click labels or drag empty panel space to select multiple controls. Use toolbar alignment, spacing, grouping, locks, duplication and layers. Drag the corner handle to resize. Zoom from the toolbar; middle-drag or Space-drag pans.
- Select a header and use arrow keys to move by one grid step. Edit bounds or labels in Properties. Drag knobs up/down to adjust values; Shift gives fine control. Double-click resets to default, or type a precise value below the knob.
- Choose Chickenhead or Raised black (or the earlier styles) under Properties, then select an accent color. Each control keeps its own design.
- Set Value movement to Continuous, Equal steps, or Custom values, then Apply changes. The synthetic Ratio sample uses `4, 8, 10` with no intermediate values. These settings affect preview only.
- Save function presets separately from layout presets. They travel with project JSON; applying a layout does not enable hidden functions.
- Export JSON, reopen it with Open project, or Save locally to this browser. Updating a local save keeps its previous version as a backup.
- Export before clearing browser data or changing origins; browser saves are not portable backups.

The preview panel dimensions are design choices, not measured Live panel limits. Schema v2 is a limited IR with deterministic migration from v1; unknown fields and future versions fail explicitly. Full IR, native inspection, desktop packaging and real-host runtime validation remain pending. React/Tauri integration is deferred because dependency downloads are blocked in the current environment.

## Derived previews

Compressor study shows a synthetic hard-knee transfer curve; EQ study shows one declared peaking-filter response. Curves update from local controls and are not measured plugin output. They are currently omitted from native export. See [visualization boundaries](docs/visualizations.md).

## Plugin inventory

Use **Read VST3 folders** to list installed Windows VST3 files and CPU architecture. No plugin code is loaded and no parameters are discovered. Permission failures appear as diagnostics. See [inventory boundaries](docs/plugin-inventory.md).

## Live parameter capture

The source Max controller can capture exposed parameter metadata from the selected Live plugin. **Import Live capture** creates a new design project with explicit provenance and capture-time reset baselines. This new path awaits host testing; it does not discover SDK IDs or prove VST3 format. See [capture details](docs/host-capture.md).

## Max runtime export

Use **Export Max source** to download a ZIP, or run `node scripts/export-project.mjs fixtures/morph.project.json artifacts/NEW-DIRECTORY`. Extract all files together and follow its README in licensed Max/Live. The source runtime is a prototype with simulated-host tests; its actual Live execution is pending. See [runtime details](docs/runtime.md).

## Max probe

`max/examples/parameter-probe.maxpat` is source. Copy its objects into a stock Max Audio Effect while preserving audio pass-through. Keep `parameter-probe.js` beside the device and expose Morph with Live Configure. Select Augmented Strings, then click `bindselected`. The number box uses the raw host range. The second JS outlet must connect to `print M0-status` for diagnostics.

`max/renderer/parameter-probe.js` is canonical; the example copy must stay synchronized. Locally saved `.amxd` files and Live Sets are ignored until dependency portability is verified. Same-machine copied-device loading passed; clean-machine packaging is unverified. No plugin binaries, SDKs or proprietary assets are bundled.

See [progress](docs/progress.md), [architecture](docs/architecture.md), [risks](docs/risks.md), [research](docs/research.md), [troubleshooting](docs/troubleshooting.md), [extension APIs](docs/extension-apis.md) and [manual host tests](docs/manual-verification.md).

## Development

Use short, plain commit messages with no credit or co-author trailers. Update the progress log after meaningful changes and distinguish automated checks from user-reported host results. Keep dependency lockfiles when dependencies are introduced.
