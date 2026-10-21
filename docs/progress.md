# Progress

## 2026-10-21 hosted duplicate Threshold independence passed

- User duplicated the Studio hosting device, changed Threshold on the duplicate and confirmed the original retains its own value. This verifies independent parameter control for those two internal Pro-C 3 instances in the current session.
- Independent duplicate state across Set reopen and device-preset recall remain separate checks. Automation lanes, latency compensation and sidechain routing remain open.

## 2026-10-21 hosted Pro-C 3 Set state restored

- User explicitly confirmed saving, closing and reopening the Set restores the internal Pro-C 3 settings, including Style changed only in the native FabFilter editor. This is user evidence for more than the four exposed test knob values on this Set. No persistence code was added for this result.
- The prototype creates/reuses a parameter-enabled vst~ object and currently issues plug on initialization. Restoration ordering/mechanism is not established by this report; do not assume universal persistence or change initialization casually. Device-preset recall, duplicate-instance independence, stopped-playback state changes and clean-machine loading remain separate checks.
- Basic internal hosting, floating editor, four-control two-way formatted feedback, audible processing and this Set reopen test pass. Automation lanes, measured latency compensation and sidechains remain unimplemented/unverified.

## 2026-10-21 internal Pro-C 3 audio processing passed

- User played audio through the internal hosting proof and reported compression works with all test knobs. This establishes user-observed audible processing and control response for the stereo Pro-C 3 test path. It is not a null comparison, latency measurement or sidechain test.
- Loading/editor, floating window, four-control two-way formatted feedback and audible processing now pass. Full sound state persistence is the next implementation gate; automation, latency compensation and sidechains remain open.

## 2026-10-21 hosted four-control and floating editor checks passed

- User confirmed the floating-editor build stays usable alongside the Studio panel and all four test knobs (Threshold, Ratio, Attack and Release) respond in both directions with matching value/unit displays. This extends the earlier Attack-only evidence to the entire four-control hosting panel.
- Internal plugin loading/editor access, floating-window interaction and four-control two-way formatted feedback now pass user checks. Audible processing, sound persistence, automation lanes, latency compensation and sidechains remain separate gates.

## 2026-10-21 hosted editor floating window fix

- User reported the internal plugin window disappears behind Live when clicking Studio controls. Enabled documented vst~ floateditorwindow at host creation and immediately before opening its editor, including reused host objects. No focus polling or repeated open calls during gestures.
- Six focused hosting tests pass, including floating-mode command order before Open plugin. Built and verified a separate artifacts/pro-c3-internal-host-floating bundle; prior loaded bundle preserved. Actual window persistence while interacting with Live remains pending user confirmation.

## 2026-10-21 hosted Attack two-way control passed

- User dragged the Studio Attack knob and confirmed the internally hosted FabFilter Attack moves with matching time values in both interfaces. Combined with the previous native-editor check, Attack now has real-host evidence for two-way control and formatted time display.
- Ratio/other readouts, audible processing, persistence, automation, latency compensation and sidechain routing remain separate checks.

## 2026-10-21 hosted Attack readout passed

- User changed Attack in the internally hosted FabFilter editor and confirmed the Studio readout follows with the same time value, including ms. This verifies incoming Attack feedback and plugin-formatted time text on the real hosting path.
- Reverse control, other formatted parameters, audio, persistence, automation, latency compensation and sidechains remain separate checks.

## 2026-10-21 internal Pro-C 3 editor opened in Live

- User loaded the standalone Pro-C-3-Studio-Test device on the requested test track and confirmed Open plugin opens the internal FabFilter window. This passes the first real-host loading/editor check without an external plugin device or manual binding.
- Four-control formatted readout accuracy, bidirectional control, audible processing, state persistence, automation, latency compensation and sidechain routing are not inferred from this result.

## 2026-10-21 internal Pro-C 3 hosting proof built

