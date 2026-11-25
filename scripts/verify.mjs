import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createContext, Script } from 'node:vm';

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node scripts/verify.mjs path/to/index.html');
  process.exit(1);
}

const bytes = statSync(filename).size;
assert(bytes < 5_000_000, 'The HTML must be under 5,000,000 bytes.');
const html = readFileSync(filename, 'utf8');

const policyTag = html.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/i);
const policy = policyTag?.[0].match(/\bcontent="([^"]+)"/i)?.[1];
const firstCode = html.search(/<(?:script|style)\b/i);
assert(policy && (firstCode < 0 || policyTag.index < firstCode), 'Keep the Content Security Policy before the inline code.');

const directives = new Map();
for (const directive of policy.split(';')) {
  const [name, ...values] = directive.trim().toLowerCase().split(/\s+/);
  if (!name) continue;
  assert(!directives.has(name), 'Duplicate policy directive: ' + name);
  const source = values.join(' ');
  const acceptsInline = ['script-src', 'style-src'].includes(name) && source === "'unsafe-inline'";
  const acceptsData = ['img-src', 'font-src', 'media-src'].includes(name) && source === 'data:';
  assert(source === "'none'" || acceptsInline || acceptsData, 'Unexpected policy source for ' + name);
  directives.set(name, source);
}
assert.equal(directives.get('default-src'), "'none'", 'default-src must block external content.');
assert.equal(directives.get('form-action'), "'none'", 'form-action must block form submission.');
assert.equal(directives.get('base-uri'), "'none'", 'base-uri must block base URL changes.');

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
assert(scripts.length > 0, 'Expected inline vanilla JavaScript.');
assert(scripts.every(([, attrs]) => !/\bsrc\s*=|\btype\s*=/i.test(attrs)), 'Use classic inline scripts.');

let drawCalls = 0;
const drawCommands = ['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage'];
const paint = new Proxy({}, {
  get(target, name) {
    if (name in target) return target[name];
    if (drawCommands.includes(name)) return () => { drawCalls += 1; };
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => ({ addColorStop() {} });
    return () => {};
  },
});
const elements = new Map();
const listeners = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      width: 440, height: 560, textContent: '',
      addEventListener(type, callback) { listeners.set(id + ':' + type, callback); },
      setAttribute() {},
      getContext: () => paint,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 440, height: 560 }),
    });
  }
  return elements.get(id);
}

let queue = [];
const blockedRequest = () => { throw new Error('The game attempted a network request.'); };
const context = createContext({
  document: { getElementById: element },
  window: { addEventListener() {}, fetch: blockedRequest, XMLHttpRequest: blockedRequest, WebSocket: blockedRequest },
  requestAnimationFrame(callback) { queue.push(callback); },
  fetch: blockedRequest, XMLHttpRequest: blockedRequest, WebSocket: blockedRequest, EventSource: blockedRequest,
});
for (const [, , source] of scripts) new Script(source, { filename }).runInContext(context, { timeout: 1000 });
context.dispatchStart = () => listeners.get('start:click')?.();
new Script('dispatchStart()').runInContext(context, { timeout: 1000 });

const tick = new Script('for (const callback of animationCallbacks) callback(frameTime)');
for (let frame = 0; frame < 8; frame += 1) {
  assert(queue.length > 0, 'No animation was scheduled for frame ' + frame);
  context.animationCallbacks = queue;
  context.frameTime = frame * 16.67;
  queue = [];
  const callsBefore = drawCalls;
  tick.runInContext(context, { timeout: 1000 });
  assert(drawCalls > callsBefore, 'No canvas draw at frame ' + frame);
}

console.log(filename + ': ' + bytes + ' bytes, offline policy present, 8 Canvas frames rendered.');
