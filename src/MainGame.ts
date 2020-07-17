import Sprite from './libs/Sprite'
import {LayoutManager, Orientation} from './libs/LayoutManager';
import GameScene from "./GameScene";


export default class MainGame extends GameScene  {
    background!: PIXI.Sprite;

    constructor() {
        super();
        this.createChildren();
    }

    createChildren(): void {
        this.background = this.addChild(new Sprite('sky'));
    }

    onResize(): void {
        const w = LayoutManager.gameWidth;
        const h = LayoutManager.gameHeight;

        this.background.width = w;
        this.background.height = h;

        if(LayoutManager.orientation == Orientation.LANDSCAPE) {

        }
        else {

        }
    }

    tick(): void {

    }
}