- Added a separate internal vst~ controller and four-control native panel, plus an exclusive-output builder that copies the existing Max-authored shell unchanged. Pro-C 3 loads internally on initialization; Open plugin targets its own native editor. No external instance or binding, Node process, server or manual Max assembly is needed.
- Probe preserves plugin-provided formatted text for Threshold, Ratio, Attack and Release, resolves exact unique parameter names and coalesces only explicit gestures. Dry audio is retained until metadata resolves and on failure; load/scan work is bounded and cancelled on stop.
- All 144 tests pass with no skips, including six new simulated-host tests. Built artifacts/pro-c3-internal-host for the next user check. Real plugin audio/editor/value formatting remain unverified. Automation lanes, sound persistence, latency compensation, sidechains and instruments remain later gates.

## 2026-10-21 single-device hosting investigation

- Investigated the requested one-device workflow using official Max/Live/VST3 documentation and installed Max 9.0.9 vst~ reference XML. Compared companion wrappers, saved Racks, internal Max hosting and a dedicated VST3 host.
- Recommended a separate vst~ feasibility prototype: documented VST3 loading, parameter enumeration, numeric plus symbolic value output, snapshots and original-editor access match the requested inline panel. No production host change or claimed audio test.
- Corrected the earlier assumption that meaningful units always require plugin adapters: Live DeviceParameter.str_for_value can provide formatted text on the existing path; installed-version/plugin execution remains unverified. Typed physical-value conversion is a separate requirement.
- Recorded mandatory gates for full state, stable automation, dynamic latency, sidechains, instruments/MIDI and clean-machine packaging. Research and proposed ADR 006 are in docs/plugin-hosting.md and docs/adr.md.

## 2026-10-21 Pro-C 3 Threshold automation passed

- User confirmed the horizontal wrapper follows a Threshold automation passage during playback without touching its knob. This verifies observation of that automated parameter; it does not establish every Pro-C 3 parameter or automation recording from the wrapper.
- Core Pro-C 3 host checks now cover horizontal layout, two-way manual control, automatic Set reopen connection with immediate predecessor placement, and Threshold automation following.

## 2026-10-21 Pro-C 3 automatic reconnect passed

- Startup console included an older performance rack and a Pro-C 3 predecessor-type binding error. After placing the horizontal wrapper immediately after Pro-C 3, the user confirmed the save/reopen automatic connection check works.
- Pro-C 3 now has user-confirmed horizontal presentation, two-way control and automatic reconnection with immediate predecessor placement. Earlier manual-binding failure remains documented below; no runtime code change was needed. Pro-C 3 automation is still a separate unverified check.

## 2026-10-21 Pro-C 3 reopen failure

- User reports the horizontal Pro-C 3 wrapper requires manual binding after reopening the Set. Horizontal layout and two-way control pass; automatic reconnection does not pass for this plugin/session.
- Generated manifest has autoBindPrevious enabled. Current startup logic attempts the immediate predecessor with bounded retries over 8.25 seconds. The exact console error and device placement are needed to distinguish restoration timing, chain placement, metadata matching and runtime file loading. No speculative routing change made.

## 2026-10-21 horizontal generated devices

- User confirmed all 11 exposed Pro-C 3 controls work in both directions in Live. This adds a second plugin product to the captured-registry evidence. Automation and reopen are not inferred.
- Fixed automatic Live/native selection layouts to generate a horizontal row instead of stacked rows. Canvas width now supports 8192 pixels for up to 60 controls. Existing authored layouts retain their arrangement.
- Native renderer sizes its drawing area and sends live.thisdevice setwidth on each manifest load. Labels retain an effective 11 pixel size. The Max-authored shell remains byte-for-byte unchanged.
- All 138 tests pass, including 11-control width/hit-testing, repeat initialization and layout-size parity; HTTP smoke passes. Corrected Pro-C 3 bundle built under artifacts/pro-c3-horizontal. User subsequently confirmed the corrected horizontal wrapper works in Live and control still works in both directions. Pro-C 3 automation and Set reopen remain separate checks.

## 2026-10-21 captured Color wrapper reopen

