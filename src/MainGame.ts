import Sprite from './libs/Sprite'
import {LayoutManager, Orientation} from './libs/LayoutManager';
import GameScene from "./GameScene";
import {Engine, World, Bodies, Body} from 'matter-js';
import GameField from './GameField';


export default class MainGame extends GameScene  {
    background!: PIXI.Sprite;

    gameField!: GameField;

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
        console.log(w, h)

        this.gameField.position.set(- this.gameField.fieldWidth/2, - this.gameField.fieldHeight/2);

        if(LayoutManager.orientation == Orientation.LANDSCAPE) {

        }
        else {

        }
    }

    tick(delta: number): void {
        this.gameField.tick(delta);
    }
}
