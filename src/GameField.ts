import Sprite from "./libs/Sprite";
import {Bodies, Body, Engine, World, Render} from "matter-js";
import GameController from "./GameController";

export default class GameField extends PIXI.Container {

    width = 250;
    height = 400;
    fieldWidth = 250;
    fieldHeight = 400;
    gameController = GameController.getInstance();
    engine = Engine.create();
    Render!: Render;

    background!: Sprite;
    black!: Sprite;
    blackPhysic!: Body;

    constructor() {
        super();
        this.createChildren();
        this.Render = Render.create({
            element: document.getElementById("scene-2") as  HTMLCanvasElement,
            engine: this.engine,
        });

        Render.run(this.Render);
        Engine.run(this.engine)
    }

    createChildren() {
        this.background = this.addChild(this.getRectangleSprite());
        this.background.width = this.fieldWidth;
        this.background.height = this.fieldHeight;
        this.background.position.set(this.fieldWidth/2, this.fieldHeight/2);
        this.black = this.addChild(new Sprite('black'));
        this.black.width = this.black.height = 40;
        this.black.alpha = 0;
        const leftConstraint = Bodies.rectangle(0, 0, 1, 400, { isStatic: true });
        const rightConstraint = Bodies.rectangle(250, 0, 1, 400, { isStatic: true });
        const topConstraint = Bodies.rectangle(0, 0, 250, 1, { isStatic: true });
        const bottomConstraint = Bodies.rectangle(0, 250, 250, 1, { isStatic: true });
        this.blackPhysic = Bodies.circle(125, 225, 20);

        World.add(this.engine.world, [leftConstraint, rightConstraint, topConstraint, bottomConstraint, this.blackPhysic]);

        // Body.applyForce(this.blackPhysic, {x: 0, y: 0}, {x: 0.1, y: 0.1});

    }

    getRectangleSprite(): Sprite {
        const rectangle = new PIXI.Graphics();
        rectangle.beginFill(0xff0000);
        rectangle.drawRect(0, 0, 64, 64);
        rectangle.endFill();
        const sprite = new Sprite(this.gameController.app.renderer.generateTexture(rectangle));
        sprite.alpha = 0;
        return sprite;
    }

    tick(delta: number): void {
        // Engine.update(this.engine, delta);


        // Moves the simulation forward in time by delta ms. The correction argument is an optional Number that specifies
        // the time correction factor to apply to the update. This can help improve the accuracy of the simulation in cases where
        // delta is changing between updates. The value of correction is defined as delta / lastDelta, i.e. the percentage change of delta over the last step.
        this.black.position.set(this.blackPhysic.position.x, this.blackPhysic.position.y);
    }
}