- User saved and reopened the Live Set with the extracted Color wrapper folder unchanged, then confirmed Color control worked without bindselected. Automatic predecessor reconnection now passes for this session-discovered, captured-registry control in addition to the earlier measured Morph/Motion projects.
- Current verified path: actual session discovery, Configure/refresh of Color, browser selection, automatic layout/generation, two-way control and Set reopen. Evidence remains limited to Augmented Strings; a different plugin product is the next compatibility check. Color automation and broader lifecycle cases are not inferred from this result.

## 2026-10-21 generic Color wrapper host result

- User confirmed the session picker showed each actual Strings instance and its exposed controls. After adding Color through Live Configure, Refresh session discovered Color. The user selected only Color, generated/extracted a new wrapper and placed it immediately after the intended synth.
- User confirmed both directions: the generated Color knob controls the synth, and direct changes in the synth reach the wrapper. This verifies the actual session-to-selection-to-layout-to-generation path for a control outside the hardcoded native Morph/Motion adapter. It does not establish all plugins or all controls.
- Saving/reopening this new captured-registry wrapper and its automation behavior remain to be checked independently. Automatic exposure without Configure remains unimplemented.

## 2026-10-21 session bridge first host result

- User loaded the read-only bridge in Live and reported Live session ready: 2 plugins. This confirms the new Max controller initialized, traversed the current session and received a successful HTTP catalog acknowledgement from the local server. Browser instance selection, metadata accuracy and generating a wrapper from that actual catalog remain to be checked.

## 2026-10-21 core Live session discovery

- Returned focus to the core choose/select/generate workflow; macro automation is deferred. Implemented a separate read-only session bridge, strict catalog protocol, ephemeral authenticated loopback endpoints and a Live session instance picker in the builder. No Node for Max, metadata files or parameter writes are involved in the bridge.
- The helper traverses tracks, returns, main and nested rack chains in bounded scheduled tasks, then transfers actual exposed names/ranges/current values/quantization/enums. Refresh generations, stale callbacks, deletion, transfer/scan limits, network deadlines and server restart token renewal are handled. Omissions remain visible.
- Choosing an instance and checking controls creates an automatic layout and ordinary generated wrapper through the generic Live runtime, with captured-current reset provenance. No hardcoded Morph/Motion adapter is needed for this path, and no SDK identities, transient Live IDs or track labels enter the project. Unexposed controls still need Configure; automatic exposure is not implemented.
- All 135 tests pass, with 33-asset and endpoint guard smoke checks. Tests cover generic synth/effect metadata, rack nesting, refresh/deletion, no bridge writes, generic generated binding to a 0-100 Mix control, capability/body limits, native task scheduling, budget omissions, server restart and browser choose/check/helper-download handlers. Actual Max HTTP transport and Live session scanning remain unverified. A new ignored bridge bundle is prepared without changing any existing wrapper or Set.

## 2026-10-21 two-instance macro host check

- User successfully bound Strings A and Strings B using delayed selection in Live. Energy moved Morph throughout its travel on the first Augmented Strings instance; Motion on the second stayed at zero until roughly 0.4 and then rose toward maximum, matching the declared staged curve.
- This establishes initial multi-instance control and staging for two instances of the same plugin. It does not establish compatibility between different plugin products, native undo, sustained timing, disconnect/reopen or performance-runtime automation behavior. Those host checks remain pending.

## 2026-10-21 delayed performance binding

- The next host error identified the selected object as MaxDevice Wrapper. The separate-editor selection sequence still returned selection to the wrapper. Changed bindselected to arm a five-second task: click it first, select the intended synth in Live, then leave that synth selected until binding finishes.
- Target selection is read at timer completion, never at the wrapper click. Repeated clicks, disconnect, manifest reload and direct slot binding cancel stale timers. Added simulated regression cases for wrapper-to-synth selection changes and timer cancellation. All 115 tests pass and the updated ZIP was checked against the current controller and unchanged shell. Host success remains pending.

## 2026-10-21 performance binding correction

