# Visualization capability matrix

| Level | Data source | Current support |
| --- | --- | --- |
| 0 | Static drawing | Native/browser control visuals; no pretend meter values |
| 1 | Declared control model | Synthetic compressor transfer and peaking-EQ previews only |
| 2 | Actual audio tap/analyzer | Unsupported; no spectrum, scope or audio-level source implemented |
| 3 | Authorized proprietary telemetry | Unsupported; no plugin adapter implemented |

The compressor sample declares threshold in dB and ratio in a hard-knee, no-makeup model. The curve is before mix and does not measure gain reduction or reproduce a plugin compressor. The EQ sample declares one RBJ peaking biquad with frequency, Q, gain and sample rate. These are visualization calculations, not plugin DSP replacements.

EQ coefficients follow the W3C Audio EQ Cookbook (2021-06-08): https://www.w3.org/TR/audio-eq-cookbook/. Numeric tests verify unity at zero gain, center gain, inverse boost/cut, Q narrowing and stable poles over the fixture's declared ranges. Compressor tests verify threshold continuity and ratio behavior. The log-frequency axis is bounded below Nyquist; gain axes follow the declared synthetic range.

Graphs require explicit synthetic-contract schema metadata and synthetic parameter provenance. Importing a real plugin's host parameters does not enable these graphs. Actual filter semantics must be verified before a future real-plugin model is supported. Graphs are editor-only and omitted from current Max source export, with a visible diagnostic. Unknown models, sources or invalid contracts fail validation.

Graph paths update in one scheduled browser animation frame rather than on every pointer event. Paths contain 241 samples; at most eight graphs are accepted. No CPU budget or low-end machine performance is claimed verified. Native graph rendering, audio taps, calibration, smoothing and real signal tests remain future work.
