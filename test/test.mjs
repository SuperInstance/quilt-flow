import { Node, Wire, Graph, PALETTE, layoutGraph, toAscii } from '../src/index.js';

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓', name); pass++; }
  catch (e) { console.log('  ✗', name, ':', e.message); fail++; }
}
function eq(a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

test('create a node', () => {
  const n = new Node({ id: 'a', kind: 'value', config: { value: 42 } });
  eq(n.id, 'a');
  eq(n.kind, 'value');
  eq(n.config.value, 42);
});

test('create a graph and add nodes', () => {
  const g = new Graph();
  g.addNode(new Node({ id: 'a', kind: 'value', config: { value: 10 } }));
  g.addNode(new Node({ id: 'b', kind: 'value', config: { value: 20 } }));
  g.addNode(new Node({ id: 'sum', kind: 'formula', config: { expr: 'a + b' } }));
  eq(g.nodes.size, 3);
});

test('connect nodes with a wire', () => {
  const g = new Graph();
  const a = new Node({ id: 'a', kind: 'value' });
  const sum = new Node({ id: 'sum', kind: 'formula' });
  g.addNode(a).addNode(sum);
  g.connect(new Wire({ from: a.outputPort, to: sum.inputPort }));
  eq(g.wires.length, 1);
});

test('remove node removes its wires too', () => {
  const g = new Graph();
  const a = new Node({ id: 'a' });
  const b = new Node({ id: 'b' });
  g.addNode(a).addNode(b);
  g.connect(new Wire({ from: a.outputPort, to: b.inputPort }));
  g.removeNode('a');
  eq(g.wires.length, 0);
  eq(g.nodes.size, 1);
});

test('graph converts to a Quilt sheet', () => {
  const g = new Graph();
  const a = new Node({ id: 'a', kind: 'value', config: { value: 10 } });
  const b = new Node({ id: 'b', kind: 'value', config: { value: 20 } });
  const sum = new Node({ id: 'sum', kind: 'formula', config: { expr: 'a + b' } });
  g.addNode(a).addNode(b).addNode(sum);
  g.connect(new Wire({ from: a.outputPort, to: sum.inputPort }));
  g.connect(new Wire({ from: b.outputPort, to: sum.inputPort }));
  const sheet = g.toSheet({ id: 'add', title: 'Add two numbers' });
  eq(sheet.id, 'add');
  eq(sheet.cells.length, 3);
  const sumCell = sheet.cells.find(c => c.id === 'sum');
  eq(sumCell.kind, 'formula');
  eq(sumCell.expr, 'a + b');
});

test('palette has 8 cell kinds', () => {
  eq(PALETTE.length, 8);
});

test('layout positions all nodes', () => {
  const g = new Graph();
  for (let i = 0; i < 9; i++) {
    g.addNode(new Node({ id: `n${i}` }));
  }
  layoutGraph(g);
  for (const n of g.nodes.values()) {
    if (typeof n.x !== 'number' || typeof n.y !== 'number') {
      throw new Error(`Node ${n.id} has no position`);
    }
  }
});

test('ASCII rendering produces a non-empty string', () => {
  const g = new Graph();
  const a = new Node({ id: 'a', kind: 'value' });
  const b = new Node({ id: 'b', kind: 'formula' });
  g.addNode(a).addNode(b);
  g.connect(new Wire({ from: a.outputPort, to: b.inputPort }));
  const ascii = toAscii(g, 60, 12);
  if (typeof ascii !== 'string' || ascii.length === 0) {
    throw new Error('Empty ASCII render');
  }
  if (!ascii.includes('A') || !ascii.includes('B')) {
    throw new Error('Missing node labels in ASCII render');
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
