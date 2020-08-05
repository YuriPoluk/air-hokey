import GameScene from "../core/GameScene";
import Sprite from '../libs/Sprite'
import {LayoutManager} from "../libs/LayoutManager";
import { connect } from "../networking";
import MainGame from "./MainGame";

export default class StartScreen extends GameScene  {
    UICnt!: PIXI.Container;
    playBtn!: Sprite;

    constructor() {
        super();
        this.createChildren();

        this.playBtn.once('pointerdown', async () => {
            await connect();
            this.gameController.showWindow(new MainGame())
        })
    }

    createChildren() {
        this.UICnt = this.addChild(new Sprite());
        this.playBtn = this.UICnt.addChild(new Sprite('play'));
        this.playBtn.interactive = true;
    }

    onResize() {
        const w = LayoutManager.gameWidth;
        const h = LayoutManager.gameHeight;

        this.playBtn.scale.set(w*0.25 / this.playBtn.getLocalBounds().width);
    }

    tick() {}
}