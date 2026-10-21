# Performance routing

Status: first macro slice implemented as an experimental workbench and separate Max controller; actual Live verification pending. The regular wrapper still binds one plugin and its canvas cables remain visual decoration. XY, scenes, modulation and functional canvas sockets below remain proposals.

The product should help shape a sound or transition across devices, rather than only reproduce a plugin's interface. Choosing and generating a normal wrapper remains the starting workflow. Advanced connections are optional.

## First functional slice

Open `/apps/studio/performance.html` from the studio's Performance rack link. The Strings example maps Energy to Morph on Strings A and Motion on Strings B. The two slots require separate plugin instances, even when their names match. Slot labels are editable. Routes support reversed physical output ranges, clamped input intervals, exponent curves, explicit stops, enable switches and smoothing. Response plots and destination readouts are disconnected browser simulations, with no smoothing timing simulation. Project and rack files use separate contracts; rackVersion 1 never stores transient host IDs.

From the regular builder, Add to performance rack transfers eligible checked controls into a target slot without manually assembling JSON. Eligibility requires Live-captured or user-reported evidence and known quantization. Unknown or native-only controls are excluded with a count in the handoff message; they are not guessed into mappings. Add from wrapper project supports another exported project's controls. Save locally keeps the previous rack as a backup; Export JSON is the portable editable copy. The browser currently has one local rack save slot.

Generate test device bundles the local Max-saved shell unchanged, a separate performance controller, the shared routing contract and existing renderer. The CLI equivalent is `node scripts/build-performance.mjs fixtures/performance.rack.json artifacts/NEW_FOLDER`. Existing output directories are refused. Extract together and load Wrapper.amxd. Click bindselected first, then select the intended synth title bar in Live within five seconds. Leave it selected until binding completes; follow the status prompt for the next slot and repeat the same order. This delay avoids the wrapper stealing selection when clicked. Each click arms one previously unbound slot; repeated clicks, disconnect, reload and direct binding cancel obsolete selection timers. Names ignore capitalization and surrounding whitespace; ranges and quantization still must match. A wrong-device error reports the actual selected type and name. Selecting an already assigned instance, ambiguous exposed parameters or wrong name/range/quantization fails without initial writes. Explicit `bindtarget SLOT_ID` exists for developer recovery. Reopening requires all slots to be explicitly rebound. No automatic target restoration is claimed for this controller.

Writes are coalesced on nominal 33 ms tasks. Stepped destinations skip smoothing and write only explicit stops. Continuous smoothing starts at the currently observed host value. A deliberate gesture may take over automation on its first scheduled tick; after writes begin, a differing destination observation cancels that macro's remaining ramps and marks it mixed. Other macros retain their positions. Observations never generate parameter writes. A removed/changed/disabled target fails preflight before the tick's writes and cancels queued work. Host failure during sequential writes can still leave a partially applied tick; there is no transaction or automatic rollback across plugins.

The contract caps 16 target slots, 16 macros, 64 parameters per slot and 128 routes. Competing active destinations, including aliased parameter definitions, are refused. These bounds are validation limits, not measured real-time performance guarantees. Current rendering uses the existing fixed-size device shell; large macro layouts still need host usability testing. Macro host automation lanes, saved target identity, grouped native undo and long-session timing are not implemented or verified.

One macro, explicitly bound to two plugin instances, controls several selected parameters. Each destination has a lower and upper bound, inversion, a response curve, an active input interval, optional detents, and smoothing. Show the resulting response while editing a route. For example, an Energy macro opens a synth filter throughout its travel, introduces drive halfway through, and adds reverb only near the end. These are user-chosen mappings, not inferred parameter semantics.

Routes reference stable project target slots, resolved to specific Live device instances. Plugin names alone cannot identify two copies of the same plugin. Replacing or deleting a target disconnects its routes and shows which destinations are unavailable. Loading or reconnecting observes current values first; it must not push the saved macro position into the session.

## Interaction sources

- Macro: one gesture with independent destination ranges and curves.
- XY surface: many destinations, each using X, Y, or a two-dimensional response surface. It can move through timbre regions rather than merely assign one parameter per axis.
- Scene morph: capture explicit destination values in named scenes and interpolate between them. Discrete parameters need a declared switching threshold; they cannot interpolate continuously.
- Gesture path: record a hand-drawn macro or XY movement, then replay or edit its timing. Transport synchronization and deterministic seek behavior must precede host use.
- Modulation sources: envelopes, followers, and synchronized patterns can later feed the same routing model. Signal analysis requires real input telemetry; decorative activity is insufficient.

## Composition and feedback

Start with one driving source per destination. Reject competing routes rather than silently choosing the last writer. Later mixing needs explicit add, multiply, or replace rules, clamping, and a visible result. Reject cycles until a deliberate feedback model exists.

A macro is not generally invertible: several destinations with different curves cannot reliably reconstruct one source position. Direct plugin edits mark the macro as diverged or mixed, retain its last position, and show actual destination observations. They never force other destinations to match. A deliberate macro gesture takes control again; the UI must make that takeover clear.

Live automation retains its normal override behavior. Observations never produce writes. Rate-limit writes per destination, coalesce intermediate gestures, preserve final values, and bound smoothing latency. Disconnect, undo, deletion, disabled routes, and transport changes need explicit tests. Undo should describe one user gesture rather than every intermediate parameter update.

## Presentation

Functional sockets and cables must look distinct from decoration. Selecting a cable opens its destination, range, curve, and takeover settings. A collapsed performance view exposes only the chosen macros, surfaces, and scenes; detailed plugin controls remain available when needed. Grouping, snapping, and saved layouts apply to both views.

## Acceptance gate

Verify two instances, independent automation, direct destination edits, deletion and replacement, reconnection after Set reload, undo, quantized targets, bounded write rates, and no initial writes. Browser simulation is useful but does not establish Live correctness. Do not advertise cross-plugin performance routing until these host checks pass.
