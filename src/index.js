// quilt-flow — a sketch of a visual editor for Quilt sheets.
//
// The thesis: the spreadsheet was the killer app of the 1980s
// because it made reactive programming visual. You see the
// formulas, you see the values, you see the dependencies. No
// one ever had to learn a "programming language" to use a
// spreadsheet.
//
// quilt-flow is the same idea, but for the full cell model.
// Drag a value cell onto the canvas. Drag a formula cell.
// Draw a wire from the value to the formula. Type a formula.
// See the result. Drag a listener cell to fire on changes.
//
// The output is a YAML/JSON sheet that any Quilt runtime can
// load. The editor itself is a Quilt sheet (the cells that
// represent the editor state are themselves Quilt cells).
//
// This is a sketch. The full implementation is a Vue/Svelte/
// React component, but the data model is the interesting part.

// A node in the visual graph. Each node is a cell.
export class Node {
  constructor({ id, x, y, kind = 'value', label = '', config = {} }) {
    this.id = id;
    this.x = x;  // undefined means "needs layout"
    this.y = y;
    this.kind = kind;
    this.label = label;
    this.config = config;
    // Port ids: each node has 1 input (except value) and 1 output.
    this.inputPort = `${id}::in`;
    this.outputPort = `${id}::out`;
  }
}

// A wire connects an output port to an input port.
export class Wire {
  constructor({ from, to, label = '' }) {
    this.from = from;
    this.to = to;
    this.label = label;
  }
}

// The graph: a set of nodes and wires.
export class Graph {
  constructor() {
    this.nodes = new Map();
    this.wires = [];
  }

  addNode(node) { this.nodes.set(node.id, node); return this; }
  removeNode(id) {
    this.nodes.delete(id);
    this.wires = this.wires.filter(w => !w.from.startsWith(id) && !w.to.startsWith(id));
  }
  connect(wire) { this.wires.push(wire); return this; }
  disconnect(from, to) { this.wires = this.wires.filter(w => !(w.from === from && w.to === to)); }

  /** Convert the graph to a Quilt sheet (YAML/JSON). */
  toSheet({ id = 'untitled', title = 'Untitled sheet' } = {}) {
    const cells = [];
    for (const node of this.nodes.values()) {
      const cell = this._nodeToCell(node);
      if (cell) cells.push(cell);
    }
    return { id, title, version: '0.2.0', cells };
  }

  _nodeToCell(node) {
    const inputs = this.wires
      .filter(w => w.to === node.inputPort)
      .map(w => this.nodes.get(w.from.split('::')[0]));
    const base = { id: node.id, kind: node.kind };
    switch (node.kind) {
      case 'value':
        return { ...base, value: node.config.value };
      case 'formula':
        if (inputs.length > 0) {
          return { ...base, expr: node.config.expr, deps: inputs.map(n => n.id) };
        }
        return { ...base, expr: node.config.expr };
      case 'sensor':
        return { ...base, source: node.config.source, default: node.config.default };
      case 'api':
        return { ...base, endpoint: node.config.endpoint, method: node.config.method || 'GET' };
      case 'listener':
        return { ...base, watch: node.config.watch, condition: node.config.condition, action: node.config.action };
      case 'router':
        return { ...base, rules: node.config.rules || [] };
      case 'program':
        return { ...base, code: node.config.code };
      case 'io':
        return { ...base, port: node.config.port, direction: node.config.direction || 'out' };
    }
    return base;
  }
}

