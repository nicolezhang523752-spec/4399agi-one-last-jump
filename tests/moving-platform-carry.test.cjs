const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const controller = fs.readFileSync('game/scripts/project/main.js', 'utf8');

function box(x, y, width, height, bottomOrigin = false) {
    return {
        x, y, width, height,
        getBoundingBox() {
            const left = this.x - this.width / 2;
            const top = this.y - (bottomOrigin ? this.height : this.height / 2);
            return {left, right: left + this.width, top, bottom: top + this.height};
        },
        testOverlap(other) {
            const a = this.getBoundingBox(), b = other.getBoundingBox();
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }
    };
}

async function game(layoutName, platformName, direction) {
    const platform = box(300, 300, 195, 62);
    const player = box(300, platform.getBoundingBox().top, 45, 45, true);
    const visual = {x: player.x, y: player.y, setAnimation() {}};
    const keys = new Set();
    const statics = [];
    const handlers = {};
    const classes = {
        Level1_Playerbox: {getFirstInstance: () => player},
        Level1_Player: {getFirstInstance: () => visual},
        Level1_Tilemap: {instances: () => statics},
        Level2Platform: {instances: () => platformName === 'Level2Platform' ? [platform] : []},
        MovingPlatformUp: {instances: () => platformName === 'MovingPlatformUp' ? [platform] : []},
        Movingblockup: {instances: () => platformName === 'Movingblockup' ? [platform] : []}
    };
    const runtime = {
        layout: {name: layoutName}, objects: classes, dt: 1 / 60,
        keyboard: {isKeyDown: key => keys.has(key)},
        addEventListener: (name, callback) => handlers[name] = callback
    };
    let startup;
    const window = {location: {origin: 'https://example.test'}, addEventListener() {}};
    window.parent = window;
    vm.runInNewContext(controller, {runOnStartup: callback => startup = callback, window});
    await startup(runtime);
    handlers.afteranylayoutstart();
    handlers.tick(); // establish the current top surface and prior Sine position
    const oldX = player.x, oldY = player.y;
    platform[direction] += 6; // greater than the old two-pixel ground probe
    handlers.tick();
    assert.equal(player[direction], (direction === 'x' ? oldX : oldY) + 6,
        `${layoutName} ${platformName} should carry ${direction}`);
    assert.equal(visual.x, player.x);
    assert.equal(visual.y, player.y);

    // A jump must detach before the next platform delta is applied.
    const jumpX = player.x, jumpY = player.y;
    platform[direction] += 6;
    keys.add('Space');
    handlers.tick();
    assert.equal(player.x, jumpX, `${layoutName} jump should not inherit horizontal carry`);
    assert.ok(player.y < jumpY, `${layoutName} jump should move upward`);

    // Leaving the top face must clear the support before another Sine step.
    keys.clear();
    handlers.afteranylayoutstart();
    player.x = platform.x;
    player.y = platform.getBoundingBox().top;
    handlers.tick();
    player.x = platform.getBoundingBox().right + player.width;
    const offX = player.x;
    platform.x += 6;
    handlers.tick();
    assert.equal(player.x, offX, `${layoutName} must stop carry after walking off`);

    // A player below the platform must not be attached to its underside.
    handlers.afteranylayoutstart();
    player.x = platform.x;
    player.y = platform.getBoundingBox().bottom + player.height;
    handlers.tick();
    const belowY = player.y;
    platform.y += 6;
    handlers.tick();
    assert.ok(player.y - belowY < 2, `${layoutName} must not attach to the underside`);

    // The carry must still respect an ordinary static solid beside the player.
    handlers.afteranylayoutstart();
    player.x = platform.x;
    player.y = platform.getBoundingBox().top;
    const wall = box(player.x + player.width / 2 + 22, player.y - 20, 40, 60);
    statics.push(wall);
    handlers.tick();
    const wallX = player.x;
    platform.x += 6;
    handlers.tick();
    assert.ok(player.x - wallX <= 2, `${layoutName} carry must not pass through a static solid`);
}

(async () => {
    for (const layout of ['Level2', 'Level3']) {
        for (const name of ['Level2Platform', 'MovingPlatformUp', 'Movingblockup']) {
            for (const direction of ['x', 'y']) await game(layout, name, direction);
        }
    }
    console.log('Level 2 and Level 3 carry and jump checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
