# ADR log

## 001 — Start with Live API (accepted 2026-10-20)
Narrowest documented path keeps plugin audio, routing and state in Live. Separate host remains deferred until evidence demonstrates need and user accepts changed routing.

## 002 — Dependency-free M0 contract harness (accepted)
Run the actual Max-compatible JS in a Node VM with an explicit synthetic LiveAPI. This checks controller behavior without pretending to verify Live. Full studio/schema deferred at feasibility gate.

## 003 — Patch source rather than fabricated device (accepted)
Supply valid JSON Max patch source and in-host instructions. Only Max/Live may establish successful `.amxd` export. No renamed JSON device.
