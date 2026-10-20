# Test evidence and remaining checks

Run `npm test` with Node 24. The current suite has 60 passing tests covering schema/migration, malformed inputs, UTF-8 size bounds, storage backups, transforms/detents, layout commands, presets, inventory worker failures, runtime contracts/export, numeric models and studio flows under a simulated DOM.

With `npm start` running, `npm run smoke` checks 21 local assets plus private-path, cross-origin and write-request guards. Add `-- --inventory` to also exercise the real static inventory API. This machine returned 69 accessible plugin entries and one permission diagnostic. No plugin binary was loaded or modified.

The current review export is in `artifacts/review-runtime/` and `artifacts/review-runtime.zip`. It contains nine source/dependency files. Python's independent ZIP reader checked entry count and CRCs. Earlier exports are preserved. These are ignored local artifacts; tracked source and the CLI reproduce them.

User-reported real-host evidence applies only to the original Augmented Strings Morph probe. The new renderer, capture dialog/Node writer, multi-parameter lifecycle, native materials and panel sizing still need actual Live execution. Simulated LiveAPI/drawing tests do not verify the host.

Browser visual, touch/pointer capture, screen-reader and performance checks remain pending. The simulated DOM checks state/wiring, not browser paint/layout. Headless browser launch was blocked by environment approval policy; no browser success is claimed.

Native SDK inspection, binary fingerprints, a redistributable audio-plugin fixture, OS-level plugin sandboxing, Rust/Tauri packaging, static TypeScript checks and other platforms remain unimplemented or blocked by missing tools/dependencies. Synthetic PE fixtures are not audio plugins. Analyzer taps and proprietary telemetry are unsupported. See roadmap.md and compatibility.json.
