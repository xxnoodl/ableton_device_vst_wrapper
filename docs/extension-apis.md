# Extension boundaries

- `packages/schema`: strict project v2, v1 migration, numeric transforms and serialization. Breaking changes require explicit migration. Unknown executable expressions are rejected.
- `packages/layout-engine`: pure validated commands. Preserve group bounds, locks and immutable history.
- `packages/presets`: function selection and layout appearance are distinct. Named presets are never silently replaced.
- `packages/diagnostics`: project-derived errors and limits. Schema success is not host verification.
- `packages/host-capture`: exposed metadata conversion. Vendor, units, format and SDK IDs stay unknown unless established separately.
- `packages/export` and `max/runtime`: independent runtime v1, deterministic source ZIP, Max controller and native drawing. Both validators need parity checks when contracts change. Observations never write back; disconnect cancels queued writes.
- `native/plugin-inspector`: static inventory only. A future native host needs a separate restricted executable, reviewed SDK license and crash/resource tests. Never load plugin code in the studio/server process.
- `packages/analysis`: synthetic numeric models. Real-plugin graphs need verified semantics; analyzers need real audio taps. No fake telemetry fallback.

Optional AI remains unimplemented and advisory in scope. External audio hosting is a separate architecture decision, never an implicit replacement for Live API control.
