# Progress

## 2026-10-20

- Created the M0 repository, architecture, research, risks and manual test plan.
- Added Max patch source and a parameter probe with explicit binding and observer feedback.
- Five simulated LiveAPI contract tests passed. Selected-device lookup still lacks automated coverage.
- User exposed Morph on Arturia Augmented Strings in Live Configure.
- User confirmed Morph changes update the Max number box.
- User confirmed editing the locked Max number box changes Morph inside the synth.
- User reported saving the Max device successfully. The exported file is not present in the repository example folder; export location and dependency inclusion need checking.

Host: installed Live 12.3.2, bundled Max 9.0.9, Windows x64. Exact plugin version and binary fingerprint are not recorded. Real-host results are user-reported in the working session; no host logs or recordings captured yet.

## Next checks

- Confirm saved device location and JS dependency inclusion.
- Test writing during active automation and automation recording; playback observation passed by user report.
- Reopen device and Set; verify explicit rebinding and document restoration limits.
- Test target deletion, moves and duplicate devices.
- Record plugin version, panel dimensions and performance observations.

M0 remains open. The studio and native inspector remain behind the feasibility gate.

## Commit convention

Use short, plain messages such as `add parameter probe` or `record morph test`. No credits or co-author trailers. Commit related changes together and update this log for meaningful results. Git author identity is still required by Git; configure it locally using the maintainer's supplied name and email.

- Added ignore rules for local assistant/editor state, secrets and temporary files. Shared source, documentation and dependency lockfiles remain trackable.

## Automation playback check

- User reported the connection stopped updating before the automation test. Cause is unknown.
- Explicit disconnect, selecting Augmented Strings and clicking bindselected restored control.
- User confirmed Morph automation updates both Live and the Max number box during playback.
- Writing from Max while automation is active, automation recording, reopen and device lifecycle checks remain untested.

## Set reopen check

- User saved and reopened the Live Set. Morph control did not reconnect automatically.
- Disconnect followed by selecting Augmented Strings and bindselected restored operation.
- Manual reconnection after reload is confirmed by user report. Automatic restoration remains unsupported; M0 must document this limitation.

## Track selection check

- User confirmed the connected Max number box continues following Morph automation after selecting a different track, without rebinding.
- This checks selection changes only. Moving, duplicating or deleting tracks/devices remains untested.

## Track move check

- User moved the Augmented Strings track above or below another track and confirmed Max still follows Morph during playback without rebinding.
- This verifies the existing connection survives track reorder in this session. Device moves, duplication and deletion remain untested.

## Write during automation check

- User entered 0.5 through Max during Morph automation playback and reported automation became disabled/overridden.
- Current direct LiveAPI value writes interrupt automation; they do not preserve playback ownership. This behavior must be exposed in the eventual controller UX.
- Re-enabling automation and confirming resumed playback remain pending. Automation recording remains untested.

## Automation recovery check

- User re-enabled Morph automation in Live and confirmed Max follows playback again.
- Observed sequence: playback follows, manual Max write overrides automation, explicit re-enable restores playback observation.
- Automation recording and undo behavior remain untested.

## Disconnect check

- User confirmed Morph automation continues in Live after clicking disconnect.
- While disconnected, entering 0.5 in Max did not affect Morph or interrupt its automation.
- User also confirmed the Max number stops following automation after disconnect and stays at its locally entered value. Both observer detachment and write isolation passed by user report.

## Target deletion check in progress

- User deleted Augmented Strings and edited the Max number; no visible errors or patch UI changes were reported.
- Console output has not been inspected. This is not evidence that missing-target detection passed or failed.
- Current patch has no inline disconnected/error indicator; diagnostics are sent to Max Console. Production UI needs visible target availability.

## Missing target guard fix

- After reconnecting the diagnostic outlet, user reported repeated native LiveAPI no-valid-object messages after target deletion.
- Added target type checks and rejection of empty host responses, with disconnect on unavailable targets to prevent repeated property reads on later edits.
- Seven automated simulated contract tests pass, including stale nonzero IDs with empty reads and invalid types. Fix still needs real-host retest; a native warning on the first failed read may remain.
- Diagnostic wire had been removed during initial missing-script loading; user reconnected the second JS outlet and confirmed disconnect/bind messages.

## Missing target retest

- User confirmed subsequent edits after deletion show only disconnected and error: target unavailable; bind explicitly, without new native LiveAPI errors.
- Missing-target guard recovery passed for this session by user report. Native warnings seen around deletion/initial failure remain a limitation; zero-warning teardown is not verified.
- Automatic restoration and inline target/error display remain unsupported.