- User reported the first host binding attempt rejecting Strings A before parameter matching. Found the new controller compared plugin names case-sensitively, unlike the regular wrapper. Corrected plugin/parameter name matching to ignore capitalization and surrounding whitespace. Wrong-device errors now identify the actual selected device type/name.
- Corrected cross-track test instructions: keep the separate Max editor open while selecting the synth in Live; returning to the wrapper in Live can change the selected device. Updated the generated test bundle in place without changing its Max shell. Successful host binding remains pending.

## 2026-10-21 performance macro prototype

- Implemented a separate versioned rack contract and shared ES5 curve engine, browser performance workbench and multi-target Max controller. Energy controls Morph on one Strings instance and stages Motion on a second. These are exposed-parameter routes, not SDK ID guesses.
- Routes support independent host ranges, inversion, clamped input intervals, exponent curves, explicit detents, enable switches and nominal 33 ms coalescing/smoothing. Competing or aliased destinations are refused. Binding performs no initial writes and stores no persistent host IDs. Distinct slots cannot bind the same instance.
- Added checked-control handoff from the normal builder, eligible project import, response previews, local save/backup, rack import/export and an eight-file experimental device bundle. Generated binaries stay ignored. XY/scenes and functional canvas cables remain unimplemented.
- All 111 tests pass, including mocked multi-plugin control, target lifecycle, no initial writes, automation takeover timing, mixed-state ramp interruption and browser workflow/packaging handlers. Actual Live behavior, browser visuals, clean-machine dependencies and sustained performance remain unverified for this separate runtime.

## 2026-10-21 canvas and performance direction

- Added absolute grid snapping, nearby alignment guides and collision-aware placement, resizing and duplication. Direct geometry edits and layout preset application reject new overlap unless explicitly enabled. Older projects remain readable.
- Removed the redundant VALUE caption while retaining numerical readouts. Added optional seams, visual cables, sockets and bend editing. Project saves and layout presets preserve them; the exported native renderer draws them without parameter writes.
- Defined the next functional routing slice: one macro controlling explicitly bound instances of several plugins, with per-route ranges, curves and staged activation. Broader XY surfaces, scenes, gesture paths and conflict/feedback behavior are documented in performance-routing.md. This routing is not implemented; today's cables remain decorative.
- All 89 automated tests pass, including placement guards, cable validation/deletion, layout preset remapping, browser handlers and matching native cable geometry. HTTP smoke checks pass for 23 assets and request guards. Browser appearance and native decoration still need visual review in their actual environments.

## 2026-10-21 native discovery

- Found installed Visual Studio Build Tools 2026/MSVC 19.51 and CMake through vswhere outside PATH. Fetched the official MIT-licensed VST3 interface subset via the read-only GitHub connector after direct git network failure; vendored the required notice and recorded upstream file blob SHAs.
- Built a disposable Windows x64 controller inspector with real SHA-256 fingerprints, component choice, native IDs/defaults/units/steps/flags/enums and strict result validation. Native execution uses job memory/CPU/process limits plus supervised deadlines/output limits. This is process isolation, not a restricted-token security sandbox. No DSP processing, editor request, preset writing or plugin binary modification is implemented.
- Actual Augmented Strings SDK/HTTP discovery returned 2,748 parameters, 580 editable with valid metadata. Preserved 2,080 invalid -1 defaults as diagnostics. SDK IDs are Morph=1 and Motion=4, with defaults 0.5 and 0. Their class ID agrees with Live's log.
- Studio automatically inventories installed plugins; choosing one reads controls. Searchable checkboxes create the layout, with optional editing afterward. A fingerprint-bound adapter maps only the two independently user-tested Live controls. Other native controls are labeled Preview only and block generation until routing is verified. Native inspection does not mean arbitrary native parameters are Live-exposed.
- Generated a Morph/Motion project and device bundle from the real inspected registry under ignored artifacts. No manual list entry was used. Browser visuals and the newly discovered-ID bundle still need user review; previous generated wrappers remain preserved.
- Eighty-three tests pass on this machine, including compiled original SDK-ABI metadata/class-choice/crash/hang fixtures and recovery, payload/provenance checks and simulated installed-plugin choose/search/check flows. Fixtures have no audio DSP and do not substitute for a complete redistributable audio plugin. Actual HTTP guards rejected arbitrary paths, unknown IDs, cross-origin and write requests.

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

