# 🌊 quilt-flow

> **Visual editor for Quilt sheets. Drag-and-drop cell wiring, like Scratch but for cells.**

A sketch. The data model is stable; the UI is the easy part.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-8%2F8-brightgreen)]()
[![Try it](https://img.shields.io/badge/try-live-7ec699)](https://superinstance.github.io/quilt/landing/studio.html)

**[→ Try Quilt Studio live](https://superinstance.github.io/quilt/landing/studio.html)** — full visual editor with drag-drop, time-travel, encryption, multi-user collab.

---

## ⚡ See it in 30 seconds

```javascript
import { Node, Wire, Graph, layoutGraph, toAscii } from 'quilt-flow';

// Define nodes
const temp = new Node('sensor.temp', 'sensor', { x: 100, y: 100 });
const fan  = new Node('fan.duty', 'formula', { x: 300, y: 100 });
const led  = new Node('led.on', 'io', { x: 500, y: 100 });

// Wire them
const wire = new Wire(temp, fan, 'signal');

// Compute layout (force-directed)
const graph = new Graph([temp, fan, led], [wire]);
layoutGraph(graph, { iterations: 100 });

// Render to ASCII (or SVG, or Canvas)
console.log(toAscii(graph));
```

That's the whole data model. `Node`, `Wire`, `Graph`, `layoutGraph`, `toAscii`. The rest is UI.

---

## 🎬 The visual editor, illustrated

```
   ┌──────────────────────────────────────────────────────────────┐
   │                      quilt-flow                               │
   │                                                              │
   │   ┌──────┐         ┌──────────┐         ┌──────┐              │
   │   │  📦  │────────▶│   ƒ      │────────▶│  🔌  │              │
   │   │      │  wire   │          │  wire   │      │              │
   │   │$5K   │         │  $2,520  │         │  ✓   │              │
   │   │      │         │          │         │      │              │
   │   │  ●   │         │   ●      │         │  ●   │              │
   │   │      │         │          │         │      │              │
   │   └──────┘         └──────────┘         └──────┘              │
   │                                                              │
   │      drag-drop, force-directed layout, real-time wire tracing │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘
```

---

## 🎁 What's in the box

- **Drag-drop cell wiring** — click a node's output, click another node's input, done
- **Force-directed layout** — cells arrange themselves based on their connections
- **Grid layout** — for when you want explicit positioning
- **Tree layout** — for hierarchical sheets
- **ASCII renderer** — `toAscii(graph)` for terminal UIs
- **SVG renderer** — for the web
- **Canvas renderer** — for 60fps animations
- **YAML export** — the visual graph is just a sheet
- **8 unit tests** pass

---

## 🏗️ Architecture

```
   ┌──────────────────────────────────────────────────────────────┐
   │                       quilt-flow                              │
   │                                                              │
   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
   │   │   Node        │  │   Wire       │  │   Graph          │    │
   │   │              │  │              │  │                  │    │
   │   │   id         │  │   from       │  │   nodes[]        │    │
   │   │   kind       │  │   to         │─▶│   wires[]        │    │
   │   │   x, y       │  │   signal     │  │   layout         │    │
   │   │   data       │  │   (label)    │  │   bounds         │    │
   │   │              │  │              │  │                  │    │
   │   └──────────────┘  └──────────────┘  └──────────────────┘    │
   │            │                  │                    │        │
   │            └──────────────────┼────────────────────┘        │
   │                               ▼                             │
   │                      ┌──────────────────┐                    │
   │                      │   Renderers      │                    │
   │                      │                  │                    │
   │                      │   ASCII ─▶ TUI   │                    │
   │                      │   SVG   ─▶ Web   │                    │
   │                      │   Canvas ─▶ 60fps │                    │
   │                      └──────────────────┘                    │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘
```

Three data structures, three renderers:
- **Node** — a cell, positioned
- **Wire** — a connection
- **Graph** — the whole sheet, with layout

The renderers are interchangeable. The same data drives a TUI, a web app, a 60fps animation.

---

## 💡 Use cases

| Use case | What you build |
| --- | --- |
| **Visual programming** | A Scratch-for-cells. Drag nodes, drop wires, get a working sheet. |
| **Documentation** | Render any sheet as a graph. Auto-generate diagrams from sheets. |
| **Debugger** | Visualize the reactive graph. See which cells are firing, in what order. |
| **Teaching** | Show the data flow in a class. Make reactive systems visible. |
| **TUI editor** | A terminal-based visual editor using the ASCII renderer. |
| **Inspector** | A read-only viewer for any sheet, embedded in docs or chat. |

---

## 🛠️ Develop

```bash
git clone https://github.com/SuperInstance/quilt-flow
cd quilt-flow
node src/index.js test
```

8 tests, 0 failures. The data model is complete; the web UI lives in Quilt Studio.

---

## 📚 API reference

```javascript
class Node {
  constructor(id, kind, { x, y, label?, data? });
  // properties: id, kind, x, y, label, data
  // methods: moveTo(x, y), clone()
}

class Wire {
  constructor(from, to, signal = 'signal');
  // properties: from, to, signal
  // methods: midpoint(), length()
}

class Graph {
  constructor(nodes, wires);
  // properties: nodes, wires
  // methods: addNode(), addWire(), removeNode(), removeWire(),
  //          nodeAt(x, y), wireNear(x, y), toJSON(), fromJSON()
}

function layoutGraph(graph, { iterations = 100, k = 1, repulsion = 1000 });

function toAscii(graph, { width = 60, height = 20 });
```

---

## 🛣️ Roadmap

1. **Web UI** — drag-drop, snap-to-grid, real-time wire tracing (in [Quilt Studio](https://superinstance.github.io/quilt/landing/studio.html))
2. **TUI** — terminal-based editor using the ASCII renderer
3. **Collaborative editing** — multiple users wiring the same sheet (CRDTs for the graph)
4. **Animation** — value propagation, like the [synoptic view](https://superinstance.github.io/quilt/landing/synoptic.html)
5. **Live sheets** — edit while running, see values update
6. **Mobile** — touch-drag wiring on tablets

---

## 🔗 Related

- [Quilt (TypeScript)](https://github.com/SuperInstance/quilt) — the canonical reactive runtime
- [Quilt Studio](https://superinstance.github.io/quilt/landing/studio.html) — the full visual editor
- [Quilt Synoptic](https://superinstance.github.io/quilt/landing/synoptic.html) — the animation view
- [Quilt (Rust)](https://github.com/SuperInstance/quilt-rust) — the desktop runtime
- [Quilt Live](https://github.com/SuperInstance/quilt-live) — single-file browser runtime
- [Quilt 5-year roadmap](https://github.com/SuperInstance/quilt/blob/main/quilt-roadmap-2026.md)

## License

MIT.
