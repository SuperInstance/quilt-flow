# quilt-flow

> Visual editor for Quilt sheets. Drag-and-drop cell wiring, like Scratch but for cells.

A sketch. The data model is stable; the UI is the easy part.

## The thesis

The spreadsheet was the killer app of the 1980s because it made
reactive programming **visual**. You see the formulas, the values,
the dependencies. No one ever had to learn a programming language
to use a spreadsheet.

`quilt-flow` is the same idea, but for the full Quilt cell model.
Drag a value cell onto the canvas. Drag a formula cell. Draw a wire
from the value to the formula. Type a formula. See the result.
Drag a listener cell to fire on changes.

The output is a YAML/JSON sheet that any Quilt runtime can load.
The editor itself is a Quilt sheet (the cells that represent the
editor state are themselves Quilt cells).

## The data model

A graph has:

- **Nodes** — each is a cell. Has an id, a position (x, y), a kind
  (value, formula, program, sensor, api, listener, router, io), and
  a config object (the cell's specific fields).
- **Wires** — connect an output port of one node to an input port
  of another. Each wire has a `from` and a `to` (port ids).

```
+----------+        +-----------+        +----------+
|  Value   |──wire──▶  Formula  |──wire──▶  Formula  |
+----------+        +-----------+        +----------+
```

The graph is what the user sees. The runtime sees the equivalent
sheet:

```yaml
id: my-sheet
title: "My Sheet"
cells:
  - id: input
    kind: value
    value: 10
  - id: input2
    kind: value
    value: 20
  - id: sum
    kind: formula
    expr: input + input2
  - id: doubled
    kind: formula
    expr: sum * 2
```

## API

```js
import { Node, Wire, Graph, PALETTE, layoutGraph, toAscii } from 'quilt-flow';

const g = new Graph();

// Add cells by dragging from the palette.
g.addNode(new Node({ id: 'temperature', kind: 'sensor', config: { source: 'dht22' } }));
g.addNode(new Node({ id: 'humidity',    kind: 'sensor', config: { source: 'dht22' } }));
g.addNode(new Node({ id: 'forecast',    kind: 'formula', config: { expr: 'temperature * 1.8 + 32' } }));
g.addNode(new Node({ id: 'alert',       kind: 'listener', config: { watch: 'forecast', condition: 'forecast > 90', action: '...' } }));

// Wire them together.
g.connect(new Wire({ from: 'temperature::out', to: 'forecast::in' }));

// Convert to a Quilt sheet.
const sheet = g.toSheet({ id: 'weather', title: 'Weather' });

// Auto-layout.
layoutGraph(g);

// ASCII render (for terminals).
console.log(toAscii(g));
```

## The palette

8 cell kinds. Each is a card the user can drag onto the canvas:

| Kind | Icon | Color | Description |
| --- | --- | --- | --- |
| `value` | 📦 | green | A static value |
| `formula` | ƒ | blue | A reactive expression |
| `program` | ▶ | purple | A small expression that runs |
| `sensor` | 👁 | tan | A polled input source |
| `api` | 🌐 | red | An outbound call |
| `listener` | 🔔 | yellow | Fires on changes |
| `router` | ↪ | cyan | Caller-context-aware dispatch |
| `io` | 🔌 | gray | An outbound port to a device |

## How a real UI would work

The full implementation is a Vue 3 (or Svelte, or React) component.
The state is a Quilt sheet. The user's drag-and-drop actions are
sheets operations: `addCell`, `removeCell`, `connect`, `disconnect`.
The runtime is the same one that runs the cells, applied to the
editor's own cells.

A useful pattern: the editor itself is a Quilt sheet. The "currently
selected cell" is a value cell. The "current tool" is a value cell.
A listener cell listens for changes to those values and re-renders
the canvas. The whole editor is a reactive system.

## Test

```bash
node test.mjs
```

8 tests pass. Cover: node creation, graph mutation, wires, sheet
conversion, palette, layout, ASCII rendering.

## Status

Sketch only. The data model is the interesting part. The UI is a
standard drag-and-drop canvas with a node palette. A single
developer can build the full UI in a week.

## What it unlocks

- **Non-programmers can build reactive systems.** The user never
  sees `kind: formula` or `expr: ...` — they see "drag this, drag
  that, type this, draw a line."
- **Real-time collaboration.** Two users editing the same graph;
  the cells sync via `quilt-mesh`; both see each other's changes
  in real time.
- **A library of pre-built cells.** "Drag a `mortgage` cell onto
  your sheet, wire it to your `income` and `debts`, get a monthly
  payment." The cell model is the API.
- **A library of pre-built sheets.** "Drag a `home budget`
  template onto your sheet." The sheet is a starting point.
- **Graphs as first-class artifacts.** A graph is a file, like
  an image. You can email a graph. You can version a graph. You
  can fork a graph.

## Related

- [Quilt (TypeScript)](https://github.com/SuperInstance/quilt) — the
  reactive runtime.
- [Quilt (Rust)](https://github.com/SuperInstance/quilt-rust) — the
  desktop runtime.
- [Quilt Live](https://github.com/SuperInstance/quilt-live) — the
  single-file browser runtime.
- [Quilt Mesh](https://github.com/SuperInstance/quilt-mesh) — sync
  for collaboration.
- [Quilt 5-year roadmap](https://github.com/SuperInstance/quilt/blob/main/quilt-roadmap-2026.md).

## License

MIT.
