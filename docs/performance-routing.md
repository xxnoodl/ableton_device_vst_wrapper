# Performance routing

Status: design direction, not implemented. Today's cables are visual decoration and never write parameters. Today's generated runtime binds one plugin. Cross-plugin routing needs a separate runtime and explicit instance bindings.

The product should help shape a sound or transition across devices, rather than only reproduce a plugin's interface. Choosing and generating a normal wrapper remains the starting workflow. Advanced connections are optional.

## First functional slice

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
