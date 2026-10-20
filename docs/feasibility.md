# M0 feasibility — 2026-10-20

Observed Windows build 26200, x64. Desktop initially contained only desktop.ini; no repository. Node 24.16.0, npm 11.13.0, Git 2.54.0.windows.1 available. CMake, Rust and Cargo absent from PATH; C++ compiler not established. A Visual Studio directory alone is not evidence of a usable compiler.

Installed Live executable reports 12.3.2; bundled Max reports 9.0.9.d7cea08a608. Live is running. Installation and running process do not establish license status or successful Max device editing. Several VST3 paths exist, including FabFilter, Serum2 and Youlean; none loaded or scanned by this project. No third-party files modified. SDK availability not established.

Official documentation provides DeviceParameter value get/set/observe and explicit track/device/parameter addressing. This supports attempting approach A; it does not prove arbitrary plugin exposure, automation or restoration. Probe uses raw host range, not presumed normalized values. Runtime IDs are not persisted.

Deliverable: one-parameter Max JS controller and patch source; isolated simulated LiveAPI contract tests. Initial CLI assessment did not verify host integration. Subsequent user-guided testing confirmed real-host Morph read/write/observation; see progress.md. Automation recording, audio behavior, panel measurements and reopen remain unverified. CLI tooling here does not provide a Live UI automation interface, so the running Live session has not been manipulated. Manual verification is the next gate.

Decision: hold M1/M2 until recorded host evidence passes M0 or user explicitly changes scope. No external audio bridge substituted. User assistance is needed to run the included patch inside the licensed Live session and capture evidence.

## Session update

User confirmed two-way Augmented Strings Morph control and reported device save on 2026-10-20. M0 remains open pending automation, reload and target lifecycle checks. The earlier environment inspection describes the initial state, not the current verification result.
