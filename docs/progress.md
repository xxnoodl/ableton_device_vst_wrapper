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
