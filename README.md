# VST-to-M4L Interface Studio

Local-first tools for designing Max for Live controls for existing VST3 plugins. The original plugin keeps its DSP in Live.

## Current progress

M0 feasibility testing is in progress. On Live 12.3.2 with bundled Max 9.0.9, the user confirmed two-way control of Arturia Augmented Strings' exposed Morph parameter. A test device was saved successfully. The user also confirmed automation playback updates Live and Max after explicit rebinding. Reopening the Set requires disconnect and explicit rebinding, which the user confirmed restores control. Automatic restoration is unsupported. Writing from Max during playback overrides Morph automation, as reported by the user. Re-enabling automation restores playback updates in Max, as confirmed by the user. Automation recording and portable packaging remain untested. This does not establish support for other plugins or parameters.

- Working: one-parameter Max probe, explicit selected-device binding, value observation and writes.
- Automated: seven simulated LiveAPI contract tests pass. These do not test the real host.
- Pending: remaining M0 host checks before the editor and native inspector.

See [progress](docs/progress.md), [feasibility](docs/feasibility.md) and [manual verification](docs/manual-verification.md).

## Run tests

Requires Node >=22. No dependency installation needed.

```sh
npm test
```

## Max source

`max/examples/parameter-probe.maxpat` is patch source. Copy its objects into a stock Max Audio Effect, preserving the audio pass-through. Point its `js` object to `max/renderer/parameter-probe.js`. Expose Morph with Live Configure, select Augmented Strings, then click `bindselected`. The number box uses the raw host range.

The example-folder JS copy supports opening the patch directly; the renderer-folder copy is canonical. Local exported devices and Live Sets are ignored by Git until their dependencies and portability have been checked. No plugin binaries, SDKs or proprietary assets are bundled.

## Development

Keep commits small with short, plain messages. Do not add credit or co-author trailers. Update `docs/progress.md` when a meaningful test or milestone changes. Record what was actually observed and keep pending work explicit.
