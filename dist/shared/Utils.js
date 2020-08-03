"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRectangleSprite = void 0;
const Sprite_1 = __importDefault(require("../client/ts/libs/Sprite"));
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
//# sourceMappingURL=Utils.js.map