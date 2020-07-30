import Sprite from "../client/ts/libs/Sprite";
import GameController from "../client/ts/core/GameController";

export const getRectangleSprite = (width: number, height: number, gameController: GameController, color?: number): Sprite => {
    const rectangle = new PIXI.Graphics();
    if(color === undefined) {
        color = 0xff0000;
    }
    rectangle.beginFill(color);
    rectangle.drawRect(0, 0, width, height);
    rectangle.endFill();
    // rectangle.alpha = 0.35;
    //@ts-ignore
    //TODO investigate, probably types mistake
    return new Sprite(gameController.app.renderer.generateTexture(rectangle));
}