import {Bodies, Body, Engine, World, Constraint, Query} from "matter-js";
import { PlayerRoles } from '../shared/PlayerRoles';
import PlayerEntity from './PlayerEntity';
import Constants from "../shared/Constants";

export default class Field {
    LAST_DELTA!: number;

    engine: Engine;
    player1Entity!: PlayerEntity;
    player2Entity!: PlayerEntity;
    puck!: Body;
    players!: Body[];
    fieldObjects!: Body[];
    goals: [number, number];
    playerSockets: SocketIO.Socket[] = [];
    collisions!: any[];
    playToScore = Constants.PLAY_TO_SCORE;
    private serverSocket: SocketIO.Server;
    private shouldProcessInput = true;


    constructor(socket: SocketIO.Server) {
        this.serverSocket = socket;
        this.engine = Engine.create();
        this.engine.world.bounds = {min: {x: 0, y: 0}, max: {x: Constants.WIDTH, y: Constants.HEIGHT}};
        this.engine.world.gravity.y = 0;
        this.goals = [0, 0];
        this.init();
        setInterval(this.tick.bind(this), 1000 / 60);
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

        //strikers and Constants
        const player1Body = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4, Constants.PLAYER_WIDTH / 2);
        player1Body.label = 'p1_striker'
        player1Body.restitution = 0.5;
        this.player1Entity = new PlayerEntity(player1Body);
        const player2Body = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2 - Constants.FIELD_HEIGHT/4, Constants.PLAYER_WIDTH / 2);
        player2Body.label = 'p2_striker'
        player2Body.restitution = 0.5;
        this.player2Entity = new PlayerEntity(player2Body);

        this.puck = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2, Constants.PUCK_WIDTH / 2);
        this.puck.label = 'puck';
        this.puck.restitution = 0.95;
        this.puck.frictionAir = 0.01;
        this.puck.friction = 0.1;

        const bodies = [
            p1LeftWall,
            p1RightWall,
            p1TopLeftWall,
            p1TopRightWall,
            p2LeftWall,
            p2RightWall,
            p2TopLeftWall,
            p2TopRightWall,
            player1Body,
            player2Body,
            this.puck
        ];

        this.players = [player1Body, player2Body];
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

        World.add(this.engine.world, bodies);
        this.resetField();
    }

    addPlayer(socket: SocketIO.Socket) {
        console.log('SOCKET', socket.id);
        this.playerSockets.push(socket);
    }

    getPlayerById(socketID: string) {
        if(socketID === this.playerSockets[0]?.id) {
            return this.player1Entity;
        }
        else if(socketID === this.playerSockets[1]?.id) {
            return this.player2Entity;
        }
    }

    updatePlayerOnInput(socketId: string, data: any) {
        if(!this.shouldProcessInput) return;
        const player = this.getPlayerById(socketId);
        if(!player) return;
        if(player.constraint) {
            World.remove(this.engine.world, player.constraint);
        }
        player.constraint = Constraint.create({
            pointA: {x: data.x, y: data.y},
            bodyB: player.body,
            pointB: { x: 0, y: 0 },
            length: 0,
            stiffness: 0.75,
        });
        World.add(this.engine.world, player.constraint);
    }

    updateWorld() {
        Engine.update(this.engine, 1000/60);

        this.clampMaxVelocity(this.puck);
        this.clampMaxVelocity(this.player1Entity.body);
        this.clampMaxVelocity(this.player2Entity.body);

        this.checkGoal();
    }

    tick() {
        this.updateWorld();

        let collisions = Query.collides(this.puck, [...this.players, ...this.fieldObjects]);
        this.collisions = collisions.map(collision => {
            return {
                name: collision.bodyA.label,
                pos: collision.bodyA.position,
                puckPos: collision.bodyB.position
            }
        });

        this.sendState();
    }

    sendState() {
        for(const socket of this.playerSockets) {
            socket.emit(Constants.SOCKET_UPDATE, {
                t: Date.now(),
                player1: this.player1Entity.body.position,
                player2: this.player2Entity.body.position,
                puck: this.puck.position,
                collisions: this.collisions
                // fieldCollisions: this.fieldCollisions,
                // strikerCollisions: this.strikerCollisions,
            });
        }
    }

    resetField() {
        if(this.player1Entity.constraint) {
            World.remove(this.engine.world, this.player1Entity.constraint);
        }
        if(this.player2Entity.constraint) {
            World.remove(this.engine.world, this.player2Entity.constraint);
        }

        this.resetSpeed([this.player1Entity.body, this.player2Entity.body, this.puck])

        Body.setPosition(this.player1Entity.body, { x: Constants.WIDTH/2, y: Constants.HEIGHT/2 + Constants.FIELD_HEIGHT*0.35 });
        Body.setPosition(this.player2Entity.body, { x: Constants.WIDTH/2, y: Constants.HEIGHT/2 - Constants.FIELD_HEIGHT*0.35 });
        Body.setPosition(this.puck, { x: Constants.WIDTH/2, y: Constants.HEIGHT/2 });
    }

    clampMaxVelocity(obj: Body) {
        if(obj.velocity.x*obj.velocity.x + obj.velocity.y*obj.velocity.y > Constants.MAX_VELOCITY_SQRD) {
            const velocityAngle = Math.atan(obj.velocity.y / obj.velocity.x);
            obj.velocity.x = Constants.MAX_VELOCITY * Math.cos(velocityAngle);
            obj.velocity.y = Constants.MAX_VELOCITY * Math.sin(velocityAngle);
        }
    }

    resetSpeed(body: Body | Body[]) {
        let objs: Body[] = []
        Array.isArray(body) ? objs = body : objs = [body];

        for(let obj of objs) {
            Body.setVelocity(obj, {x: 0, y: 0});
            obj.angularVelocity = 0;
        }
    }


    checkGoal() {
        let isGoal = false;

        if(this.puck.position.y > Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/2 + 5) {
            this.serverSocket.sockets.emit(Constants.SOCKET_GOAL_EVENT, PlayerRoles.Player2);
            this.goals[PlayerRoles.Player2]++;
            isGoal = true;
        }
        else if(this.puck.position.y < Constants.CONSTRAINT_WIDTH - 5) {
            this.serverSocket.sockets.emit(Constants.SOCKET_GOAL_EVENT, PlayerRoles.Player1);
            this.goals[PlayerRoles.Player1]++;
            isGoal = true;
        }

        if(isGoal) {
            this.shouldProcessInput = false;
            setTimeout(()=>{ this.shouldProcessInput = true }, 500)
            if(this.goals[PlayerRoles.Player1] == this.playToScore || this.goals[PlayerRoles.Player2] == this.playToScore) {
                const winner = this.goals[PlayerRoles.Player1] == this.playToScore ? PlayerRoles.Player1 : PlayerRoles.Player2;
                this.serverSocket.sockets.emit(Constants.SOCKET_GAME_OVER_EVENT, winner);
            }
            this.resetField();
            Body.setPosition(this.puck, {x:Constants.WIDTH/2, y: Constants.HEIGHT/2 - Constants.FIELD_HEIGHT*0.15})
        }
    }
}