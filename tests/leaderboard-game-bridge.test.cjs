const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function startBridge() {
  const listeners = new Map();
  const windowListeners = new Map();
  const messages = [];
  const parent = { postMessage: message => messages.push(message) };
  const window = {
    location: { origin: 'https://example.test' },
    parent,
    addEventListener: (name, handler) => windowListeners.set(name, handler)
  };
  const runtime = {
    layout: { name: 'TitleScreen' },
    globalVars: { Goldcollected: 0, Timeleft: 120 },
    dt: 0,
    timeScale: 1,
    keyboard: { isKeyDown: () => false },
    objects: {},
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(handler);
    }
  };
  let startup;
  vm.runInNewContext(fs.readFileSync('game/scripts/project/main.js', 'utf8'), {
    runOnStartup: callback => { startup = callback; },
    window,
    crypto: { randomUUID: () => '11111111-1111-4111-8111-111111111111' },
    Map, Math, Number, String, Set
  });
  await startup(runtime);
  function emit(name) { for (const handler of listeners.get(name) || []) handler(); }
  function layout(name) { runtime.layout.name = name; emit('afteranylayoutstart'); }
  runtime.goToLayout = layout;
  function command(type) { windowListeners.get('message')({ source: parent, origin: window.location.origin, data: { type } }); }
  function tick(seconds, gold, remaining) {
    runtime.dt = seconds;
    runtime.globalVars.Goldcollected = gold;
    runtime.globalVars.Timeleft = remaining;
    emit('tick');
  }
  return { runtime, messages, layout, tick, command };
}

(async () => {
  const game = await startBridge();
  game.layout('Level1');
  game.tick(1, 5, 80);
  game.tick(1, 3, 79); // Gold can reset, but the run keeps the level maximum.
  game.layout('Level2');
  game.tick(2, 3, 70);
  game.layout('WinScreen');
  const results = game.messages.filter(item => item.type === '4399agi:run-complete');
  assert.equal(results.length, 1);
  assert.equal(results[0].score, 3650);
  assert.equal(results[0].level_reached, 2);
  assert.equal(results[0].completion_time, 4000);
  game.layout('WinScreen');
  assert.equal(game.messages.filter(item => item.type === '4399agi:run-complete').length, 1);
  const early = await startBridge();
  early.layout('Level1');
  early.tick(2, 1, 118);
  early.command('4399agi:end-run');
  const earlyResults = early.messages.filter(item => item.type === '4399agi:run-complete');
  assert.equal(earlyResults.length, 1);
  assert.equal(earlyResults[0].score, 1100);
  assert.equal(earlyResults[0].level_reached, 1);
  early.command('4399agi:end-run');
  assert.equal(early.messages.filter(item => item.type === '4399agi:run-complete').length, 1);
  const fallback = await startBridge();
  fallback.runtime.layout.name = 'Level1'; // Runtime may enter a layout before the layout-start observer fires.
  fallback.tick(1, 0, 119);
  assert.equal(fallback.messages.filter(item => item.type === '4399agi:run-started').length, 1);
  fallback.command('4399agi:end-run');
  assert.equal(fallback.messages.filter(item => item.type === '4399agi:run-complete').length, 1);
  console.log('game result bridge: passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
