# Roadmap and gates

1. M0 passed for the Augmented Strings Morph path using the original probe. User-reported host evidence is in progress.md and fixtures/verification.json. Explicit reconnection and automation override behavior are documented.
2. M1 partial: typed v2 IR subset, v1 migration, portable JSON, backup-protected browser storage, isolated static VST3 inventory and host-capture import are implemented. Native SDK inspection and binary fingerprints now work for Windows x64; generic Live routing and an actual redistributable audio-plugin DSP fixture remain pending. Static PE fixtures are not plugins.
3. M2 partial: interactive knob designs, detents, function selection, separate presets, multi-selection, resize, align/distribute, group/lock/layers, zoom/pan, properties, themes and undo/redo are implemented. Simulated-DOM/state tests pass; responsive constraints, full accessibility and browser performance remain pending.
4. M3 prototype: reusable native Max source renderer/controller and deterministic source ZIP export are implemented with simulated-host tests. Morph/Motion controls, simultaneous automation, compact presentation and generated shell loading/reopening passed user checks. Capture saving is suspended after crashes; clean-machine portability, gesture/undo and release shell distribution remain pending.
5. M4 partial: synthetic compressor/EQ control-derived previews have numeric tests. Real-plugin EQ semantics, native graphs, measured gain reduction and audio analyzer taps remain unsupported.
6. M5 pending: TypeScript static tooling, desktop packaging, low-end performance, clean-machine compatibility, OS sandbox restrictions and licensing/SDK audits. Network package downloads are blocked. Installed MSVC/CMake were found via vswhere outside PATH; Rust/Cargo remain unavailable.
7. M6 deferred: optional AI and lawful VST2 support. No cloud dependency, telemetry, proprietary assets or external audio bridge introduced.

Do not interpret completed automated tests as universal host compatibility. Continue with independent work where possible; actual new Max runtime behavior requires a licensed host test, and packaged desktop/native SDK work needs the missing toolchain/dependencies.

Current priority: bridge verified native discovery to automatic Live routing for more controls without requiring producer Configure/patch editing. Do not silently introduce a different DSP host. The exact-fingerprint Morph/Motion adapter is a narrow measured path, not universal plugin support.