## Restored target check

- User restored the deleted synth with Live undo, selected Augmented Strings and rebound. Morph changes again update the Max number.
- Delete/restore recovery is confirmed with explicit rebinding. Automatic restoration is not supported.
- Remaining M0 work includes automation recording, duplicate target selection, plugin version evidence and portable device dependency checks. Performance and device panel measurements are also pending.

## Second synth isolation check

- User added a second Augmented Strings instance on a new MIDI track, exposed Morph, and changed it without rebinding.
- The new instance did not affect the Max number connected to the original synth.
- Explicit retargeting to the second instance and reverse-direction isolation remain untested.

## Explicit retargeting check

- User selected the second Augmented Strings instance and clicked bindselected.
- Max followed the second instance, and Morph changes on the original instance no longer affected its number.
- Explicit observation retargeting and old-target observer isolation passed by user report. Writes to the second instance remain separately untested.

## Retargeted write isolation

- With playback stopped and the probe bound to the second synth, user entered 0.5 in Max. Only the second synth changed; the original stayed unchanged.
- Two-instance targeting checks now cover observation, explicit switching, old-target isolation and writes to the new target. Results are specific to Augmented Strings Morph in this session.

## Automation recording check

- On the second synth with an initially empty Morph lane, user enabled Automation Arm and Arrangement Record, changed values from Max, then stopped recording.
- User confirmed playback reproduces Morph changes in both Live and Max. Automation recording/replay passed by user report for this configuration.
- Gesture/undo grouping, exact envelope fidelity, other plugins, and portable packaging remain unverified.

## Portable device copy inspection

- Located the user-saved device in the Ableton User Library; original referenced an absolute Desktop script path. Original left unchanged.
- User saved a repository-local copy and changed its JS object to js parameter-probe.js. Inspection confirms the relative object text and second-outlet diagnostic wire.
- Device still records a dependency-cache bootpath to the examples folder; JS is external, not established as embedded.
- Copied the unchanged device and script into a separate Desktop portability-check folder. Relocated host load pending; this is not yet a portable release. Local amxd remains ignored by Git.

## M0 gate and first studio slice

- User confirmed the copied device loads from the separate portability-check folder and follows the second synth. Same-machine relocation passed; original dependency-cache paths remain available, so clean-machine portability is not established.
- M0 gate passed for the narrow Live-exposed Morph path with documented manual reconnection and automation override behavior. No universal VST3 claim.
- Implemented a dependency-free local studio shell and typed v1 project subset with strict parsing, deterministic export, binding references, range validation, and rejection of unknown fields/versions.
- Added Morph metadata sample and five-control synthetic compressor sample; every preview value is explicitly simulated.
- Studio includes function selection, knob/fader preview, drag/grid/keyboard movement, numeric bounds editing, undo/redo, theme switch, import/export, and explicit browser-local saves with previous-version backup recovery.
- React/Vite/Zod installation failed with EACCES contacting npm registry. Chose browser ES modules and Node TypeScript stripping for a runnable first slice; no TypeScript compiler/typecheck, dependency lockfile or Tauri packaging claimed.
- Twelve automated tests pass for Max contracts, schema round trips/failure cases, range transforms, layout bounds and local save recovery. Browser interaction/accessibility/performance verification remains pending.
- Native inspection, persistent Live mappings, runtime schema export and full IR/migrations remain next milestones. Unsupported versions fail explicitly; no historical migration exists yet.

- Local server smoke check passed: studio, JS, stripped schema/store modules and fixture return 200; /.git/config and /package.json return 404. Server listens on 127.0.0.1:5173. Browser interactions have not yet been visually inspected.

## Interactive knobs

- User confirmed the initial browser arrangement controls work and requested knobs instead of sliders.
- Replaced range inputs with pointer-captured vertical knob dragging, incremental Shift fine adjustment, keyboard arrows/Page/Home/End, focused-wheel adjustments, double-click default reset and numeric value entry. Label dragging remains layout movement.
- Removed the fader selector. Legacy slider project entries remain readable and render as knobs; saving edited properties changes that widget to knob. Duplicate widgets sharing a parameter update together.
- Fourteen automated tests pass, including drag scaling/clamping and keyboard endpoint/fine steps. Pointer/keyboard DOM interactions still need user/browser verification.
- Next vertical slice: render an exported knob layout with Max native drawing, initially using the proven Morph binding. General parameter discovery remains separate pending work.

## Stable knob readouts

