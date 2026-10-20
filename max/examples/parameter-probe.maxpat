{
  "patcher": {
    "fileversion": 1,
    "rect": [
      0,
      0,
      680,
      370
    ],
    "boxes": [
      {
        "box": {
          "id": "help",
          "maxclass": "comment",
          "patching_rect": [
            20,
            15,
            610,
            40
          ],
          "text": "M0 PROTOTYPE: bind only after M4L initializes. Indices are examples. Raw host value; explicit rebind after reload."
        }
      },
      {
        "box": {
          "id": "bind",
          "maxclass": "message",
          "patching_rect": [
            20,
            70,
            140,
            22
          ],
          "text": "bind 0 0 1"
        }
      },
      {
        "box": {
          "id": "disconnect",
          "maxclass": "message",
          "patching_rect": [
            185,
            70,
            90,
            22
          ],
          "text": "disconnect"
        }
      },
      {
        "box": {
          "id": "value",
          "maxclass": "flonum",
          "patching_rect": [
            20,
            125,
            120,
            22
          ]
        }
      },
      {
        "box": {
          "id": "prepend",
          "maxclass": "newobj",
          "patching_rect": [
            20,
            165,
            100,
            22
          ],
          "text": "prepend write"
        }
      },
      {
        "box": {
          "id": "defer",
          "maxclass": "newobj",
          "patching_rect": [
            220,
            205,
            65,
            22
          ],
          "text": "deferlow"
        }
      },
      {
        "box": {
          "id": "js",
          "maxclass": "newobj",
          "patching_rect": [
            220,
            250,
            205,
            22
          ],
          "text": "js parameter-probe.js"
        }
      },
      {
        "box": {
          "id": "print",
          "maxclass": "newobj",
          "patching_rect": [
            450,
            295,
            120,
            22
          ],
          "text": "print M0-status"
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": [
            "bind",
            0
          ],
          "destination": [
            "defer",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "disconnect",
            0
          ],
          "destination": [
            "defer",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "value",
            0
          ],
          "destination": [
            "prepend",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend",
            0
          ],
          "destination": [
            "defer",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "defer",
            0
          ],
          "destination": [
            "js",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "js",
            0
          ],
          "destination": [
            "value",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "js",
            1
          ],
          "destination": [
            "print",
            0
          ]
        }
      }
    ]
  }
}
