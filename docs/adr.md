# ADR log

## 001 — Start with Live API (accepted 2026-10-20)
Narrowest documented path keeps plugin audio, routing and state in Live. Separate host remains deferred until evidence demonstrates need and user accepts changed routing.

## 002 — Dependency-free M0 contract harness (accepted)
Run the actual Max-compatible JS in a Node VM with an explicit synthetic LiveAPI. This checks controller behavior without pretending to verify Live. Full studio/schema deferred at feasibility gate.

## 003 — Patch source rather than fabricated device (accepted)
Supply valid JSON Max patch source and in-host instructions. Only Max/Live may establish successful `.amxd` export. No renamed JSON device.

## 004 ? Runnable browser shell before desktop packaging (accepted)
After the narrow M0 host path was proven, npm dependency installation was blocked by network EACCES. Use native browser modules and Node 24 TypeScript stripping to deliver an executable shell without downloaded dependencies. React/Tauri remain proposed later choices. TypeScript runtime stripping is not static typechecking. Native inspection and clean-machine packaging remain separate work.
