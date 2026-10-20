# Local device shell

The development installation uses wrapper.amxd, a locally authored device saved by licensed Max. It is ignored by Git. Generation copies its bytes unchanged and places the runtime and project files alongside it. No AMXD encoder or container rewriting is implemented.

The shell must open in Presentation, contain the controller.js and renderer.js objects and manifest initialization wiring, keep visible objects within Live's 169-pixel panel, and omit node.script. The exporter validates these requirements before producing a bundle. The current local shell was checked in Live for Morph control. Generated-bundle loading is a separate host check.

This is development setup, not a producer setup step. A public release still needs an approved distributable shell, dependency portability checks, and automatic plugin metadata discovery. Missing or incompatible shells stop generation explicitly; source files are not presented as completed devices.
