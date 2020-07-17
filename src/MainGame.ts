import Sprite from './libs/Sprite'
import {LayoutManager, Orientation} from './libs/LayoutManager';
import GameScene from "./GameScene";
import {Engine, World, Bodies, Body} from 'matter-js';


export default class MainGame extends GameScene  {
    background!: PIXI.Sprite;
    engine = Engine.create();
    gameContainer = this.addChild(new PIXI.Container())

    constructor() {
        super();
        this.createChildren();
    }

    createChildren(): void {
        this.black = this.gameContainer.addChild(new Sprite('black'));
        this.black.width = this.black.height = 40;
        const leftConstraint = Bodies.rectangle(0, 0, 1, 400, { isStatic: true });
        const rightConstraint = Bodies.rectangle(250, 0, 1, 400, { isStatic: true });
        const topConstraint = Bodies.rectangle(0, 0, 250, 1, { isStatic: true });
        const bottomConstraint = Bodies.rectangle(0, 250, 250, 1, { isStatic: true });
        this.blackPhysic = Bodies.circle(120, 200, 20);

        World.add(this.engine.world, [leftConstraint, rightConstraint, topConstraint, bottomConstraint, this.blackPhysic]);

        Body.applyForce(this.blackPhysic, {x: 0, y: 0}, {x: -0.1, y: -0.1});
    }

    getRectangleSprite() {
        const rectangle = new PIXI.Graphics();
        rectangle.beginFill(0x000000);
        rectangle.drawRect(0, 0, 64, 64);
        rectangle.endFill();
        return new Sprite(this.gameController.app.renderer.generateTexture(rectangle));
    }

    onResize(): void {
        const w = LayoutManager.gameWidth;
        const h = LayoutManager.gameHeight;
        console.log(w, h)

        if(LayoutManager.orientation == Orientation.LANDSCAPE) {

        }
        else {

        }
    }

    tick(delta: number): void {
        Engine.update(this.engine, delta);
        this.black.position.set(this.blackPhysic.position.x, this.blackPhysic.position.y);
    }
}