## Review handoff

- Final HTTP smoke check passed for 21 assets, private-path guards, cross-origin rejection and unsupported write methods. Inventory returned 69 accessible entries and one permission diagnostic without plugin execution.
- Generated the current nine-file review source folder and ZIP under ignored artifacts/review-runtime. Independently checked ZIP CRCs with Python. Existing devices, presets and earlier exports were preserved.
- Added compatibility, troubleshooting, extension, dependency/license and test-evidence notes. Status distinguishes the original user-tested probe from new simulated-host prototypes.
- Remaining boundaries are in testing.md and roadmap.md. No GitHub push, external messages, SDK distribution, plugin binary loading or host-session changes were performed during unattended work.

## Flat vector knob revision

- Inspected four additional Desktop product photos supplied by the user. Corrected the chickenhead silhouette to a rounded beak, narrow waist and broad rear grip over a mounting disk.
- Replaced accumulated gradient/bevel overrides with shared, resolution-independent SVG artwork for all browser knob styles and a dedicated knobs.css. Removed simulated chrome, radial highlights, glow clouds and deep shadows. Raised black now uses a flat charcoal cap, shallow rim and fine index.
- Canvas controls and gallery thumbnails use exactly the same geometry and center of rotation. Controls resize proportionally; fixed-decimal readouts and detent/keyboard/pointer behavior are retained. Reference photos remain outside the repository.
- All sixty existing automated tests pass after the artwork/DOM refactor. Browser material appearance still needs user review; automated state tests do not judge aesthetics. Native Max styling remains approximate and has not been redesigned in this browser-only pass.

## Exported renderer host checks

- User confirmed automatic reconnection and automation playback after reopening the Set once the actually referenced bundle was updated. No Bind click was required. This passes the reopen flow for the current Augmented Strings Morph/Motion configuration; it does not isolate whether bounded retries were necessary. Distinct generated device identity/reference handling remains a packaging concern to investigate before broader use.

- Retry retest still required binding. Read-only inspection of the actual reopened test2.als showed its wrapper path references artifacts/generated-morph-motion/Wrapper.amxd, the earlier manual bundle, rather than auto-ready. Its manifest lacked the automatic policy. Updated that referenced bundle's manifest/project and runtime files in place, preserving the old manifest backup; also refreshed scripts at the shell's cached dependency location. Live Set and AMXD bytes were not edited. Why the saved reference remained on the earlier bundle is unresolved; this evidence does not establish a startup timing failure. Correct-path reopen retest pending.

- Reopen test required manual binding; automatic reconnect did not pass. Startup previously tried once. Added six bounded retries over 8.25 seconds after initial failure, with no initial writes and cancellation on disconnect, manual binding or manifest replacement. Timing is a hypothesis, not an established root cause. Updated the active local auto-ready controller without changing its saved device. Seventy-one tests pass, including delayed-restoration recovery, finite retry exhaustion and stale-task cancellation; host reopen retest pending.

- User confirmed the automatically connecting generated wrapper follows Morph and Motion and their automation after direct loading immediately after Augmented Strings, without Bind or Max editing. This verifies initial automatic connection for this two-parameter configuration; automatic connection after reopening, arbitrary plugin discovery and clean-machine distribution remain unverified.

- User confirmed the first generated Wrapper.amxd loads and controls the plugin after explicit binding, without patch editing or positioning. Added automatic connection for generated bundles: after manifest initialization, locate this_device in its parent's device list and bind only its immediate predecessor using the same strict mapping checks. Missing/wrong predecessor fails without scanning or using the selected device. Explicit disconnect stays disconnected until another initialization or manual bind. Automatic host behavior remains unverified.
- Sixty-nine tests pass. New simulated-host cases verify selection-independent predecessor binding, no initialization writes, second-instance isolation and refusal of intervening effects, missing predecessors and wrong metadata. Source exports retain their explicit reconnect default; generated device projects persist previous-on-load reconnect policy.

