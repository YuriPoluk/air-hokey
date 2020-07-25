import Sprite from "./libs/Sprite";
import {Bodies, Body, Engine, World, Mouse, MouseConstraint, Constraint} from "matter-js";
import GameController from "./GameController";
import PhysicalSprite from './PhysicalSprite';

export default class GameField extends PIXI.Container {


    FIELD_WIDTH = 375;
    FIELD_HEIGHT = 667;
    FIELD_RATIO = this.FIELD_WIDTH / this.FIELD_HEIGHT;
    CONSTRAINT_WIDTH = 25;
    WIDTH = this.FIELD_WIDTH + this.CONSTRAINT_WIDTH*2;
    HEIGHT = this.FIELD_HEIGHT + this.CONSTRAINT_WIDTH*2;
    GATE_WIDTH = this.FIELD_WIDTH/2;
    PLAYER_WIDTH = this.GATE_WIDTH/2;
    PUCK_WIDTH = this.PLAYER_WIDTH*0.45
    LAST_DELTA!: number;
    MAX_VELOCITY = 5;
    MAX_VELOCITY_SQRD = this.MAX_VELOCITY * this.MAX_VELOCITY;

    gameController = GameController.getInstance();
    engine = Engine.create();
    bodies: PhysicalSprite[] = [];

    background!: Sprite;
    leftConstraint!: PhysicalSprite;
    rightConstraint!: PhysicalSprite;
    topLeftConstraint!: PhysicalSprite;
    topRightConstraint!: PhysicalSprite;
    bottomLeftConstraint!: PhysicalSprite;
    bottomRightConstraint!: PhysicalSprite;
    mouseConstraint!: Constraint;
    player1!: PhysicalSprite;
    player2!: PhysicalSprite;
    puck!: PhysicalSprite;

    hitArea = new PIXI.Rectangle(0, 0, this.WIDTH, this.HEIGHT)
    interactive = true;

    pointerDowned = false;

    constructor() {
        super();
        this.pivot.set(this.WIDTH/2, this.HEIGHT/2);
        this.engine.world.bounds = {min: {x: 0, y: 0}, max: {x: this.WIDTH, y: this.HEIGHT}};
        this.engine.world.gravity.y = 0;
        this.init();

        this.player1.view.interactive = true;
        this.player1.view.on('pointerdown', this.onPointerDown, this);
        this.on('pointermove', this.onPointerMove, this);
        this.on('pointerup', this.onPointerUp, this);
    }

    onPointerDown(e: PIXI.interaction.InteractionEvent) {
        this.pointerDowned = true;
    }

    onPointerMove(e: PIXI.interaction.InteractionEvent) {
        if(!this.pointerDowned) return
        let localPos =  e.data.getLocalPosition(this);
        if(localPos.x < 20) localPos.x = 20;
        if(localPos.x > this.WIDTH - 20) localPos.x = this.WIDTH - 20;
        if(localPos.y < this.CONSTRAINT_WIDTH + this.FIELD_HEIGHT/2 + this.PLAYER_WIDTH/2)
            localPos.y = this.CONSTRAINT_WIDTH + this.FIELD_HEIGHT/2 + this.PLAYER_WIDTH/2;
        if(localPos.y > this.HEIGHT - 20) localPos.x = this.HEIGHT - 20;

        if(this.mouseConstraint) {
            World.remove(this.engine.world, this.mouseConstraint);
        }

        this.mouseConstraint = Constraint.create({
            pointA: {x: localPos.x, y: localPos.y},
            bodyB: this.player1.body,
            pointB: { x: 0, y: 0 },
            length: 0,
            stiffness: 0.75,
        });

        World.add(this.engine.world, this.mouseConstraint);
    }

    onPointerUp(e: PIXI.interaction.InteractionEvent) {
        this.pointerDowned = false;

    }

