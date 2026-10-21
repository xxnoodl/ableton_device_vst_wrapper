# Static VST3 inventory

Use Read VST3 folders in the studio to inventory the standard Windows VST3 directory. The local server exposes only that fixed directory. CLI accepts explicit roots:

```
node scripts/inventory-plugins.mjs "C:\Program Files\Common Files\VST3"
```

The helper is a separate Node process with a 96 MB heap cap and a 15-second deadline. It reads directory entries and PE headers, detects x64/x86/arm64 headers, handles Windows x64 bundles, deduplicates canonical paths and skips symlinks. It reports unreadable files without changing permissions or binaries. Traversal is capped at 10,000 entries and 256 plugins. Worker crashes, malformed IPC and hangs fail without crashing the studio; the next scan can start a new worker. The localhost API validates inventory payloads, rejects cross-origin/cross-site and unexpected Host headers, and caches scans for 30 seconds.

This is inventory, not native VST3 inspection. No plugin code is loaded; no DSP, presets, parameters or GUI are accessed. Fingerprints are null rather than invented; vendor/class identity is unknown. A process boundary and Node heap cap are not a security sandbox. Native execution is now provided by the separate SDK inspector; see native-inspection.md for job resource limits, verified behavior and pending stronger OS sandboxing. VST2 is not inspected.

Live machine observation: initial scan read 69 x64 plugin headers and reported one permission error; unreadable-header entries are now retained as unknown rather than omitted. No access restrictions were bypassed. Local inventory output under artifacts/ is ignored by Git because it includes installed paths. Plugin binaries are never copied into the repository.
