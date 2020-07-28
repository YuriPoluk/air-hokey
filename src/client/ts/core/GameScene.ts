import GameController from "./GameController";

export default abstract class GameScene extends PIXI.Container {
    gameController = GameController.getInstance();

    constructor() {
        super();
    }

    abstract onResize(): void;

    abstract tick(delta: number): void;
}