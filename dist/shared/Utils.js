"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollisionPoint = exports.getRectangleSprite = void 0;
const Sprite_1 = __importDefault(require("../client/ts/libs/Sprite"));
const Constants_1 = __importDefault(require("./Constants"));
exports.getRectangleSprite = (width, height, gameController, color) => {
    const rectangle = new PIXI.Graphics();
    if (color === undefined) {
        color = 0xff0000;
    }
    rectangle.beginFill(color);
    rectangle.drawRect(0, 0, width, height);
    rectangle.endFill();
    // rectangle.alpha = 0.35;
    //@ts-ignore
    //TODO investigate, probably types mistake
    return new Sprite_1.default(gameController.app.renderer.generateTexture(rectangle));
};
exports.getCollisionPoint = (collisionData, colliderType) => {
    console.log(Constants_1.default.PUCK_REL_WIDTH);
    if (colliderType == 'striker') {
        const vectorToStriker = { x: collisionData.pos.x - collisionData.puckPos.x, y: collisionData.pos.y - collisionData.puckPos.y };
        const normalisedVector = normalizeVector(vectorToStriker);
        return {
            x: collisionData.puckPos.x + Constants_1.default.PUCK_WIDTH * 0.5 * normalisedVector.x,
            y: collisionData.puckPos.y + Constants_1.default.PUCK_WIDTH * 0.5 * normalisedVector.y,
        };
    }
    else {
        if (collisionData.puckPos.x <= Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.PLAYER_WIDTH / 2) {
            return {
                x: Constants_1.default.CONSTRAINT_WIDTH,
                y: collisionData.puckPos.y
            };
        }
        else if (collisionData.puckPos.x >= Constants_1.default.WIDTH - Constants_1.default.CONSTRAINT_WIDTH - Constants_1.default.PUCK_WIDTH / 2) {
            return {
                x: Constants_1.default.WIDTH - Constants_1.default.CONSTRAINT_WIDTH,
                y: collisionData.puckPos.y
            };
        }
        else if (collisionData.puckPos.y >= Constants_1.default.HEIGHT - Constants_1.default.CONSTRAINT_WIDTH - Constants_1.default.PUCK_WIDTH / 2) {
            return {
                x: collisionData.puckPos.x,
                y: Constants_1.default.HEIGHT - Constants_1.default.CONSTRAINT_WIDTH,
            };
        }
        else {
            return {
                x: collisionData.puckPos.x,
                y: Constants_1.default.CONSTRAINT_WIDTH,
            };
        }
    }
};
const normalizeVector = (vector) => {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    vector.x /= magnitude;
    vector.y /= magnitude;
    return vector;
};
//# sourceMappingURL=Utils.js.map