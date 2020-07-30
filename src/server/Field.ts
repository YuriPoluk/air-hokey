import {Bodies, Body, Engine, World, Constraint, MouseConstraint} from "matter-js";
import Constants from '../shared/Constants';
import { PlayerRoles } from '../shared/PlayerRoles';
import PlayerEntity from './PlayerEntity';

export default class Field {
    LAST_DELTA!: number;

    engine: Engine;
    player1Entity!: PlayerEntity;
    player2Entity!: PlayerEntity;
    puck!: Body;
    playerSockets: SocketIO.Socket[] = [];
    private serverSocket: SocketIO.Server;


    constructor(socket: SocketIO.Server) {
        this.serverSocket = socket;
        this.engine = Engine.create();
        this.engine.world.bounds = {min: {x: 0, y: 0}, max: {x: Constants.WIDTH, y: Constants.HEIGHT}};
        this.engine.world.gravity.y = 0;
        this.init();
        setInterval(this.tick.bind(this), 1000 / 60);
    }

    init() {
        //field bounds
        const leftConstraint = Bodies.rectangle(Constants.CONSTRAINT_WIDTH / 2, Constants.FIELD_HEIGHT / 2 + Constants.CONSTRAINT_WIDTH, Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT, {isStatic: true});
        const rightConstraint = Bodies.rectangle(Constants.WIDTH - Constants.CONSTRAINT_WIDTH / 2, Constants.FIELD_HEIGHT / 2 + Constants.CONSTRAINT_WIDTH, Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT, {isStatic: true});
        const topLeftConstraint = Bodies.rectangle((Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true});
        const topRightConstraint = Bodies.rectangle(Constants.WIDTH - (Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true});
        const bottomLeftConstraint = Bodies.rectangle((Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true});
        const bottomRightConstraint = Bodies.rectangle(Constants.WIDTH - (Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH / 2, Constants.WIDTH / 2 - Constants.GATE_WIDTH / 2, Constants.CONSTRAINT_WIDTH, {isStatic: true});

        //strikers and Constants
        const player1Body = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4, Constants.PLAYER_WIDTH / 2);
        player1Body.restitution = 0.5;
        this.player1Entity = new PlayerEntity(player1Body);
        const player2Body = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2 - Constants.FIELD_HEIGHT/4, Constants.PLAYER_WIDTH / 2);
        player2Body.restitution = 0.5;
        this.player2Entity = new PlayerEntity(player2Body);
        this.puck = Bodies.circle(Constants.WIDTH/2, Constants.HEIGHT/2, Constants.PUCK_WIDTH / 2);
        this.puck.restitution = 0.5;

        World.add(this.engine.world, [leftConstraint,
            rightConstraint,
            topLeftConstraint,
            topRightConstraint,
            bottomLeftConstraint,
            bottomRightConstraint,
            player1Body,
            player2Body,
            this.puck]);
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
        this.sendState();
    }

    sendState() {
        for(const socket of this.playerSockets) {
            socket.emit(Constants.SOCKET_UPDATE, {
                t: Date.now(),
                player1: this.player1Entity.body.position,
                player2: this.player2Entity.body.position,
                puck: this.puck.position
            });
        }
    }

    resetField() {
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
            this.serverSocket.sockets.emit('GOAL', '1');
            isGoal = true;
        }
        else if(this.puck.position.y < Constants.CONSTRAINT_WIDTH - 5) {
            this.serverSocket.sockets.emit('GOAL', '2');
            isGoal = true;
        }

        if(isGoal) {
            // if(this.mouseConstraint) {
            //     World.remove(this.engine.world, this.mouseConstraint);
            // }
            this.resetField();
            Body.setPosition(this.puck, {x:Constants.WIDTH/2, y: Constants.HEIGHT/2 - Constants.FIELD_HEIGHT*0.15})
        }
    }
}