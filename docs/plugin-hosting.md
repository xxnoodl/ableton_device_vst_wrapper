# Single-device hosting investigation

Checked 2026-10-21 against official documentation and installed Max 9.0.9 reference XML. This is a feasibility decision, not a successful hosted-audio test. The working Live-hosted wrappers remain unchanged.

The product requirement is one reusable device: choose a plugin, choose controls, generate a usable panel, optionally edit, and save for reuse. Routine use must not require manual target binding, separate plugin/wrapper imports or Max patch editing. Correct plugin-defined value text, state, automation and access to the original editor are part of the requirement.

## Options

| Route | What the producer loads | Main advantage | Limit or unresolved work |
|---|---|---|---|
| Existing companion wrapper | Plugin plus Max device | Already verified on Augmented Strings and Pro-C 3; Live owns DSP, routing and plugin state | Two devices; Live exposure/Configure; predecessor placement. Cannot replace the plugin panel through the documented API examined here. |
| Saved Live Rack | One Rack preset containing plugin and wrapper | Reusable package; Live continues to host the original plugin | Still two internal devices. The custom Max panel is an inner device, not a replacement Rack front panel. Saving a Rack does not by itself automate initial assembly or generation. |
| VST3 inside a Max device using vst~ | One Max instrument or audio effect | Custom controls in Live's Device View; internal plugin reference removes external target binding; original editor can be opened by a button | New audio host path. State, exposed automation, latency, sidechains and compatibility must be established in Live. Recommended next feasibility prototype. |
| Dedicated VST3 host plugin | One host VST3 containing the chosen plugin | Direct SDK access and control over plugin state, buses, display conversion and editor | Full host development. A VST3 alone does not supply a custom inline Max panel in Live's Device View; its custom editor is a plugin window. Existing metadata inspector is not an audio host. |

The Rack is a fallback/reuse path. The internally hosted Max device best matches the requested inline interface, subject to the gates below. A dedicated host is a later alternative if Max hosting fails important requirements; it is not automatically a better inline-interface solution.

## What is documented