- Product target clarified: choose plugin, check controls, generate a usable wrapper with automatic layout; customization is optional. Implemented template-backed device generation in browser and CLI. It copies the locally authored, Max-saved shell unchanged and bundles only selected-control metadata plus runtime dependencies. No manual patch assembly is required by this new path; generated-bundle host loading awaits verification. Public shell distribution, parameter discovery and automatic target connection remain pending.
- Sixty-seven automated tests pass, including studio Generate-handler success/failure, shell validation, selected-only registry generation and binary-safe ZIP tests. Independently verified seven-entry ZIP CRCs and unchanged shell bytes. Repeated CLI build refused the existing directory. Local template and generated binaries stay ignored by Git.

- User confirmed both Morph/Motion knobs and numeric readouts are fully visible inside Live after presentation placement. Two-control control/observation isolation, simultaneous automation and in-panel visibility now pass for this specific Augmented Strings configuration. Capture saving remains suspended; broader plugin compatibility and clean-machine packaging are unverified.

- User confirmed independent reverse observation for Morph and Motion and simultaneous playback of separate automation curves in both Max knobs. Two-control panel visibility in Live remains to be checked.

- User loaded the two-knob Morph/Motion export into Morph Motion Test.amxd and confirmed each Max knob changes only its intended synth parameter. Reverse observation and simultaneous automation for this layout remain to be checked.

- Capture console readout confirmed Motion range 0..1, current 0, quantized false. Added a two-control Morph/Motion project and generated a compact export without Node for Max. Motion's reset baseline is the captured current value, not a claimed factory default. Two-control host binding and isolation await user verification.

- User confirmed two-way Morph control directly in Live's compact device panel with the Max editor closed. This verifies interaction after scaling and presentation repositioning for the single-knob layout.

- User confirmed compact controls appear inside Live after moving the pasted presentation objects back to the top-left. Inspecting the saved device showed Max paste had shifted presentation Y positions below 169 pixels (JSUI Y=212); group repositioning resolved visibility. Copy/paste setup must account for presentation offsets and duplicate source-window names. Corrected in-panel interaction remains to be confirmed.

- User screenshot confirmed the previous presentation exceeded Live's fixed 169-pixel device height. Export now places binding controls above a 139-pixel JSUI, hides capture diagnostics from presentation, and fits occupied control bounds rather than empty editor canvas margins. Hit testing uses the same transform as drawing. Actual corrected in-Live appearance awaits review.

- Read-only Windows event inspection located both crashes in node.script.mxe64 9.0.9.0, access violation 0xc0000005 at offset 0x44d4. Live remained open. Added an export regression check excluding Node writer/save controls while retaining capture reads and binding. No crash was retriggered during investigation.

- Capture read reported two exposed parameters in Live. Saving produced no acknowledgement or Desktop JSON file. User reported Max crashing on script running; two Max crash dumps from this session exist. Root cause is unresolved. Removed Node writer and save controls from new generated patches pending investigation; existing .amxd devices are unchanged.

- User tested a fresh nine-file Morph export in Live with Augmented Strings, copied into a new stock Max Audio Effect and saved as Morph Knob Test.amxd.
- User confirmed two-way Morph control, automation playback in the exported knob, and automation following after saving/reopening the Set and explicitly rebinding.
- These reports cover one plugin and parameter. Disconnect, target deletion, capture export, panel sizing and native/browser visual parity remain unverified for this runtime. Earlier probe results do not substitute for these checks.
- Follow-up user checks passed: disconnect stops observation and control, explicit rebinding restores control, deleting the synth produces readable disconnected/target-unavailable messages, and undoing deletion plus rebinding restores Morph control. A frozen disconnected knob is expected because its displayed value comes from host observations.