    init() {
        this.background = this.addChild(new Sprite('background'));
        this.background.width = this.WIDTH;
        this.background.height = this.HEIGHT;
        this.background.position.set(this.WIDTH/2, this.HEIGHT/2);

        //field bounds
        const leftConstraint = Bodies.rectangle(this.CONSTRAINT_WIDTH/2, this.FIELD_HEIGHT/2 + this.CONSTRAINT_WIDTH, this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT, { isStatic: true });
        let view = this.addChild(this.getRectangleSprite(this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT));
        this.leftConstraint = new PhysicalSprite(view, leftConstraint);

        const rightConstraint = Bodies.rectangle(this.WIDTH - this.CONSTRAINT_WIDTH/2, this.FIELD_HEIGHT/2 + this.CONSTRAINT_WIDTH, this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.CONSTRAINT_WIDTH, this.FIELD_HEIGHT));
        this.rightConstraint = new PhysicalSprite(view, rightConstraint);

        const topLeftConstraint = Bodies.rectangle((this.WIDTH - this.GATE_WIDTH)/4, this.CONSTRAINT_WIDTH/2, this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH));
        this.topLeftConstraint = new PhysicalSprite(view, topLeftConstraint);
        const topRightConstraint = Bodies.rectangle(this.WIDTH - (this.WIDTH - this.GATE_WIDTH)/4, this.CONSTRAINT_WIDTH/2, this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH));
        this.topRightConstraint = new PhysicalSprite(view, topRightConstraint);

        const bottomLeftConstraint = Bodies.rectangle((this.WIDTH - this.GATE_WIDTH)/4, this.HEIGHT - this.CONSTRAINT_WIDTH/2, this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH));
        this.bottomLeftConstraint = new PhysicalSprite(view, bottomLeftConstraint);
        const bottomRightConstraint = Bodies.rectangle(this.WIDTH - (this.WIDTH - this.GATE_WIDTH)/4, this.HEIGHT - this.CONSTRAINT_WIDTH/2, this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH, { isStatic: true });
        view = this.addChild(this.getRectangleSprite(this.WIDTH/2 - this.GATE_WIDTH/2, this.CONSTRAINT_WIDTH));
        this.bottomRightConstraint = new PhysicalSprite(view, bottomRightConstraint);

        //strikers and puck
        const player1View = this.addChild(new Sprite('blue'));
        player1View.width = player1View.height = this.PLAYER_WIDTH;
        const player1Body = Bodies.circle(this.WIDTH/2, this.HEIGHT - this.CONSTRAINT_WIDTH - 20, this.PLAYER_WIDTH/2);
        player1Body.restitution = 0.5;
        this.player1 = new PhysicalSprite(player1View, player1Body);

        const player2View = this.addChild(new Sprite('red'));
        player2View.width = player2View.height = this.PLAYER_WIDTH;
        const player2Body = Bodies.circle(this.WIDTH/2, this.CONSTRAINT_WIDTH + 20, this.PLAYER_WIDTH/2);
        player2Body.restitution = 0.5;
        this.player2 = new PhysicalSprite(player2View, player2Body);

        const puckView = this.addChild(new Sprite('black'));
        puckView.width = puckView.height = this.PUCK_WIDTH;
        const puckBody = Bodies.circle(this.WIDTH/2, this.HEIGHT/2, this.PUCK_WIDTH/2);
        puckBody.restitution = 0.5;
        this.puck = new PhysicalSprite(puckView, puckBody);

        World.add(this.engine.world, [leftConstraint,
                                            rightConstraint,
                                            topLeftConstraint,
                                            topRightConstraint,
                                            bottomLeftConstraint,
                                            bottomRightConstraint,
                                            player1Body,
                                            player2Body,
                                            puckBody]);
        this.bodies.push(this.leftConstraint,
                         this.rightConstraint,
                         this.topLeftConstraint,
                         this.topRightConstraint,
                         this.bottomLeftConstraint,
                         this.bottomRightConstraint,
                         this.player1,
                         this.player2,
                         this.puck);
    }

    clampMaxVelocity(obj: Body) {
        if(obj.velocity.x*obj.velocity.x + obj.velocity.y*obj.velocity.y > this.MAX_VELOCITY_SQRD) {
            const velocityAngle = Math.atan(obj.velocity.y / obj.velocity.x);
            obj.velocity.x = this.MAX_VELOCITY * Math.cos(velocityAngle);
            obj.velocity.y = this.MAX_VELOCITY * Math.sin(velocityAngle);
        }
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

        for(const body of this.bodies) {
            body.update();
        }

        this.clampMaxVelocity(this.puck.body);
        this.clampMaxVelocity(this.player1.body);

        this.LAST_DELTA = delta;
    }
}