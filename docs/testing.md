# Test evidence and remaining checks

Run `npm test` with Node 24. This machine passes 149 tests covering schema/storage, layout/presets, studio wiring under a simulated DOM, Max contracts, device packaging, native metadata validation and original compiled ABI fixtures. Native compiled-fixture cases are explicitly skipped when the helper/fixtures have not been built; run `npm run build:inspector` on Windows with installed Visual Studio C++ tools to include them.

The native fixtures exercise metadata, enum labels, invalid defaults, class choice, an actual child-process crash and a hang, followed by a successful inspection. They contain no audio DSP and do not count as a complete audio-plugin fixture. Node process tests also check malformed output, output overflow and wall deadlines. The helper applies a Windows resource job; filesystem/network security sandboxing is not established.

With `npm start` running, `npm run smoke` checks 33 assets and private-path, malformed inspection-ID, cross-origin and write-request guards. `npm run smoke -- --inventory` adds static inventory (69 accessible entries and one permission diagnostic here). Static inventory never loads a plugin. Native inspection is a separate explicit operation.

Actual Augmented Strings native/HTTP inspection read 2,748 parameters, including 580 editable entries with valid metadata and 2,080 invalid -1 defaults retained as diagnostics. Morph SDK ID 1 and Motion ID 4 were converted through the narrow measured Live adapter into an automatically arranged project and generated device bundle. Tests do not infer generic Live routing from those native results.

User Live tests cover the original probe and generated Morph/Motion runtime: independent two-way control, simultaneous automation, compact panel visibility, disconnect/delete/restore handling, direct bundle loading and automatic connection/reopen after fixing the saved bundle path. Capture reading passed. Node-for-Max capture saving crashed Max and remains excluded from generated bundles. Existing failing test devices were preserved and disabled, not rewritten.

The newly discovered-ID bundle and new installed-plugin browser selection need user checks. Browser paint, touch capture, accessibility and performance remain unverified; the simulated DOM tests application state/wiring only. No browser screenshot or automation success is claimed.

Remaining work includes automatic native-to-Live routing beyond the exact-fingerprint two-control adapter, an approved distributable device shell, distinct device-reference handling, clean-machine portability, stronger OS sandboxing, a full audio DSP fixture, static TypeScript checks and desktop packaging. Proprietary telemetry/analyzer taps, VST2 and other platforms remain unsupported. See native-inspection.md, device-generation.md and roadmap.md.

Performance rack coverage: shared curve/staging/inversion/detent validation; competing destination and alias rejection; explicit multi-instance binding; coalesced, smoothed writes; no initial writes; automation observations before the first manual tick; direct-edit interruption; deletion, disabled targets, reload and stale observer handling. Simulated DOM checks cover preview gestures, route forms, local saves, checked-control handoff and generation success/failure. The eight-file performance bundle uses a separate controller. None of this establishes actual Live behavior.

Next host gate: load the generated Strings rack with two separate Augmented Strings instances, expose Morph on A and Motion on B, explicitly bind slots in order and move Energy. Verify staged motion, independent direct edits, normal destination automation override/re-enable, disconnect, deletion and reopen. Begin with the one-macro layout before testing larger panels. Do not reopen Node-for-Max capture saving devices.

Delayed binding regression: binding arms for five seconds before reading Live selection. Simulated tests begin with Wrapper selected, switch to the desired plugin before the callback and verify slot assignment with no initial writes. Repeated clicks, disconnect, reload and direct binding cancel old timers. Actual delayed selection in Live remains pending.

User host result: delayed binding succeeded for both Strings slots. Energy moved Morph across its full travel on the first instance and introduced Motion after approximately 0.4 on the second, as configured. This verifies initial routing/staging across two instances of Augmented Strings, not different plugin products or remaining lifecycle/automation behavior.

Live session bridge: tests cover strict catalog and capture provenance, automatic checked-control layout, generic generated runtime binding/writing on a non-Arturia 0-100 parameter, nested racks, deletion, stale refresh generations, restart authentication, request size/type/capability limits, no writes or selected-device access in the helper, scheduled LiveAPI reads, cancellation, work/payload limits and actual HTTP endpoints. Simulated DOM checks cover the Live picker, filtering/checking, auto layout, stale snapshots and helper ZIP generation. This does not establish actual Max/Live bridge operation or browser paint. Next host gate: load the read-only bridge with the server running and confirm real plugin instances and controls appear in Live session, then generate a selected control beyond the measured pair.

Actual session-path host result: user verified both Strings instances in the browser, discovered newly exposed Color after refresh, generated a Color-only wrapper and confirmed both wrapper-to-synth writes and synth-to-wrapper observation. This is a real control outside the native Morph/Motion adapter. Captured-registry reopen/automation checks and other plugin products remain pending.

Captured-registry persistence result: user saved and reopened the Set with the Color wrapper folder unchanged and confirmed control without bindselected. Color automatic predecessor restoration passes for the tested configuration. Different plugin products and Color automation remain pending.

