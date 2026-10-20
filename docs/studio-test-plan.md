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
