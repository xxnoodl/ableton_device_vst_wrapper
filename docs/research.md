# Official research — checked 2026-10-20

Documentation is rolling unless noted. Installed versions: Live 12.3.2, bundled Max 9.0.9. No SDK/framework dependency pinned or downloaded yet.

| Source | Finding and decision |
|---|---|
| https://docs.cycling74.com/apiref/lom/deviceparameter/ | value supports get/set/observe; is_enabled and min/max available. Try host-visible parameters only; no presumed SDK-ID mapping. |
| https://docs.cycling74.com/legacy/max8/vignettes/jsliveapi | Legacy js API constructor, callback, dynamic IDs, initialization and low-priority restrictions. Use explicit bind after initialization and deferlow. Compatibility with installed Max still needs execution. |
| https://docs.cycling74.com/reference/jsui/ | Supported native drawing candidate; benchmark later. No HTML device-panel assumption. |
| https://www.ableton.com/en/live/max-for-live/ | Product availability information; actual installed authorization and export workflow unverified. |
| https://www.steinberg.net/developers/vstsdk/ | Current VST3 SDK MIT licensing; 3.8.0 release announced by Steinberg. Inspect exact pinned repository LICENSE before integration. Older license pages differ; do not apply old blanket restrictions to newer SDK. VST2 remains separate legacy scope. |
| https://forums.steinberg.net/t/vst-3-8-0-sdk-released/1011988 | Official SDK 3.8.0 release announcement; not a claim this is the newest release or installed. |
| https://juce.com/get-juce/ | JUCE dual AGPLv3/commercial licensing. Do not introduce JUCE without choosing applicable terms; direct VST3 SDK inspector is a candidate. |
| https://v2.tauri.app/start/prerequisites/ | Tauri v2 Windows requires native build tooling/Rust/WebView2. Rust/Cargo absent from PATH. |
| https://v2.tauri.app/distribute/windows-installer/ | Windows MSI/NSIS packaging options; packaging deferred. |
| https://v2.tauri.app/about/ | Tauri framework overview. Exact dependency licenses and versions must be audited when pinned. |
| https://cycling74.com/terms-and-conditions | Website terms only, not the Max software EULA. Software/asset redistribution rights unresolved; inspect installed EULA before packaging. |

No downloaded SDK, Max runtime, third-party graphics or plugin binaries are included. Max software license and exact Tauri dependency license text remain explicit research gaps, not assumed grants.

## Studio slice sources

Checked https://react.dev/learn, https://vite.dev/guide/ and https://zod.dev/basics before attempting installation. No packages were successfully installed; no versions or dependency license compliance are claimed. Shell currently uses only Node built-ins and browser facilities.

Live automation reference checked: https://www.ableton.com/en/live-manual/12/automation/ ? manual changes override automation until re-enabled; actual probe recording/replay was separately user-tested.

## Native runtime sources

Checked https://docs.cycling74.com/apiref/js/mgraphics/ for native drawing primitives, https://docs.cycling74.com/legacy/max8/vignettes/jsfileobject for file reading, and https://docs.cycling74.com/apiref/lom/plugindevice/ for host-visible plugin devices. Legacy JSUI and LiveAPI execution in the new runtime still require a real-host test; successful Node simulations are not equivalent.
