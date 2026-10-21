# Native VST3 parameter discovery

Installed plugins are inventoried automatically. Choosing a Windows x64 plugin reads its controller metadata in a disposable native helper. Searchable checkboxes create a default layout; customization is optional. Multi-component modules require a component choice.

Build the development helper with `powershell -NoProfile -File scripts/build-inspector.ps1`. It locates Visual Studio C++ Build Tools and CMake through vswhere without installing anything or changing PATH. This machine has MSVC 19.51 and Windows SDK 10.0.26100.0. The official MIT-licensed interface subset and required notice are vendored; upstream per-file Git blob SHAs are recorded in vendor/source-manifest.json. Shell downloads failed; the official files were fetched read-only through the GitHub connector. This is not represented as a complete pinned SDK release.

## Execution boundary

The server accepts only opaque IDs from its fixed-directory inventory and validated optional component IDs. One inspection runs at a time. The helper initializes component/controller and host callbacks, connects separate components and transfers default state in memory where supported. Controller queries run on its main COM STA thread. It never requests the editor, activates buses, calls audio processing or writes presets. Third-party constructors may still manage their own licensing UI/settings.

A Windows job applies 1.5 GiB process memory, 15 seconds user CPU, one active process and kill on close before loading plugin code. Supervision adds a 20-second wall deadline, 8 MB response cap and bounded discarded logging. These are process/resource restrictions, not a restricted-token filesystem/network security sandbox; stronger OS sandboxing remains pending. Failed plugins never load in the server process.

Inspection computes actual binary SHA-256 and checks file size/time for changes. Results retain native IDs, index, names, units, unit ID, normalized default, display text, step count, flags, plain endpoint conversions and small enum lists. Plain endpoints are not asserted Live raw ranges. Defaults describe a fresh instance, not the user's current Live preset. Unknown fields, duplicate IDs and inconsistent payloads fail validation. Invalid defaults stay diagnostic entries without substituted values. Read-only, hidden, program and invalid controls are excluded from editable checkbox results. Search renders at most 100 matching controls; one automatic panel supports up to 60 selections.

## Native discovery and Live routing

Native discovery does not prove a parameter is exposed as Live DeviceParameter. Unknown mappings remain Preview only and block generation. Their preview numbers are normalized, with no inferred physical unit. native-inspected provenance cannot silently become host-captured or user-reported.

The measured adapter covers only Augmented Strings Morph and Motion for the exact inspected binary fingerprint and class/parameter IDs. Their names and Live ranges were independently user-tested. They can generate the existing controller wrapper. Other native controls need verified routing; there is no automatic Configure or universal mapping claim. No new DSP host or audio-routing change was introduced.

## Evidence

Installed Augmented Strings returned 2,748 native parameters, of which 580 were editable with valid metadata. 2,080 defaults of -1 were retained as diagnostics. Morph is SDK ID 1/default 0.5; Motion is ID 4/default 0. Both are continuous with plain endpoints 0..1. The class ID matches the earlier Live restoration log. The real HTTP selection path produced a Morph/Motion project and generated bundle under ignored artifacts.

Compiled original ABI fixtures test metadata, enum labels, invalid defaults, class choice, crashes and hangs followed by successful inspection. They have no audio DSP and are not a redistributable audio-plugin fixture. Studio selection/search/checkbox wiring uses a simulated DOM; browser visuals and loading the newly discovered-ID bundle still need user checks.
