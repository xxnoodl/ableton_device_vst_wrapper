# Studio slice test plan

Automated: run `npm test`. Tests cover strict parsing/version rejection, duplicate and missing parameter IDs, range and default validation, deterministic JSON round trips, grid/bounds behavior and backup recovery. Existing Max simulated contracts remain included.

Local asset smoke check: run `npm start`; GET /, /apps/studio/app.js, /packages/schema/index.ts and /packages/project-store/index.ts must return 200. GET /.git/config must return 404. Returned TypeScript modules must contain executable JavaScript. No browser interaction is established by these checks.

Browser manual checks (pending):

1. Open localhost, verify disconnected status and Morph metadata; move the demo value and confirm it is only local.
2. Open compressor sample; hide/show functions, drag headers to panel edges, and move a selected header with arrow keys. Verify snap, bounds and undo/redo.
3. Edit a label, type and bounds; reject out-of-panel geometry with a visible error.
4. Export/import JSON and compare layout/theme; import malformed JSON and verify the existing project survives.
5. Save locally, edit and save again, reload the page and load the project. Verify prior-save backup exists. Automated store tests exercise corrupt-save recovery.
6. Tab through controls, test focus contrast, zoom to 200%, resize the window and check overflow access. Verify reduced-motion setting creates no required animation.

Do not mark browser checks complete without performing them. Clean-machine Max device packaging, native inspector isolation, runtime mapping and pixel parity have separate future test plans.

Interactive knob checks (pending browser verification): drag vertically, toggle Shift mid-drag without value jumps, release outside the knob, verify touch/pointer cancellation, double-click reset, arrow/fine/Page/Home/End keys, focused-only wheel behavior, precise numeric entry and empty/invalid input recovery. Moving the header must affect layout only. Imported legacy faders should render as knobs.

Knob design checks: choose each design/accent from Properties, confirm control value and position survive style changes, undo/redo, export/import, and load a pre-style v1 project (Studio/Mint defaults). Confirm centered readouts retain fixed decimal formatting. Compare dark/light panels, scale visibility, indicator endpoints and Selector handle movement. Max parity is not yet implemented.

Stepped-knob checks: sample Ratio must show only 4, 8 or 10 across pointer, wheel, keyboard and numeric input. Verify fine drags accumulate to the next detent, Home/End reach allowed endpoints, double-click snaps to the allowed default, and invalid or out-of-range custom lists leave the project unchanged. Verify Equal steps (e.g. 8 positions), undo/redo and JSON round trips. Inspect Chickenhead grip clearance and Raised black base on both panel themes.

Canvas checks (browser pending): Shift-toggle selection, marquee selection, grouped moves at boundaries, unlock/relock, resize by pointer/keys, copy group without original membership, reorder overlapping knobs and confirm hit-testing follows visual stacking, all alignments and equal gaps, 50?150% zoom coordinate accuracy, Space/middle-drag pan, and undo/redo through each command. Verify locked controls cannot change properties and numeric input shortcuts do not delete controls.