- Replaced variable-length decimal readouts with fixed decimal places chosen from the parameter span, right alignment and tabular digits. Decimal columns stay anchored as values change.
- Skip repeated writes when the formatted display is unchanged; skip redundant knob redraws when a shared-parameter callback supplies the same value. Underlying values retain full precision.
- Focusing the number field reveals its precise editable value; blur restores the compact fixed-decimal display. No animation or per-digit DOM nodes needed. Visual feel awaits user confirmation.

## Knob design library

- Inspected four user-supplied Desktop reference images. Built original CSS/SVG designs; reference images and third-party graphics were not copied into the repository.
- Added six per-widget designs: Studio, Graphite, Alloy, Selector, Halo and LED scale. Properties provides visual choices plus Mint/Amber/Cyan/Red accents. All share the same knob interaction and stable readout behavior.
- Centered fixed-decimal/tabular readouts again per user feedback.
- Optional validated design/accent fields default to Studio/Mint for old v1 projects; explicit styles persist through export/import and undo history. Unsupported style identifiers are rejected.
- Fifteen automated tests pass, including style round trips/defaults and invalid style rejection. Headless browser launch was denied by environment policy, so visual confirmation is pending in the user's browser. Max renderer style parity remains unimplemented.

## Additional dark hardware designs

- Added Classic pointer, Recessed, Gloss and Monitor designs based on the user's preferred reference directions, bringing the library to ten. Original CSS/SVG only; no reference assets bundled.
- Pointer/recessed/gloss include scale ticks and min/max markings; their default mint palette uses a warm pointer, with explicit accent overrides available. Monitor uses a matte black face, fine indicator and a dial diameter that grows with widget bounds.
- The picker scrolls to accommodate all ten choices. Existing interaction, centered readout and save behavior retained.
- All fifteen tests pass; appearance round-trip coverage now iterates every registered design. Visual browser verification remains pending.

## Chickenhead and raised black revision

- User clarified the preferred forms: a projecting chickenhead handle and a flat black cap elevated on a curved base with a fine neon indicator. Reworked Selector as Chickenhead and Monitor as Raised black.
- Removed the three disliked recent designs from the picker; retained their identifiers for existing project compatibility. The original other styles remain available. New Morph/compressor samples emphasize the two revised designs.
- Added per-widget continuous, equally spaced (2?128 positions), or custom increasing values. Custom values are restricted to the parameter range, validated and stored in exported JSON; conflicting settings fail validation.
- All input methods snap to configured stops. Pointer motion accumulates before snapping; keyboard/wheel advance discrete positions. Custom values use equal angular spacing. Settings apply to preview only and do not establish actual plugin enum semantics.
- Synthetic compressor Ratio demonstrates 4, 8, 10. No real host bindings or plugin files changed.
- Eighteen automated tests pass, including allowed-value isolation, endpoint behavior, fine-motion accumulation, step validation and serialization. Revised visuals await user confirmation.

## Reusable native Max export slice

- Added strict runtime manifest validation, deterministic source ZIP export in the studio and a no-overwrite CLI exporter. Generated local Morph source/archive in artifacts/. Python zipfile independently validated seven archive entries and CRCs.
- Added native JSUI drawing, pointer/fine/double-click controls, visible status, shared detent logic and a separate LiveAPI controller. Exact selected-plugin name and unique parameter name/range matching; synthetic manifests refuse real binding.
- All mappings validate before subscriptions, failures roll back, stale callbacks are invalidated, and UI writes coalesce over 33 ms with cancellation on disconnect. No observed values are echoed as writes.
- Twenty-seven automated tests pass, including runtime contracts, drawing smoke checks, export determinism, missing/ambiguous targets and queued-write cancellation. This is not host integration verification.
- Browser and Max renderers remain separate; native style/material parity is approximate. Native keyboard/value entry, undo semantics, panel measurements and packaged amxd verification remain pending. See runtime.md.

## Isolated static plugin inventory

- Added a read-only worker/supervisor and studio Library inventory with filtering. Reads standard VST3 folders and PE headers without loading or executing plugins; CLI supports explicit roots.
- Worker timeout/crash recovery, bounded traversal/heap and IPC validation are covered by automated tests. Symlinks are skipped; permission errors are diagnostics, not bypassed. No fingerprint or parameter metadata is fabricated.
- Initial actual-machine scan identified 69 x64 headers and one permission failure. Unreadable-header entries are now retained with unknown architecture. Local inventory stays under ignored artifacts/.
- Thirty-one tests pass. Native SDK parameter inspection, VST2, plugin sandboxed execution and vendor/class identity remain unimplemented. Read-only inventory is not presented as native inspection.