The [vst~ reference](https://docs.cycling74.com/reference/vst~/) documents VST3 hosting, plug_vst3 loading, params enumeration, indexed normalized control, parameter-change output, open/wclose for the original editor, snapshots, parameter mode and transport synchronization. Its valuemode 2 reports a normalized number together with plugin-provided symbolic text. The installed reference XML contains these features, including get -10 for reported plugin latency. Documentation establishes API availability, not compatibility with our plugins or successful Set restoration.

This means the generated panel can address an internal host object directly rather than search Live for another PluginDevice. Configure should not be required for parameters that vst~ itself exposes. Parameters hidden from the plugin's public interface, vendor-specific browsers and undocumented telemetry remain separate limitations. The internal hosted instance is new: existing Live plugin state and automation cannot be assumed to migrate into it.

The [Rack manual](https://www.ableton.com/en/live-manual/12/instrument-drum-and-effect-racks/) describes a Rack as a reusable device containing other devices, with show/hide views and preset saving. It does not establish a public file-generation API for assembling arbitrary Rack presets or replacing the Rack front panel with our canvas. Do not fabricate an .adg writer as a shortcut.

The documented [PluginDevice API](https://docs.cycling74.com/apiref/lom/plugindevice/) includes editor-open state and preset properties. It provides a route to an Open plugin button even on the companion wrapper, subject to the installed Live version and a host check. The examined PluginDevice/Device APIs do not expose replacement of a plugin's inline panel or reassignment of Live's title-bar editor control. The hosted design should provide its own Open plugin button; exact reuse of Live's native plugin wrench icon is not promised.

## Values and units

Normalized position and displayed value are different data. Keep the control position numeric; display text from the actual host/plugin. Do not append ms or dB to a guessed linear conversion of 0-1. Attack, release and ratio may use nonlinear mappings, special endpoints and mode-dependent text.

- Existing Live-hosted route: [DeviceParameter.str_for_value(value)](https://docs.cycling74.com/apiref/lom/deviceparameter/) returns the formatted representation, and __str__ returns the current representation. Test these on installed Live first. Current rolling docs also include display_value; its availability and suitability must be probed rather than assumed for Live 12.3.2. A display string is not a complete inverse mapping for typed input.
- Max-hosted route: use vst~ valuemode 2 for the normalized value and symbolic representation. Verify whether each plugin includes units in the text; do not assume a bare number identifies its unit. vst~'s documented setters use normalized numbers, so typed physical-value entry still needs a supported conversion or verified mapping.
- Dedicated SDK route: [IEditController](https://steinbergmedia.github.io/vst3_doc/vstinterfaces/classSteinberg_1_1Vst_1_1IEditController.html) provides parameter units, stepCount, string conversion, string-to-value conversion and normalized/plain conversion. Our native inspector already reads units, default text and plain endpoints. Endpoints alone cannot reconstruct an arbitrary nonlinear curve. A separate inspection instance is not the current audio instance and cannot be used as unquestioned context-dependent formatting authority.

Preserve enum labels, switches, read-only state, special text and control steps as metadata. A renderer must accept host text independently of its numeric position. Layout presets, function selections, plugin sound state and parameter identity are distinct records. Do not treat selected knob values as a complete sound preset.

## Proposed product shape

One installed host device per device kind: audio effect and instrument. The producer chooses an installed VST3 and selects controls in its setup view; the panel appears automatically and remains editable. Instance setup stores the plugin identity, stable control assignments and layout; the hosted plugin's own state is saved separately with the device/Set. Saved presets reopen both the panel and sound. A local saved layout can be reused for that plugin without generating/importing a new wrapper each time.

This is a proposed design, not implemented behavior. A preset may restore a different sound while keeping the same layout. Switching plugin products must not silently reuse automation assignments. Detect missing/version-changed plugins and show a recovery choice rather than silently substitute another product. Keep the current tested companion mode available while investigating.

## Gates before choosing internal hosting for production

1. **Load and editor:** in an isolated Max Audio Effect, explicitly load a fresh Pro-C 3 through vst~; enumerate parameters; open/close its original editor; verify independent instances. No existing Set or plugin is replaced. Start with an effect, then test Augmented Strings in a Max Instrument with MIDI.
2. **Display and control:** read Threshold, Ratio, Attack and Release with valuemode 2; compare directly with the original editor at multiple settings, including special modes. Test direct edits in both directions without an echo loop. Verify writable versus read-only parameters. Record actual parameter identifiers/indexes; do not assume native SDK IDs equal vst~ indexes.
3. **State:** save/reopen both a Set and a device preset with a non-default sound, layout and native-editor changes. Duplicate instances and verify their states stay independent. Test a state change made while playback is stopped. A snapshot message alone is not proof of reliable persistence.
4. **Automation:** expose stable Max for Live parameters for selected controls; record/play/reopen automation. The existing JSUI controller writes to a separate Live plugin's parameters; those native lanes do not exist for an internally hosted plugin. Parameter registration, gestures, undo and mapping changes need a new contract. Reordering the visual layout must not repoint existing lanes. Test native-editor edits and presets without feedback storms or excessive undo growth.
5. **Audio and timing:** compare level/timing against direct Live hosting, including offline export, bypass, sample-rate and buffer changes. Test tempo sync and instrument MIDI/MPE. Measure additional overhead rather than assume parity.
6. **Latency:** compare compensated parallel paths at several Pro-C 3 lookahead/quality settings and after changes. vst~ reports latency with get -10; Max for Live supports a device's defined latency. Neither fact proves dynamic latency is forwarded correctly. Establish the supported update mechanism and measure the result before calling compressor hosting complete. See [Max device latency](https://docs.cycling74.com/userguide/m4l/live_audiodevices/) and [VST3 latency changes](https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Processing.html).
7. **Routing:** explicitly prove Pro-C 3 external sidechain input and instruments with extra outputs. Modern [MC Max for Live I/O](https://docs.cycling74.com/userguide/mc/mc_maxforlive_interface/) supports multichannel routing up to 64 channels, despite the older stereo-only audio-effect guide. This does not prove correct VST3 bus activation, Live sidechain selection, channel ordering or parity with Live's native plugin routing.
8. **Distribution and coverage:** approved Max-authored device shell, dependency collection, missing-plugin behavior, installed-license behavior and clean-machine reopen. The user's installed plugins remain external dependencies. Test several vendors and versions; no universal compatibility claim from one working compressor.

Measured spectrum/levels may come from accessible audio, but a generic hosting API does not guarantee internal gain reduction, reverb geometry, EQ topology or a complete vendor preset browser. Obtain supported telemetry/semantics or label derived previews explicitly. A plugin's own editor remains available for features outside the generated panel.

## Decision

Proceed next with a small, separate vst~ hosting proof covering the first two gates, then state and automation. Do not refactor the stable runtime around hosting until these pass. Keep latency and routing as mandatory adoption gates, not polish for later. The investigation does not require another round of manual-binding tests on the current Pro-C 3 wrapper.

## First prototype

`max/hosting/controller.js` and `renderer.js` implement a separate four-control Pro-C 3 proof. Build with `node scripts/build-hosting-probe.mjs NEW_OUTPUT_DIRECTORY [PRO_C_3_VST3_PATH]`. The builder verifies the locally Max-authored shell and copies it unchanged; it refuses existing output directories. It adds the two hosting scripts, strict local settings and instructions. No plugin binary is copied.

On initialization the controller creates/reuses a local vst~ host, metadata forwarding objects and stereo dry/wet selectors through documented legacy JS Patcher methods. It removes the copied shell's direct pass-through only after the new graph is prepared. The dry path remains selected during loading or failure. A positive parameter count followed by a complete name stream establishes unique Threshold/Ratio/Attack/Release indexes before the hosted audio path becomes active. Missing/duplicate names and bounded load/scan timeouts fail visibly. Only explicit gestures write normalized values, coalesced at 33 ms; native feedback and queries never echo writes. Readouts preserve vst~ symbolic text; missing text is explicitly marked Unformatted.

The original editor opens from a panel button. Repeated Retry while ready does not reload the current sound. No external Live plugin, binding, server, Node for Max or manual patch copying is used by this path. No production state migration is attempted. The initial prototype deliberately does not guarantee sound persistence on reopen and does not provide automation lanes, latency forwarding, sidechain or instrument support. It queries reported latency for diagnosis only. These are pending gates, not passed features.

Six new simulated-host tests cover reordered name mapping, numeric/formatted feedback, initial-write prevention, explicit/coalesced writes, original-editor commands, dry/wet graph exclusivity, metadata failures/timeouts, cancellation, setup reuse and panel gestures. All 144 repository tests pass locally with no skips. These tests do not execute vst~ or prove sound/editor/units in Max. First real-host check: load `artifacts/pro-c3-internal-host/Pro-C-3-Studio-Test.amxd` on a separate audio track and verify that Open plugin opens an internal FabFilter instance with no standalone Pro-C 3 device in that chain. Then compare the four displayed values and audio before moving to persistence/automation work.

First host result: user confirmed the standalone test device and Open plugin operation work in Live. Loading/editor access passes; this does not establish formatted-value accuracy, control, audio, persistence, automation, latency or sidechain behavior.

Hosted-editor focus follow-up: user reported the plugin window disappears behind Live while editing Studio controls. The floating-window build enables vst~ floateditorwindow at creation and before every explicit Open plugin command. Focused simulated tests pass; actual floating behavior in Live is pending. The corrected bundle is artifacts/pro-c3-internal-host-floating.

Floating build host result: user confirmed window behavior works and all four controls respond bidirectionally with matching value/unit displays. The prior pending focus check and four-control formatting/control checks now pass for this Pro-C 3 instance. Remaining audio/state/automation/latency/routing gates remain open.

Audio host result: user reported compression responds to all four knobs during audio playback through the internal device. Basic stereo processing is user-verified. State persistence is the next implementation gate; latency, audio equivalence, automation and sidechain routing remain unverified.

Set recall follow-up: user explicitly confirmed settings survive save/close/reopen, including Style changed only in the internal FabFilter editor. Record this Set test as passed without claiming all plugin state fields. No persistence code was introduced. The ordering of parameter-enabled vst~ state restoration versus the initialization plug command remains to be established; device-preset recall and duplicate independence remain open.
