# Open risks

- Host parameter list may require Live Configure and may expose only a subset; SDK IDs and Live parameter indices are different namespaces.
- Device indices can silently identify a different device after reorder/reload. M0 requires explicit rebinding; persistent identity is unsolved.
- Direct set may override automation. Recording, undo and gesture behavior require measurement; no production automation guarantee.
- Installed host/plugin licenses are unknown. No SDK or commercial assets redistributed.
- Proprietary gain reduction unavailable; future meter must show unavailable until verified telemetry exists.
- No native sandbox, discovery worker, packaged desktop or actual amxd yet.
- Website terms do not establish Max redistribution rights. Verify installed EULA and asset licenses before packaging.

## Studio slice limitations

Browser local saves can be cleared by browser policy or storage exhaustion; export JSON for durable backups. The current schema is a deliberately limited v1 subset and does not encode full runtime mappings. UI smoke checks and TypeScript static checking are pending. Localhost preview does not inspect or load plugins. Same-machine copied-device success does not prove that Max ignored its cached original dependency path.
