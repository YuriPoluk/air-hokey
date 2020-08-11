const RENDER_DELAY = 35;

const gameUpdates: any[] = [];
let collisions: any[] = [];
let gameStart = 0;
let firstServerTimestamp = 0;

export function initState() {
    gameStart = 0;
    firstServerTimestamp = 0;
    collisions = [];
}

export function getCurrentCollisions() {
    let serverTime = currentServerTime();
    let collisionsHappened = collisions.filter(collision => {
        return collision.t <= serverTime
    });
    collisions = collisions.filter(collision => {
        return collision.t > serverTime;
    });

    return collisionsHappened;
}

export function processGameUpdate(update: any) {
    if (!firstServerTimestamp) {
        firstServerTimestamp = update.t;
        gameStart = Date.now();
    }
    gameUpdates.push(update);
    if(update.collisions.length) {
        for(let collision of update.collisions) {
            collisions.push({
                t: update.t,
                data: collision
            });
        }
    }

    // Keep only one game update before the current server time
    const base = getBaseUpdate();
    if (base > 0) {
        gameUpdates.splice(0, base);
    }
}

function currentServerTime() {
    return firstServerTimestamp + (Date.now() - gameStart) - RENDER_DELAY;
}

// Returns the index of the base update, the first game update before
// current server time, or -1 if N/A.
function getBaseUpdate() {
    const serverTime = currentServerTime();
    for (let i = gameUpdates.length - 1; i >= 0; i--) {
        if (gameUpdates[i].t <= serverTime) {
            return i;
        }
    }
    return -1;
}

// Returns { me, others, bullets }
export function getCurrentState() {
    if (!firstServerTimestamp) {
        return {};
    }

    const base = getBaseUpdate();
    const serverTime = currentServerTime();

    // If base is the most recent update we have, use its state.
    // Otherwise, interpolate between its state and the state of (base + 1).
    if (base < 0 || base === gameUpdates.length - 1) {
        return gameUpdates[gameUpdates.length - 1];
    } else {
        const baseUpdate = gameUpdates[base];
        const next = gameUpdates[base + 1];
        const ratio = (serverTime - baseUpdate.t) / (next.t - baseUpdate.t);
        return {
            player1: interpolateObject(baseUpdate.player1, next.player1, ratio),
            player2: interpolateObject(baseUpdate.player2, next.player2, ratio),
            puck: interpolateObject(baseUpdate.puck, next.puck, ratio),
        };
    }
}

function interpolateObject(object1: any, object2: any, ratio: number) {
    if (!object2) {
        return object1;
    }

    const interpolated = {} as any;
    Object.keys(object1).forEach(key => {
        interpolated[key] = object1[key] + (object2[key] - object1[key]) * ratio;
    });
    return interpolated;
}

function interpolateObjectArray(objects1: any[], objects2: any[], ratio: number) {
    return objects1.map(o => interpolateObject(o, objects2.find(o2 => o.id === o2.id), ratio));
}
