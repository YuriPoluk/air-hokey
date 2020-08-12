import {Bodies, Body, Constraint, Engine, World} from "matter-js";
import {PlayerRoles} from '../../../shared/PlayerRoles';
import PlayerEntity from '../../../shared/PlayerEntity';
import Constants from "../../../shared/Constants";

export default class FieldPrediction {
    LAST_DELTA!: number;

    engine: Engine;
    player!: PlayerEntity;
    fieldObjects!: Body[];
    role!: PlayerRoles;


    constructor() {
        this.engine = Engine.create();
        this.engine.world.bounds = {min: {x: 0, y: 0}, max: {x: Constants.WIDTH, y: Constants.HEIGHT}};
        this.engine.world.gravity.y = 0;
        this.engine.constraintIterations = 3;
        this.engine.positionIterations = 10;
        this.init();
    }
    init() {
        //field bounds

        //player 1
        const p1RightWall = Bodies.rectangle(Constants.CONSTRAINT_WIDTH / 2, Constants.CONSTRAINT_WIDTH + Constants.FIELD_HEIGHT*0.75, Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT/2, {isStatic: true, restitution: 0.5});
        p1RightWall.label = 'p1_right';
        const p1LeftWall = Bodies.rectangle(Constants.WIDTH - Constants.CONSTRAINT_WIDTH / 2, Constants.CONSTRAINT_WIDTH + Constants.FIELD_HEIGHT*0.75, Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT/2, {isStatic: true, restitution: 0.5});
        p1LeftWall.label = 'p1_left';
        const p1TopRightWall = Bodies.rectangle((Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true, restitution: 0.5});
        p1TopRightWall.label = 'p1_topright'
        const p1TopLeftWall = Bodies.rectangle(Constants.WIDTH - (Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true, restitution: 0.5});
        p1TopLeftWall.label = 'p1_topleft'

        //player 2
        const p2LeftWall = Bodies.rectangle(Constants.CONSTRAINT_WIDTH / 2, Constants.CONSTRAINT_WIDTH + Constants.FIELD_HEIGHT*0.25, Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT/2, {isStatic: true, restitution: 0.5});
        p2LeftWall.label = 'p2_left';
        const p2RightWall = Bodies.rectangle(Constants.WIDTH - Constants.CONSTRAINT_WIDTH / 2, Constants.CONSTRAINT_WIDTH + Constants.FIELD_HEIGHT*0.25, Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT/2, {isStatic: true, restitution: 0.5});
        p2RightWall.label = 'p2_right';
        const p2TopLeftWall = Bodies.rectangle((Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true, restitution: 0.5});
        p2TopLeftWall.label = 'p2_topleft';
        const p2TopRightWall = Bodies.rectangle(Constants.WIDTH - (Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true, restitution: 0.5});
        p2TopRightWall.label = 'p2_topright';

        let playerBody: Body;

        playerBody = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4, Constants.PLAYER_WIDTH / 2);

        playerBody.restitution = 0.5;
        this.player = new PlayerEntity(playerBody);

        this.fieldObjects = [
            p1LeftWall,
            p1RightWall,
            p1TopLeftWall,
            p1TopRightWall,
            p2LeftWall,
            p2RightWall,
            p2TopLeftWall,
            p2TopRightWall,
        ];
        for(let obj of this.fieldObjects) {
            obj.restitution = 0;
        }

        World.add(this.engine.world, [...this.fieldObjects, playerBody]);
    }

    setRole(role: PlayerRoles) {
        this.role = role;

        if(this.role == PlayerRoles.Player1) {
            Body.setPosition(this.player.body, {x: Constants.WIDTH/2, y: Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4})
        }
        else {
            Body.setPosition(this.player.body, {x: Constants.WIDTH/2, y: Constants.HEIGHT/2 - Constants.FIELD_HEIGHT/4})
        }

    }

    updatePlayerOnInput(data: any) {

        if(this.player.constraint) {
            World.remove(this.engine.world, this.player.constraint);
        }
        this.player.constraint = Constraint.create({
            pointA: {x: data.x, y: data.y},
            bodyB: this.player.body,
            pointB: { x: 0, y: 0 },
            length: 0,
            stiffness: 0.9,
        });
        World.add(this.engine.world, this.player.constraint);
    }

    beforeEngineupdate() {
        this.clampMaxVelocity(this.player.body);

        if(this.role == PlayerRoles.Player1) {
            if(this.player.body.position.y > Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/2 - Constants.PUCK_WIDTH/2)
                this.player.body.position.y = Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/2 - Constants.PUCK_WIDTH/2
        }

        else {
            if(this.player.body.position.y < Constants.CONSTRAINT_WIDTH + Constants.PUCK_WIDTH/2)
                this.player.body.position.y = Constants.CONSTRAINT_WIDTH + Constants.PUCK_WIDTH/2;
        }
    }

    update(delta: number) {
        this.beforeEngineupdate();
        Engine.update(this.engine, delta);
    }

    // sendState() {
    //     for(const socket of this.playerSockets) {
    //         socket.emit(Constants.SOCKET_UPDATE, {
    //             t: Date.now(),
    //             player1: this.player1Entity.body.position,
    //             player2: this.player2Entity.body.position,
    //             puck: this.puck.position,
    //             collisions: this.collisions
    //             // fieldCollisions: this.fieldCollisions,
    //             // strikerCollisions: this.strikerCollisions,
    //         });
    //     }
    // }

    clampMaxVelocity(obj: Body) {
        if(Math.abs(obj.velocity.x) > Constants.MAX_VELOCITY) {
            Body.setVelocity(obj, {
                x: Math.sign(obj.velocity.x) * Constants.MAX_VELOCITY,
                y: obj.velocity.y
            });
        }
        if(Math.abs(obj.velocity.y) > Constants.MAX_VELOCITY) {
            Body.setVelocity(obj, {
                y: Math.sign(obj.velocity.y) * Constants.MAX_VELOCITY,
                x: obj.velocity.x
            });

        }
    }
}