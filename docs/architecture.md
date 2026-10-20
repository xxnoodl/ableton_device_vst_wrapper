# Architecture and M0 boundaries

Original VST3 runs in Live. M0 Max patch sends explicit index-based bind commands to legacy `js`; low-priority scheduling enters through deferlow. LiveAPI observes value; feedback emits `set` into a number box so it cannot echo a write. Only user edits emit write messages. Rebinding clears subscriptions and invalidates stale callbacks. Writes check enabled state, clamp and reject nonfinite input. No automatic reconnection after reload or target guessing.

Later: versioned TypeScript IR shared by desktop preview and separate native Max renderer; isolated native VST3 worker; portable JSON projects; local metadata index only if justified. No arbitrary evaluated expressions. Tauri/React remains a proposed choice pending M0 and toolchain setup. Process isolation is not a security sandbox; resource restrictions require separate design and tests.

## ADR 004 implementation notes

First studio slice uses browser ES modules, a Node localhost-only asset server and TypeScript schema modules stripped by Node 24. The server serves only allowlisted studio/schema/store/fixture files, checks resolved paths against those roots and does not expose the repository or user filesystem. No plugin worker, audio code or Live IPC runs in this process.

Projects use strict schema v1 with stable project-local parameter IDs, not claimed SDK IDs. Only Live-exposed target intent, flat knob/fader layouts and demo preview are supported. Missing actual plugin class ID remains null. Full widget tree, graph contracts, presets, migrations and real binding resolution remain pending.

Local saves are browser-origin storage with explicit updates and previous-content backups; portable JSON is the durable exchange format. Preview manipulation does not write to Live. Drag commits one history entry; numeric properties and keyboard movement validate bounds. History is bounded to 100 entries.

## Canvas operations

The layout engine is pure and validates results before committing history. Multi-control moves clamp once for the whole selection so spacing is preserved. Group selection expands member IDs; groups containing locked members resist structural edits. Alignment/distribution may produce fractional positions to preserve exact geometry, while manual movement/resize snaps to grid. Duplication allocates fresh group IDs, so copies do not drag the original group.
