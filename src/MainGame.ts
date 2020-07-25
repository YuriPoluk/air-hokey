import Sprite from './libs/Sprite'
import {LayoutManager, Orientation} from './libs/LayoutManager';
import GameScene from "./GameScene";
import {Engine, World, Bodies, Body} from 'matter-js';
import GameField from './GameField';


export default class MainGame extends GameScene  {
    background!: PIXI.Sprite;
    gameField!: GameField;
    interactive = false;

    constructor() {
        super();
        this.createChildren();
    }

    createChildren(): void {
        this.gameField = this.addChild(new GameField());
    }



    onResize(): void {
        const w = LayoutManager.gameWidth;
        const h = LayoutManager.gameHeight;
        const ratio = w/h;

        console.log(ratio, this.gameField.FIELD_RATIO);

        if(ratio <= this.gameField.FIELD_RATIO) {
            this.gameField.scale.set((w*0.95) / this.gameField.FIELD_WIDTH);
        }
        else {
            this.gameField.scale.set((h*0.95) / this.gameField.FIELD_HEIGHT);
        }

        this.gameField.position.set(0, 0);

    }

    tick(delta: number): void {
        this.gameField.tick(delta);
    }
}
