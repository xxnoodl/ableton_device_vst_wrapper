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

## Set reopen check

- User saved and reopened the Live Set. Morph control did not reconnect automatically.
- Disconnect followed by selecting Augmented Strings and bindselected restored operation.
- Manual reconnection after reload is confirmed by user report. Automatic restoration remains unsupported; M0 must document this limitation.

## Track selection check

- User confirmed the connected Max number box continues following Morph automation after selecting a different track, without rebinding.
- This checks selection changes only. Moving, duplicating or deleting tracks/devices remains untested.

## Track move check

- User moved the Augmented Strings track above or below another track and confirmed Max still follows Morph during playback without rebinding.
- This verifies the existing connection survives track reorder in this session. Device moves, duplication and deletion remain untested.

## Write during automation check

- User entered 0.5 through Max during Morph automation playback and reported automation became disabled/overridden.
- Current direct LiveAPI value writes interrupt automation; they do not preserve playback ownership. This behavior must be exposed in the eventual controller UX.
- Re-enabling automation and confirming resumed playback remain pending. Automation recording remains untested.

## Automation recovery check

- User re-enabled Morph automation in Live and confirmed Max follows playback again.
- Observed sequence: playback follows, manual Max write overrides automation, explicit re-enable restores playback observation.
- Automation recording and undo behavior remain untested.

## Disconnect check

- User confirmed Morph automation continues in Live after clicking disconnect.
- While disconnected, entering 0.5 in Max did not affect Morph or interrupt its automation.
- User also confirmed the Max number stops following automation after disconnect and stays at its locally entered value. Both observer detachment and write isolation passed by user report.

## Target deletion check in progress

- User deleted Augmented Strings and edited the Max number; no visible errors or patch UI changes were reported.
- Console output has not been inspected. This is not evidence that missing-target detection passed or failed.
- Current patch has no inline disconnected/error indicator; diagnostics are sent to Max Console. Production UI needs visible target availability.

## Missing target guard fix

- After reconnecting the diagnostic outlet, user reported repeated native LiveAPI no-valid-object messages after target deletion.
- Added target type checks and rejection of empty host responses, with disconnect on unavailable targets to prevent repeated property reads on later edits.
- Seven automated simulated contract tests pass, including stale nonzero IDs with empty reads and invalid types. Fix still needs real-host retest; a native warning on the first failed read may remain.
- Diagnostic wire had been removed during initial missing-script loading; user reconnected the second JS outlet and confirmed disconnect/bind messages.

## Missing target retest

- User confirmed subsequent edits after deletion show only disconnected and error: target unavailable; bind explicitly, without new native LiveAPI errors.
- Missing-target guard recovery passed for this session by user report. Native warnings seen around deletion/initial failure remain a limitation; zero-warning teardown is not verified.
- Automatic restoration and inline target/error display remain unsupported.

## Restored target check

- User restored the deleted synth with Live undo, selected Augmented Strings and rebound. Morph changes again update the Max number.
- Delete/restore recovery is confirmed with explicit rebinding. Automatic restoration is not supported.
- Remaining M0 work includes automation recording, duplicate target selection, plugin version evidence and portable device dependency checks. Performance and device panel measurements are also pending.

## Second synth isolation check

- User added a second Augmented Strings instance on a new MIDI track, exposed Morph, and changed it without rebinding.
- The new instance did not affect the Max number connected to the original synth.
- Explicit retargeting to the second instance and reverse-direction isolation remain untested.

## Explicit retargeting check

- User selected the second Augmented Strings instance and clicked bindselected.
- Max followed the second instance, and Morph changes on the original instance no longer affected its number.
- Explicit observation retargeting and old-target observer isolation passed by user report. Writes to the second instance remain separately untested.

## Retargeted write isolation

- With playback stopped and the probe bound to the second synth, user entered 0.5 in Max. Only the second synth changed; the original stayed unchanged.
- Two-instance targeting checks now cover observation, explicit switching, old-target isolation and writes to the new target. Results are specific to Augmented Strings Morph in this session.