Pro-C 3 host result: user selected all 11 exposed controls and confirmed two-way control. The initial generated layout was too small because controls stacked vertically and the copied drawing area stayed 220 pixels wide. Horizontal layout/resize regressions now pass in the Max simulation; user subsequently confirmed the corrected expanded layout works in Live with two-way control intact. Pro-C 3 automation and Set reopen remain unverified.

Pro-C 3 reopen result: user reports manual binding is required after Set reopen. Automatic reconnection fails this host check; startup console diagnosis is pending. Earlier Augmented Strings reconnect success does not establish Pro-C 3 behavior.

Pro-C 3 reconnect follow-up: after placing the new horizontal wrapper immediately after Pro-C 3, user confirmed the save/reopen automatic connection test works. The earlier failure is resolved by device placement; no runtime patch was needed. The immediate-predecessor requirement remains in force. Pro-C 3 automation is not yet verified.

Pro-C 3 automation follow-up: user confirmed the wrapper follows Threshold automation during playback without a wrapper gesture. This covers incoming Threshold automation only, not every parameter or recording automation from the wrapper.

Internal hosting proof: six simulated-host tests cover local graph creation/reuse, unique index resolution, plugin-formatted readouts, feedback without writes, explicit/coalesced gestures, dry/wet exclusivity, timeout/error recovery, stop cancellation and editor-button dispatch. They do not load a plugin into Max. First host check is the separate Pro-C-3-Studio-Test.amxd in artifacts/pro-c3-internal-host: load it alone on an audio track and open its internal editor. No automation lanes, guaranteed preset state, latency compensation or external sidechain are supplied by this proof.

Internal Pro-C 3 host result: user confirmed the standalone test device loads and its Open plugin button opens the internal FabFilter window. This establishes load/editor operation only; formatted values, control, audio and remaining hosting gates require separate checks.

Hosted Attack formatting: user changed Attack in the internal FabFilter editor and confirmed the Studio readout follows with matching time text including ms. This verifies native-to-panel Attack feedback and formatting, not reverse control or other hosting gates.

Hosted Attack reverse-control result: user confirmed dragging the Studio Attack knob moves the internal FabFilter Attack with matching time values. Together with the native-editor test, this establishes two-way Attack control and formatted time display on the hosting proof.

Hosted four-control/floating result: user confirmed FabFilter stays visible while using the Studio panel and all four knobs respond in both directions with matching values/units. This covers Threshold, Ratio, Attack and Release on the internal Pro-C 3 proof. Audio processing, saved state, automation, latency and sidechains are not inferred.

Internal Pro-C 3 audio result: user reported audible compression works with all test knobs during the requested audio playback check. This verifies basic stereo audio processing/control response, not measured latency, audio equivalence, sidechain support or saved sound state.

Hosted Set state result: user explicitly confirmed saving, closing and reopening the Set restores internal Pro-C 3 settings, including native-editor-only Style. This is a user-verified Set recall result on the current prototype, not evidence for every state field, device-preset recall or independent duplicates. No persistence code changed; initialization/restoration ordering still needs investigation because the controller currently sends plug on initialization.

Hosted duplicate result: user duplicated the Studio device and confirmed changing Threshold on the duplicate does not change the original. This verifies current-session instance independence for that control; independent duplicate states across reopen are not inferred.

Independent hosted recall FAILED: user reports both duplicated instances reset to -16 dB after reopening rather than keeping their different Thresholds. Startup sent plug unconditionally. Candidate now reuses the current matching plugin, loads only an empty host and rejects a different saved product. Two new regressions pass; 146 total tests pass. Native one-time shell authoring and two-instance recall remain pending in Live. Earlier single-instance recall evidence is superseded for persistence claims.

Hosted recall retest PASSED for separate Threshold values: after a native Max Save As of the fixed device, user loaded it twice, set -10 dB and -30 dB, saved/closed/reopened the Set and confirmed both values remain independent. The actual saved shell contains one parameter-enabled vst~ host and was preserved unchanged locally. This does not establish native-editor-only state independence or device-preset recall.

Hosted automation candidate: four static native parameters (Threshold, Ratio, Attack, Release) are defined as Float 0-1, Automated and Stored, with fixed names/IDs and no forced initial value. Two new tests verify bank wiring and playback without feedback writes; all 148 tests pass. Native Max Save As and actual chooser/recording/playback/override/reopen checks are pending. The lane is normalized; only the Studio readout uses plugin-formatted units.

Automation first host result: user reports automation works while custom knob gestures do not. Actual saved shell inspection confirms four registered names and abstraction-output wiring. Fixed custom routing to named native live.dial float/set messages rather than abstraction-box messages; simulation no longer assumes those box messages forward into its inlet. New direct-dispatch regression passes; 149 total tests pass. Retest knobs on artifacts/pro-c3-internal-host-automation-fix; its already authored automation shell needs no additional Max save. Recording/override/reopen remain separately unverified.

2026-10-23 hosting follow-up: user reports custom knobs work after restarting the Set following the direct-native-dial bridge fix. This verifies post-reopen knob operation, not immediate fresh-insertion operation or automation recording from custom gestures.
