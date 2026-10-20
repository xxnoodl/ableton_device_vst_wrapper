# Dependency and asset notes

No third-party plugin binaries, SDK source, graphics, fonts or icon packs are vendored. Knob art is original CSS/SVG inspired by user-supplied references; those images are outside this repository. System fonts are used.

The studio uses Node built-ins and browser APIs. No npm packages were successfully installed. Max source requires separately installed, licensed Live/Max for Live and the host-supplied max-api module. No Max runtime is redistributed. JUCE and the VST3 SDK are not linked or bundled; pinned dependency/license review remains necessary before adding them.

Synthetic EQ visualization mathematics references the W3C Audio EQ Cookbook; see research.md. It does not reproduce proprietary plugin DSP.

The maintainer has not selected a repository-wide distribution license. These notes do not grant licenses for future SDKs/assets.
