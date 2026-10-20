# Architecture and M0 boundaries

Original VST3 runs in Live. M0 Max patch sends explicit index-based bind commands to legacy `js`; low-priority scheduling enters through deferlow. LiveAPI observes value; feedback emits `set` into a number box so it cannot echo a write. Only user edits emit write messages. Rebinding clears subscriptions and invalidates stale callbacks. Writes check enabled state, clamp and reject nonfinite input. No automatic reconnection after reload or target guessing.

Later: versioned TypeScript IR shared by desktop preview and separate native Max renderer; isolated native VST3 worker; portable JSON projects; local metadata index only if justified. No arbitrary evaluated expressions. Tauri/React remains a proposed choice pending M0 and toolchain setup. Process isolation is not a security sandbox; resource restrictions require separate design and tests.
