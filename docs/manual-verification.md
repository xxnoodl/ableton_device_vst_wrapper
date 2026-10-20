# Executable manual M0 plan

Status: NOT RUN. Use a new disposable Live Set; save existing work first. Do not test on a production session. No installed plugin/preset files need modification.

1. Record Live/Max versions, Windows version, plugin name/vendor/version/format and license availability in a copy of `../fixtures/verification.json`. Select one licensed VST3 already available. Do not redistribute it.
2. Put that VST3 on a track. Use Live Configure to expose a safe continuous control. Note its name and raw range. Lower monitoring level before audible tests.
3. Add a stock Max Audio Effect on that track and open its Max editor. Open `max/examples/parameter-probe.maxpat`; copy its boxes/connections into the device patch, preserving the stock device audio pass-through. Keep `parameter-probe.js` in the patch search path (same saved folder or Max File Preferences). Do not open the patch in standalone Max and expect LiveAPI access.
4. Wait until the M4L device is initialized. Edit the bind message: `bind TRACK DEVICE PARAMETER`, all zero-based indices, ordinary tracks only. The included 0/0/1 is an example, not a mapping. Inspect Live's device parameter list with Max Live API tools to determine indices, including Device On where present. Click bind and inspect the status outlet in Max Console. Confirm the reported name/range against the intended plugin; disconnect immediately if wrong.
5. The number box shows raw host value. Enter a safe in-range value; verify the original plugin changes visually and, where appropriate, audibly. Change the plugin GUI; check the number box follows. Save console output/screenshots and both observed values.
6. Record and play automation on the original parameter. Check observer follows, no unsolicited writes, no oscillation. Then edit via probe; record whether automation records or overrides. Do not mark automation passed without this distinction.
7. Save the test device as `.amxd` using Max/Live's supported device save flow; include the JS dependency and reopen it. Record whether packaging embeds/resolves JS. Save/reopen the Set. Probe deliberately starts disconnected; verify explicit rebind works. Automatic restoration remains unsupported.
8. Move/duplicate track and plugin, delete the target, disable the parameter, and try an unavailable index. Record actual behavior and errors. Rebind explicitly after structural changes. Do not reuse saved indices blindly.
9. Measure panel size, UI latency, CPU and stability in the actual host. Store measurements with method and duration. Mark unknowns pending, failures failed; attach evidence paths.
10. Disconnect and remove the test device to roll back. M0 passes only with documented limitations and real read/write/observe/automation/reload/target evidence. If blocked, record errors before considering approach B.

Automated preflight: `npm.cmd test`. This verifies only simulated contracts. No test result from that command establishes host compatibility.
