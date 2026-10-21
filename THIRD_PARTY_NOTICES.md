# Dependency and asset notes

No third-party plugin binaries, graphics, fonts or icon packs are vendored. Knob art is original CSS/SVG inspired by user-supplied references; those images are outside this repository. System fonts are used.

The studio uses Node built-ins and browser APIs. No npm packages were successfully installed. Max source requires separately installed, licensed Live/Max for Live. No Max runtime is redistributed. Node-for-Max capture saving is suspended and excluded from generated bundles. JUCE is not used.

The native inspector vendors a minimal subset of Steinberg's official VST3 pluginterfaces, including funknown.cpp. Copyright (c) 2026 Steinberg Media Technologies GmbH. This subset is MIT licensed; the full required notice is in native/plugin-inspector/vendor/pluginterfaces/LICENSE.txt. Repository origin, retrieval date and individual upstream Git blob SHAs are recorded in native/plugin-inspector/vendor/source-manifest.json. No third-party audio plugin is included. The original ABI test modules contain no audio DSP and are built only into ignored artifacts.

Synthetic EQ visualization mathematics references the W3C Audio EQ Cookbook; see research.md. It does not reproduce proprietary plugin DSP.

The maintainer has not selected a repository-wide distribution license. These notes do not grant licenses for future SDKs/assets.