// The cell palette — what kinds of cells the user can drop on the canvas.
export const PALETTE = [
  { kind: 'value',    label: 'Value',    icon: '📦', color: '#7ec699',
    description: 'A static value. Number, string, boolean, list, or object.' },
  { kind: 'formula',  label: 'Formula',  icon: 'ƒ',   color: '#5fa8d3',
    description: 'A reactive expression. Recomputes when its dependencies change.' },
  { kind: 'program',  label: 'Program',  icon: '▶',   color: '#bb7ec6',
    description: 'A small expression that runs. Can use runtime.get/set/call.' },
  { kind: 'sensor',   label: 'Sensor',   icon: '👁',   color: '#c6a87e',
    description: 'A named input source. Polled periodically.' },
  { kind: 'api',      label: 'API',      icon: '🌐',  color: '#c67e7e',
    description: 'An outbound call. Returns a value.' },
  { kind: 'listener', label: 'Listener', icon: '🔔', color: '#c6c67e',
    description: 'Fires when a watched cell changes.' },
  { kind: 'router',   label: 'Router',   icon: '↪',   color: '#7ec6c6',
    description: 'Caller-context-aware dispatch.' },
  { kind: 'io',       label: 'I/O',      icon: '🔌',  color: '#aaaaaa',
    description: 'An outbound port to a physical device.' },
];

// The visual layout algorithm: a simple grid + force-directed
// refinement. Real impl: d3-force, elk.js, or a custom layout.
export function layoutGraph(graph) {
  const nodes = [...graph.nodes.values()];
  if (nodes.length === 0) return;
  // Start with a grid: 200px spacing.
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  nodes.forEach((n, i) => {
    n.x = (i % cols) * 200 + 50;
    n.y = Math.floor(i / cols) * 120 + 50;
  });
  // Force-directed refinement: pull connected nodes closer.
  for (let iter = 0; iter < 50; iter++) {
    for (const a of nodes) {
      let fx = 0, fy = 0;
      for (const b of nodes) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx*dx + dy*dy + 0.01;
        const d = Math.sqrt(d2);
        // Repel if too close.
        if (d < 150) {
          fx += (dx / d) * (150 - d) * 0.1;
          fy += (dy / d) * (150 - d) * 0.1;
        }
      }
      // Pull connected nodes closer (only if they're already nearby).
      for (const w of graph.wires) {
        const other = w.from.startsWith(a.id)
          ? graph.nodes.get(w.to.split('::')[0])
          : w.to.startsWith(a.id) ? graph.nodes.get(w.from.split('::')[0]) : null;
        if (other) {
          const ddx = other.x - a.x;
          const ddy = other.y - a.y;
          const dd = Math.sqrt(ddx*ddx + ddy*ddy);
          if (dd > 200) {
            // Pull together only if far.
            fx += ddx * 0.005;
            fy += ddy * 0.005;
          }
        }
      }
      a.x += fx;
      a.y += fy;
    }
  }
}

// Auto-layout nodes that don't have positions.
export function ensureLayout(graph) {
  let needsLayout = false;
  for (const n of graph.nodes.values()) {
    if (n.x === undefined || n.y === undefined) {
      needsLayout = true;
      break;
    }
  }
  if (needsLayout) layoutGraph(graph);
}

// A "view" of the graph as a string (for debugging or ASCII rendering).
export function toAscii(graph, width = 80, height = 24) {
  ensureLayout(graph);
  const grid = Array.from({ length: height }, () => Array(width).fill(' '));
  for (const node of graph.nodes.values()) {
    const x = Math.round(node.x / 10);
    const y = Math.round(node.y / 10);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const c = (node.label[0] || node.id[0] || node.kind[0] || '?');
      grid[y][x] = c.toUpperCase();
    }
  }
  // Draw wires.
  for (const w of graph.wires) {
    const fromNode = graph.nodes.get(w.from.split('::')[0]);
    const toNode = graph.nodes.get(w.to.split('::')[0]);
    if (!fromNode || !toNode) continue;
    const x1 = Math.round(fromNode.x / 10);
    const y1 = Math.round(fromNode.y / 10);
    const x2 = Math.round(toNode.x / 10);
    const y2 = Math.round(toNode.y / 10);
    // Bresenham-ish line.
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (grid[y][x] === ' ') grid[y][x] = i === 0 || i === steps ? '●' : '─';
      }
    }
  }
  return grid.map(row => row.join('')).join('\n');
}

export default { Node, Wire, Graph, PALETTE, layoutGraph, toAscii };
