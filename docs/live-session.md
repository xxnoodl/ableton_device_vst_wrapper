# Live session discovery

Status: read-only bridge prototype, HTTP and simulated-host tests pass. User confirmed actual bridge initialization and a successful two-plugin catalog upload from Live. Browser selection and generated-wrapper behavior from that real catalog remain to be checked. This path removes the hardcoded Morph/Motion adapter requirement for controls that are already exposed by Live; it does not make unexposed native parameters available automatically.

## Producer workflow

1. Run the local studio server and open the builder. Download Live bridge under Live session, extract all files together and load Live-Session-Bridge.amxd once on an audio-capable track in Live. The equivalent local development bundle can be built with `node scripts/build-live-bridge.mjs artifacts/NEW_FOLDER`.
2. The bridge reads plugin instances across ordinary tracks, return tracks, the main track and nested rack chains. In the builder, choose the intended instance from its track/chain label. No plugin-title selection timing or Max patch assembly is needed for discovery.
3. Check the exposed controls to show. Their names, ranges, current values, quantization and available enum labels come directly from Live. The default layout is generated automatically; customization is optional. Search filters the list; panels currently support up to 60 checked controls.
4. Generate device, extract together and drop Wrapper.amxd immediately after the intended original plugin. The existing regular runtime validates its predecessor and unique parameter name/range matches. The browser preview does not control plugin values. Reopening uses the regular wrapper's predecessor restoration, not saved session IDs.

Refresh session requests a new snapshot after Configure changes or plugin insertion/deletion. Existing designs stay unchanged until the user chooses a snapshot again. No exposed controls produces a visible Configure/refresh message. Unavailable metadata and limits are reported; invalid values are never invented or clamped into defaults. Captured current values become reset baselines, not factory defaults. The catalog carries no SDK IDs, plugin fingerprints or claimed physical units.

## Boundary with native inspection

Native VST3 inspection remains useful for discovering the plugin's full metadata, including controls not exposed in Live. These controls remain Preview only unless a mapping is verified. The session path starts with actual Live parameter objects instead, so generic name/range matching can be validated against the loaded plugin at bind time. It does not infer that a native parameter and a similarly named Live parameter have the same identity or range.

The published [PluginDevice interface](https://docs.cycling74.com/apiref/lom/plugindevice/) inherits Device's exposed parameter list and adds editor/preset access; it provides no documented Configure function. Automatic exposure remains a product gap. We are not silently replacing Live's plugin host with vst~ or loading another DSP instance to bypass it.

## Implementation and limits

The bridge is a separate controller/status renderer using the existing local Max-saved shell unchanged. Its reused bindselected button is a rescan alias; clicking the status panel also rescans. Disconnect aborts HTTP requests, cancels scan/poll tasks and invalidates callbacks. No parameter setters, Node for Max, file capture writer or DSP processing are used. It uses the documented legacy [XMLHttpRequest](https://docs.cycling74.com/apiref/js/xmlhttprequest/) API with asynchronous text responses and readyState handling.

Scan work is sliced into eight jobs per nominal 10 ms task, with a 20-second deadline, eight rack levels, 128 plugins, 256 controls per plugin, 4,096 session controls and 8,192 jobs. Conservative payload accounting bounds transfer size; omissions remain visible. These bounds are not real-time performance measurements. Network requests time out after ten seconds; idle polling is every two seconds. The server treats a bridge heartbeat as stale after 45 seconds and reacquires a new token after restart.

The server binds to loopback. Host/Origin/fetch-site guards apply before bridge routes. A random per-server capability is required for refresh, bridge polling and uploads. Only bounded JSON catalogs and read-only refresh requests are accepted; there is no plugin-control or filesystem command endpoint. Catalogs include track/device names and parameter values and live only in server memory. Generated projects omit transient device IDs and track/chain labels. Portable project files still contain chosen plugin metadata and reset baselines.

One bridge per session/server is intended; arbitration between multiple Live processes is not implemented. A helper only sees its own Live session. Actual host transport, nested rack coverage, visual presentation, sustained scan load, clean-machine references and broader generated-wrapper compatibility remain to be checked. The earlier Node-for-Max writer crashes were not retriggered or declared fixed.
