# Device generation prototype

Initial automatic binding passed in Live, but a Set reopen required manual binding. The runtime now retries failed startup binding six times over 8.25 seconds to accommodate delayed host restoration; explicit disconnect and manual binding cancel pending attempts. There is no ongoing polling after exhaustion or successful connection. Timing remains a hypothesis until the reopen retest passes.

The producer flow is choose a plugin, check desired controls, generate, and optionally edit the result. Device assembly and presentation positioning belong to the builder.

Generate device creates a seven-file ZIP with Wrapper.amxd, controller.js, renderer.js, runtime-core.js, project.runtime.json, project.studio.json and README.txt. The existing parameter checkboxes determine exported controls; newly enabled functions receive default positions. Current manual customizations are preserved. Native rendering fits occupied control bounds into the validated shell panel.

The local shell is a device authored and saved in licensed Max, previously tested in Live. Its AMXD bytes are copied without modification. Generation validates the known unfrozen audio-device envelope, presentation bounds, controller/renderer and initialization objects and wiring, and rejects Node-enabled shells. It does not implement a general AMXD writer or claim Max supports external container editing. Binary-safe ZIP creation preserves the shell exactly. The CLI refuses an existing output directory and rolls back files created by a failed build.

The development installation stores this ignored local shell at max/templates/wrapper.amxd. The server exposes only that validated file at a guarded loopback endpoint. Missing/incompatible shells fail explicitly. Repository source export remains a separate developer CLI. An approved redistributable shell and release packaging remain necessary; the producer should not have to configure one.

Example development build:

```sh
node scripts/build-device.mjs fixtures/morph-motion.project.json artifacts/my-new-wrapper
```

Extract the bundle together and drag Wrapper.amxd after the original plugin in Live. Generated devices now attempt automatic connection to the immediate preceding plugin after initialization. Exact name and unique parameter/range matching are still required; other devices are not searched. Manual bindselected remains available for recovery. Automatic connection on load/reopen has simulated-host tests and awaits a real-host check. No patch editor is needed. Required Live-exposed metadata remains a temporary workflow limitation. This controls an existing instance; it does not yet host a plugin in the wrapper. Inventory reads filenames/PE headers and does not discover parameters. Capture saving remains suspended after the native Node-for-Max crash; no node.script or capture-writer files are included in this bundle.

Automated evidence: unchanged shell bytes, malformed/out-of-bounds/Node-enabled shell rejection, selected-only metadata, binary ZIP payloads, existing-directory refusal and independent ZIP CRC checking. The first generated bundle loaded and worked in Live after explicit binding; original shell checks do not establish generated-bundle or clean-machine compatibility. Synthetic test envelopes are not actual plugin/device fixtures.

Automatic selected-control layouts now use one horizontal row. The editor canvas supports widths up to 8192 pixels. Generated native panels request their occupied width through live.thisdevice setwidth on each initialization; drawing-area size follows that width. Custom arrangements are preserved. Host verification of expanded multi-control width is pending.
