// 4399AGI modern movement controller
// Replaces legacy Platform/Solid behaviours using Construct's current scripting API.

runOnStartup(async runtime => {
    // The website shell can pause the real Construct runtime without reloading it.
    // Keep the bridge inside the project script, where the public runtime API exists.
    let shellPaused = false;
    let resumeTimeScale = 1;
    const shellOrigin = window.location.origin;
    function reportPauseState() {
        if (window.parent === window) return;
        window.parent.postMessage({type: "4399agi:pause-state", paused: shellPaused, gameTime: runtime.gameTime}, shellOrigin);
    }
    window.addEventListener("message", event => {
        if (event.source !== window.parent || event.origin !== shellOrigin) return;
        if (event.data?.type === "4399agi:get-pause-state") {
            reportPauseState();
            return;
        }
        if (event.data?.type !== "4399agi:set-pause") return;
        const nextPaused = event.data.paused === true;
        if (nextPaused !== shellPaused) {
            if (nextPaused) {
                resumeTimeScale = runtime.timeScale;
                runtime.timeScale = 0;
            } else {
                runtime.timeScale = resumeTimeScale;
            }
            shellPaused = nextPaused;
        }
        reportPauseState();
    });
    window.addEventListener("keydown", event => {
        if (event.repeat || !["Escape", "KeyP"].includes(event.code)) return;
        if (window.parent === window) return;
        event.preventDefault();
        window.parent.postMessage({type: "4399agi:toggle-pause"}, shellOrigin);
    }, true);
    if (window.parent !== window) window.parent.postMessage({type: "4399agi:pause-ready"}, shellOrigin);

    // A run is recorded only when Construct reaches its actual win/game-over
    // layouts. The export has no native Score variable, so derive one from
    // reached level, collected gold and the remaining timer on a win.
    let runId = null;
    let runActive = false;
    let runSeconds = 0;
    let furthestLevel = 0;
    let goldByLevel = [0, 0, 0];
    let lastTimeLeft = 0;
    function gameplayLevel(name) {
        const match = /^Level([1-3])$/.exec(name || "");
        return match ? Number(match[1]) : 0;
    }
    runtime.addEventListener("afteranylayoutstart", () => {
        const name = runtime.layout?.name || "";
        const level = gameplayLevel(name);
        if (level === 1) {
            runId = crypto.randomUUID();
            runActive = true;
            runSeconds = 0;
            furthestLevel = 1;
            goldByLevel = [0, 0, 0];
            lastTimeLeft = 0;
        } else if (level && runActive) {
            furthestLevel = Math.max(furthestLevel, level);
        } else if ((name === "WinScreen" || name === "Gameover Screen") && runActive) {
            runActive = false;
            const won = name === "WinScreen";
            const totalGold = goldByLevel.reduce((total, gold) => total + gold, 0);
            const score = furthestLevel * 1000 + totalGold * 100 + (won ? 500 + lastTimeLeft * 5 : 0);
            if (window.parent !== window) window.parent.postMessage({
                type: "4399agi:run-complete",
                run_id: runId,
                score: Math.max(0, Math.round(score)),
                level_reached: furthestLevel,
                completion_time: Math.max(0, Math.round(runSeconds * 1000))
            }, shellOrigin);
        }
    });
    runtime.addEventListener("tick", () => {
        if (!runActive || shellPaused) return;
        const level = gameplayLevel(runtime.layout?.name);
        if (!level) return;
        runSeconds += Math.max(0, runtime.dt);
        const gold = Number(runtime.globalVars.Goldcollected);
        if (Number.isFinite(gold)) goldByLevel[level - 1] = Math.max(goldByLevel[level - 1], Math.max(0, Math.floor(gold)));
        const timeLeft = Number(runtime.globalVars.Timeleft);
        if (Number.isFinite(timeLeft)) lastTimeLeft = Math.max(0, Math.floor(timeLeft));
    });
    const MAX_SPEED = 330;
    const ACCEL = 1500;
    const DECEL = 1500;
    const JUMP_SPEED = 650;
    const GRAVITY = 1500;
    const MAX_FALL = 1000;
    const MAX_STEP = 4;

    let vx = 0;
    let vy = 0;
    let grounded = false;
    let jumpWasDown = false;
    let lastLayout = "";
    let lastAnim = "";
    let supportPlatform = null;
    const platformPositions = new Map();
    const MOVING_PLATFORM_NAMES = ["Level2Platform", "MovingPlatformUp", "Movingblockup"];

    function isGameLayout(runtime) {
        const n = runtime.layout?.name || "";
        return n === "Level1" || n === "Level2" || n === "Level3";
    }

    function getPlayer(runtime) {
        return runtime.objects.Level1_Playerbox?.getFirstInstance() || null;
    }

    function getVisual(runtime) {
        return runtime.objects.Level1_Player?.getFirstInstance() || null;
    }

    function getSolids(runtime) {
        const list = [];
        const names = ["Level1_Tilemap", "Level2Platform", "MovingPlatformUp", "Movingblockup"];
        for (const name of names) {
            const cls = runtime.objects[name];
            if (!cls) continue;
            for (const inst of cls.instances()) list.push(inst);
        }
        return list;
    }

    function getMovingPlatforms(runtime) {
        const platforms = [];
        for (const name of MOVING_PLATFORM_NAMES) {
            const cls = runtime.objects[name];
            if (cls) for (const inst of cls.instances()) platforms.push(inst);
        }
        return platforms;
    }

    // Check the feet against the top face, rather than using a generic overlap:
    // that would also attach the player to the sides or underside of a platform.
    function standsOn(player, platform, platformDx = 0, platformDy = 0) {
        const feet = player.getBoundingBox();
        const surface = platform.getBoundingBox();
        const top = surface.top - platformDy;
        return feet.bottom >= top - 3 && feet.bottom <= top + 1 &&
            feet.right > surface.left - platformDx + 2 &&
            feet.left < surface.right - platformDx - 2;
    }

    function findMovingSupport(player, platforms) {
        return platforms.find(platform => standsOn(player, platform)) || null;
    }

    function overlapsAny(player, solids) {
        for (const s of solids) {
            if (s && player.testOverlap(s)) return true;
        }
        return false;
    }

    // Move one axis in small steps to avoid tunnelling through thin platforms.
    function moveAxis(player, solids, amount, axis) {
        if (!amount) return false;
        const count = Math.max(1, Math.ceil(Math.abs(amount) / MAX_STEP));
        const step = amount / count;
        let hit = false;
        for (let i = 0; i < count; ++i) {
            const old = axis === "x" ? player.x : player.y;
            if (axis === "x") player.x += step;
            else player.y += step;
            if (overlapsAny(player, solids)) {
                if (axis === "x") player.x = old;
                else player.y = old;
                hit = true;
                break;
            }
        }
        return hit;
    }

    function checkGrounded(player, solids) {
        const y = player.y;
        player.y = y + 2;
        const result = overlapsAny(player, solids);
        player.y = y;
        return result;
    }

    function approach(value, target, amount) {
        if (value < target) return Math.min(value + amount, target);
        if (value > target) return Math.max(value - amount, target);
        return value;
    }

    function setAnim(visual, name) {
        if (!visual || lastAnim === name) return;
        try {
            visual.setAnimation(name, "beginning");
            lastAnim = name;
        } catch (_) {
            // If an animation was renamed in the editor, leave the current one alone.
        }
    }

    runtime.addEventListener("afteranylayoutstart", e => {
        if (!isGameLayout(runtime)) return;
        vx = 0;
        vy = 0;
        grounded = false;
        jumpWasDown = false;
        lastAnim = "";
        lastLayout = runtime.layout.name;
        supportPlatform = null;
        platformPositions.clear();
    });

    runtime.addEventListener("tick", () => {
        if (shellPaused) return;
        if (!isGameLayout(runtime)) return;
        const player = getPlayer(runtime);
        if (!player) return;
        const visual = getVisual(runtime);
        const solids = getSolids(runtime);
        const movingPlatforms = runtime.layout.name === "Level1" ? [] : getMovingPlatforms(runtime);
        const dt = Math.min(runtime.dt, 1 / 30);

        if (runtime.layout.name !== lastLayout) {
            vx = 0; vy = 0; grounded = false; jumpWasDown = false; lastAnim = "";
            supportPlatform = null;
            platformPositions.clear();
            lastLayout = runtime.layout.name;
        }

        // Construct ticks Sine before this callback. Compare its current position
        // with the previous tick so both horizontal and vertical Sine motion carry.
        const platformDeltas = new Map();
        for (const platform of movingPlatforms) {
            const previous = platformPositions.get(platform);
            const dx = previous ? platform.x - previous.x : 0;
            const dy = previous ? platform.y - previous.y : 0;
            platformDeltas.set(platform, {dx, dy});
            platformPositions.set(platform, {x: platform.x, y: platform.y});
        }
        for (const platform of platformPositions.keys()) {
            if (!platformDeltas.has(platform)) platformPositions.delete(platform);
        }

        const left = runtime.keyboard.isKeyDown("ArrowLeft") || runtime.keyboard.isKeyDown("KeyA");
        const right = runtime.keyboard.isKeyDown("ArrowRight") || runtime.keyboard.isKeyDown("KeyD");
        const jump = runtime.keyboard.isKeyDown("ArrowUp") || runtime.keyboard.isKeyDown("Space") || runtime.keyboard.isKeyDown("KeyW");

        // Horizontal acceleration/deceleration matching the old Platform settings.
        let target = 0;
        if (left && !right) target = -MAX_SPEED;
        else if (right && !left) target = MAX_SPEED;

        if (target !== 0) vx = approach(vx, target, ACCEL * dt);
        else vx = approach(vx, 0, DECEL * dt);

        const priorDelta = platformDeltas.get(supportPlatform);
        const stillSupported = priorDelta &&
            standsOn(player, supportPlatform, priorDelta.dx, priorDelta.dy);
        if (!stillSupported) supportPlatform = null;
        grounded = !!supportPlatform || checkGrounded(player, solids);
        if (jump && !jumpWasDown && grounded) {
            vy = -JUMP_SPEED;
            grounded = false;
            supportPlatform = null;
        }
        jumpWasDown = jump;

        if (supportPlatform) {
            const {dx, dy} = platformDeltas.get(supportPlatform);
            // Ignore the supporting platform while following it: on an upward
            // tick it may already overlap the player's old position. Other
            // solids still stop the carry, so walls and ceilings remain solid.
            const otherSolids = solids.filter(solid => solid !== supportPlatform);
            moveAxis(player, otherSolids, dx, "x");
            moveAxis(player, otherSolids, dy, "y");
        }

        vy = Math.min(vy + GRAVITY * dt, MAX_FALL);

        const hitX = moveAxis(player, solids, vx * dt, "x");
        if (hitX) vx = 0;

        const fallingBefore = vy > 0;
        const hitY = moveAxis(player, solids, vy * dt, "y");
        if (hitY) {
            if (fallingBefore) grounded = true;
            vy = 0;
        }
        supportPlatform = findMovingSupport(player, movingPlatforms);
        grounded = checkGrounded(player, solids) || !!supportPlatform;

        // Keep the visible character synced even if event execution order changes.
        if (visual) {
            visual.x = player.x;
            visual.y = player.y;
            if (!grounded) setAnim(visual, "Jump");
            else if (Math.abs(vx) > 20) setAnim(visual, "Walk");
            else setAnim(visual, "Idle");
        }
    });
});
