import Sprite from "./libs/Sprite";
import {Bodies, Body, Engine, World, Render} from "matter-js";
import GameController from "./GameController";
import PhysicalSprite from './PhysicalSprite'

export default class GameField extends PIXI.Container {


    FIELD_WIDTH = 250;
    FIELD_HEIGHT = 400;
    CONSTRAINT_WIDTH = 25;
    WIDTH = this.FIELD_WIDTH + this.CONSTRAINT_WIDTH*2;
    HEIGHT = this.FIELD_HEIGHT + this.CONSTRAINT_WIDTH*2;
    LAST_DELTA!: number;

    gameController = GameController.getInstance();
    engine = Engine.create();
    bodies: PhysicalSprite[] = [];

    background!: Sprite;
    ball!: PhysicalSprite;
    leftConstraint!: PhysicalSprite;
    rightConstraint!: PhysicalSprite;
    topConstraint!: PhysicalSprite;
    bottomConstraint!: PhysicalSprite;

    constructor() {
        super();
        this.engine.world.bounds = {min: {x: 0, y: 0}, max: {x: this.WIDTH, y: this.HEIGHT}};
        this.engine.world.gravity.y = 0;
        this.init();
    }

    init() {
        this.background = this.addChild(this.getRectangleSprite(100, 100, 0x00ff00));
        this.background.width = this.WIDTH;
        this.background.height = this.HEIGHT;
        this.background.position.set(this.WIDTH/2, this.HEIGHT/2);
        const black = this.addChild(new Sprite('black'));
        black.width = black.height = 40;
        const playBall = Bodies.circle(50, 50, 20);
        playBall.restitution = 0.5;
        this.ball = new PhysicalSprite(black, playBall);

        const leftConstraint = Bodies.rectangle(this.CONSTRAINT_WIDTH/2, this.FIELD_HEIGHT/2 + this.CONSTRAINT_WIDTH, this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT, { isStatic: true });
        let view = this.addChild(this.getRectangleSprite(this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT));
        this.leftConstraint = new PhysicalSprite(view, leftConstraint);

        const rightConstraint = Bodies.rectangle(this.WIDTH - this.CONSTRAINT_WIDTH/2, this.FIELD_HEIGHT/2 + this.CONSTRAINT_WIDTH, this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT));
        this.rightConstraint = new PhysicalSprite(view, rightConstraint);

        const topConstraint = Bodies.rectangle(this.WIDTH/2, this.CONSTRAINT_WIDTH/2, this.WIDTH, this.CONSTRAINT_WIDTH, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.WIDTH, this.CONSTRAINT_WIDTH));
        this.topConstraint = new PhysicalSprite(view, topConstraint);

        const bottomConstraint = Bodies.rectangle(this.WIDTH/2, this.HEIGHT - this.CONSTRAINT_WIDTH/2, this.WIDTH, this.CONSTRAINT_WIDTH, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.WIDTH, this.CONSTRAINT_WIDTH));
        this.bottomConstraint = new PhysicalSprite(view, bottomConstraint);


        World.add(this.engine.world, [leftConstraint, rightConstraint, topConstraint, bottomConstraint, playBall]);

        Body.applyForce(this.ball.body, {x: 0, y: 0}, {x: 0.1, y: 0.1});

        this.bodies = [this.leftConstraint, this.rightConstraint, this.topConstraint, this.bottomConstraint, this.ball];
    }

    getRectangleSprite(width: number, height: number, color?: number): Sprite {
        const rectangle = new PIXI.Graphics();
        color = color || 0xff0000;
        rectangle.beginFill(color);
        rectangle.drawRect(0, 0, width, height);
        rectangle.endFill();
        rectangle.alpha = 0.35;
        return new Sprite(this.gameController.app.renderer.generateTexture(rectangle));
    }

    tick(delta: number): void {
        const correction = this.LAST_DELTA ? delta / this.LAST_DELTA : 1;
        Engine.update(this.engine, delta, correction);
        this.LAST_DELTA = delta;

        for(const body of this.bodies) {
            body.update();
        }
    }
}