## Canvas editing slice

- Added a tested layout engine for multi-selection/group movement, bounds-aware snap/resize, six alignment modes, equal-gap distribution, duplication with fresh group IDs, grouping, locking, deletion and front/back ordering. Locked groups stay immobile as a unit.
- Wired Shift-click and marquee selection, resize handles, toolbar actions, keyboard shortcuts, zoom and middle-mouse/Space drag panning. Commands participate in existing undo/redo. Browser interaction verification remains pending; numerical/state behavior is automated.
- Added backward-compatible lock/group defaults to schema and protected local preview values from special-key IDs using null-prototype storage.
- Thirty-seven automated tests pass. Runtime ignores editor-only lock/group metadata and preserves widget order.

## Studio integration harness

- Added a simulated-DOM harness that runs the actual studio and knob modules with real schema/store/layout functions. It exercises sample loading, style/property edits, function selection, undo/redo, duplicate/group/lock/delete commands, custom ratio input, local saves, Shift-toggle selection and grouped pointer drag.
- All forty-two tests pass. This harness verifies application wiring and state transitions; it does not emulate browser layout, paint, touch capture or accessibility APIs. Real-browser visual checks remain pending.

## Presets and project migration

- Added separate function and layout preset collections, saved/applied/deleted in the UI and persisted with project export. Function presets select parameter IDs; layout presets change appearance/arrangement of currently exposed controls without enabling hidden functions. Duplicate names do not overwrite existing presets.
- Added project schema v2 and deterministic v1 migration with original IDs/layout preserved and fromVersion metadata. Existing local raw saves remain backup-protected. Future versions fail explicitly. Runtime manifest version remains independently at 1.
- Function selection now respects locked controls and finds nonoverlapping space for newly exposed controls. Insufficient panel space fails before changing the project.
- Forty-seven automated tests pass, including migration, preset separation/round trips, duplicate-name and missing-reference rejection, and studio preset workflows.

## Host-exposed registry capture slice

- Added captureselected plus explicit new-file export in the source Max controller, and Import Live capture in the studio. It reads exposed parameters only, creates no widgets automatically and never claims SDK discovery. Real host capture execution remains pending.
- Added capture validation, registry-to-project conversion and metadata provenance. Captured current values are labeled reset baselines, not factory defaults; vendor/class ID/physical units remain unknown. Plugin format is explicitly unknown because a Live PluginDevice does not prove VST3.
- Quantized enum metadata is preserved and validated 0..N-1 enums get corresponding preview detents. New parameter provenance defaults are backward-compatible within project v2.
- Fifty automated tests pass, including capture failure cases, baseline/identity honesty, enum conversion, and existing-file refusal in a simulated Max File API. File creation in Max still needs actual-host verification and has no established race-free exclusive-create guarantee.

## Exclusive capture export

- Replaced provisional Max File writing with a Node-for-Max helper that creates UTF-8 captures using the exclusive wx flag. Existing files are atomically refused, including concurrent-create cases; no user capture is overwritten. Node output is deferred to Max's low-priority queue.
- Fifty-one tests pass, including an actual temporary-filesystem exclusive-create test and controller-to-writer delegation. The new host writer still needs integration verification in licensed Max; the helper's filesystem behavior is independently tested in Node.
- Export archive now contains nine files, including both capture writer dependencies. Older seven-file local artifacts are preserved; current exports include the new files.

## Project size consistency

- Enforced the same 1 MB UTF-8 project limit on parse and serialization so a large preset library cannot be saved/exported into a project the importer rejects. Capture file output also uses a byte-aware bound.
- Fifty-two tests pass, including multibyte input size and oversized preset-library serialization rejection. Existing project state is retained when an operation exceeds the limit.

## Project settings, diagnostics and derived previews

- Added project/target version and panel/grid settings with transactional bounds validation. Export diagnostics block empty or ambiguous mappings and distinguish disconnected preview, synthetic data, unverified format, capture-time resets and pending native runtime integration.
- Added synthetic hard-knee compressor transfer and RBJ peaking-EQ previews using explicit schema graph contracts. No real-plugin semantics are inferred. Graphs are editor-only and visibly omitted from native export.
- Added EQ study sample, log-frequency/dB axes, per-frame graph updates and unavailable-state handling. Derived curves are not audio meters or proprietary telemetry.
- Sixty automated tests pass, including numeric curve invariants, pole stability, graph provenance rejection, settings/diagnostic workflows and interactive graph updates under the simulated DOM. Browser visual/performance and native host checks remain pending.
