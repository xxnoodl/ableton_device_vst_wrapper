# Reusable Max runtime prototype

The studio's Export Max source button downloads a deterministic ZIP containing a runtime manifest, studio project, native JSUI drawing source, controller, shared validator, patch source and README. No .amxd is fabricated. The CLI equivalent is:

```
node scripts/export-project.mjs fixtures/morph.project.json artifacts/morph-runtime
```

The leaf output directory must not exist; files are created exclusively and partial output is rolled back on failure. The generated source can be reproduced from tracked files. The current review export is under artifacts/review-runtime and artifacts/review-runtime.zip (ignored artifacts). Earlier exports are preserved.

## Boundaries

This runtime has automated simulated-host coverage, not real Live verification. Only the earlier one-parameter probe was host-tested by the user. Keep all dependencies together and use licensed Max/Live to save a real device. The archive README describes copying the source into a stock Max Audio Effect. Device panel size is taken from the design, scaled to available JSUI bounds, and is not a measured Live limit.

Select the exact intended plugin device before binding. Binding uses the plugin's displayed name and a unique match on parameter display name and raw host min/max. Renamed devices, repeated parameter names or mismatched ranges fail; the runtime does not infer IDs. Dynamic IDs stay in memory. All mappings validate before observers are installed, and installation errors detach any partial subscriptions. Synthetic layouts are demo-only and cannot bind.

Observer callbacks update displayed host values without writing them back. User detents affect control writes only; a real automation value between detents remains visible. UI writes coalesce over 33 ms (at most about 30 flushes/s), validate enabled state and current metadata, then write raw values. A disconnect cancels pending writes and invalidates late callbacks. Direct writes override host automation; re-enable through Live. Explicit reconnect is required after Set reload.

Native rendering approximates browser styles. Chickenhead and raised-black shapes are drawn with Max primitives, while browser shadows/materials are not reproduced exactly. Pointer drag, Shift fine mode and double-click reset are implemented. Native keyboard accessibility, precise value entry UI, gesture/undo grouping, real-time performance and style parity remain unverified or pending. No meters or proprietary data are shown.

## Host verification when available

1. Export a one-control Morph project and load the patch in a new stock M4L device, preserving audio pass-through.
2. Confirm the manifest loads and disconnected status is visible. Select the intended synth and bind.
3. Test read, drag write, plugin-to-runtime observation, coarse/custom steps and double-click defaults. Observe actual host values rather than rounding feedback.
4. Record/replay automation and re-enable after an override. Check throttle latency and final value.
5. Disconnect during a pending drag, delete target, change selected track, bind another identical synth and reopen the Set. Confirm safe failure and explicit rebinding.
6. Test mismatched names/ranges and synthetic manifests; neither should bind.
7. Measure CPU, pointer response, panel bounds and memory in the actual host. Check dependency packaging on an isolated machine before claiming portability.

## Host parameter capture

The source patch also includes captureselected and an explicit Save capture dialog. See host-capture.md. It can run without a loaded layout and does not rebind the existing controller. Captured defaults are reset baselines from current values. This new path is simulated-host tested only.
