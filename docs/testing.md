# Test evidence and remaining checks

Run `npm test` with Node 24. This machine passes 83 tests covering schema/storage, layout/presets, studio wiring under a simulated DOM, Max contracts, device packaging, native metadata validation and original compiled ABI fixtures. Native compiled-fixture cases are explicitly skipped when the helper/fixtures have not been built; run `npm run build:inspector` on Windows with installed Visual Studio C++ tools to include them.

The native fixtures exercise metadata, enum labels, invalid defaults, class choice, an actual child-process crash and a hang, followed by a successful inspection. They contain no audio DSP and do not count as a complete audio-plugin fixture. Node process tests also check malformed output, output overflow and wall deadlines. The helper applies a Windows resource job; filesystem/network security sandboxing is not established.

With `npm start` running, `npm run smoke` checks 23 assets and private-path, malformed inspection-ID, cross-origin and write-request guards. `npm run smoke -- --inventory` adds static inventory (69 accessible entries and one permission diagnostic here). Static inventory never loads a plugin. Native inspection is a separate explicit operation.

Actual Augmented Strings native/HTTP inspection read 2,748 parameters, including 580 editable entries with valid metadata and 2,080 invalid -1 defaults retained as diagnostics. Morph SDK ID 1 and Motion ID 4 were converted through the narrow measured Live adapter into an automatically arranged project and generated device bundle. Tests do not infer generic Live routing from those native results.

User Live tests cover the original probe and generated Morph/Motion runtime: independent two-way control, simultaneous automation, compact panel visibility, disconnect/delete/restore handling, direct bundle loading and automatic connection/reopen after fixing the saved bundle path. Capture reading passed. Node-for-Max capture saving crashed Max and remains excluded from generated bundles. Existing failing test devices were preserved and disabled, not rewritten.

The newly discovered-ID bundle and new installed-plugin browser selection need user checks. Browser paint, touch capture, accessibility and performance remain unverified; the simulated DOM tests application state/wiring only. No browser screenshot or automation success is claimed.

Remaining work includes automatic native-to-Live routing beyond the exact-fingerprint two-control adapter, an approved distributable device shell, distinct device-reference handling, clean-machine portability, stronger OS sandboxing, a full audio DSP fixture, static TypeScript checks and desktop packaging. Proprietary telemetry/analyzer taps, VST2 and other platforms remain unsupported. See native-inspection.md, device-generation.md and roadmap.md.
