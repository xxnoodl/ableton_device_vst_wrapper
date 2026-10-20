# Troubleshooting

- Studio unavailable: run `npm start` from the repository with Node 24 and keep the terminal open. Use http://127.0.0.1:5173. `node scripts/smoke-studio.mjs` checks assets and request guards, not browser interactions.
- Port occupied: use the existing server or stop its terminal with Ctrl+C before restarting. Leave unrelated processes alone.
- Old project upgrades: v1 migration happens in memory and export writes v2. Local updates back up previous raw contents. Export before clearing browser storage.
- Controls will not move/hide: unlock them and their group. Increase panel bounds if new controls lack free space. Invalid changes preserve the project.
- Native binding fails: expose controls in Live Configure and explicitly select the intended plugin. Display name and raw range must match uniquely. SDK identity is unavailable.
- Automation turns gray after a manual write: re-enable automation in Live. Original probe tests do not verify the new native runtime.
- Reopening disconnects: explicitly bind again. Dynamic Live IDs are never persisted.
- Max reports missing scripts/outlet errors: keep every export dependency beside the patch. A missing script can remove diagnostic wires; inspect them after fixing paths. Old console entries are not fresh results.
- Capture cannot save: select a new JSON filename, keep both CJS helpers with the patch, and confirm Node for Max starts. Existing files are atomically refused.
- Inventory permission errors: these are actual read limitations. The app does not change permissions or bypass protection. Inventory does not establish plugin health or parameter access.
- Native visuals differ: Max drawing approximates browser materials. Synthetic graphs are editor-only; no audio telemetry is implemented.
