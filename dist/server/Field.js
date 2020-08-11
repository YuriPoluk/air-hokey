"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matter_js_1 = require("matter-js");
const PlayerRoles_1 = require("../shared/PlayerRoles");
const PlayerEntity_1 = __importDefault(require("./PlayerEntity"));
const Constants_1 = __importDefault(require("../shared/Constants"));
class Field {
    constructor(socket) {
        this.playerSockets = [];
        this.collisions = [];
        // prevTickCollisions: any[] = [];
        this.repeatedCollisions = [];
        this.playToScore = Constants_1.default.PLAY_TO_SCORE;
        this.shouldFixPuck = false;
        this.shouldProcessInput = true;
        this.serverSocket = socket;
        this.engine = matter_js_1.Engine.create();
        this.engine.world.bounds = { min: { x: 0, y: 0 }, max: { x: Constants_1.default.WIDTH, y: Constants_1.default.HEIGHT } };
        this.engine.world.gravity.y = 0;
        this.engine.constraintIterations = 3;
        this.engine.positionIterations = 10;
        this.goals = [0, 0];
        this.init();
        this.updateInterval = setInterval(this.tick.bind(this), 1000 / 60);
        matter_js_1.Events.on(this.engine, 'beforeUpdate', () => { this.beforeEngineupdate(); });
    }
    init() {
        //field bounds
        //player 1
        const p1RightWall = matter_js_1.Bodies.rectangle(Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.FIELD_HEIGHT * 0.75, Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.FIELD_HEIGHT / 2, { isStatic: true, restitution: 0.5 });
        p1RightWall.label = 'p1_right';
        const p1LeftWall = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.FIELD_HEIGHT * 0.75, Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.FIELD_HEIGHT / 2, { isStatic: true, restitution: 0.5 });
        p1LeftWall.label = 'p1_left';
        const p1TopRightWall = matter_js_1.Bodies.rectangle((Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.HEIGHT - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true, restitution: 0.5 });
        p1TopRightWall.label = 'p1_topright';
        const p1TopLeftWall = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - (Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.HEIGHT - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true, restitution: 0.5 });
        p1TopLeftWall.label = 'p1_topleft';
        //player 2
        const p2LeftWall = matter_js_1.Bodies.rectangle(Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.FIELD_HEIGHT * 0.25, Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.FIELD_HEIGHT / 2, { isStatic: true, restitution: 0.5 });
        p2LeftWall.label = 'p2_left';
        const p2RightWall = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.FIELD_HEIGHT * 0.25, Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.FIELD_HEIGHT / 2, { isStatic: true, restitution: 0.5 });
        p2RightWall.label = 'p2_right';
        const p2TopLeftWall = matter_js_1.Bodies.rectangle((Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true, restitution: 0.5 });
        p2TopLeftWall.label = 'p2_topleft';
        const p2TopRightWall = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - (Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true, restitution: 0.5 });
        p2TopRightWall.label = 'p2_topright';
        //strikers and Constants
        const player1Body = matter_js_1.Bodies.circle(Constants_1.default.WIDTH / 2, Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT / 4, Constants_1.default.PLAYER_WIDTH / 2);
        player1Body.label = 'p1_striker';
        player1Body.restitution = 0.5;
        this.player1Entity = new PlayerEntity_1.default(player1Body);
        const player2Body = matter_js_1.Bodies.circle(Constants_1.default.WIDTH / 2, Constants_1.default.HEIGHT / 2 - Constants_1.default.FIELD_HEIGHT / 4, Constants_1.default.PLAYER_WIDTH / 2);
        player2Body.label = 'p2_striker';
        player2Body.restitution = 0.5;
        this.player2Entity = new PlayerEntity_1.default(player2Body);
        this.puck = matter_js_1.Bodies.circle(Constants_1.default.WIDTH / 2, Constants_1.default.HEIGHT / 2, Constants_1.default.PUCK_WIDTH / 2);
        this.puck.label = 'puck';
        this.puck.restitution = 0.9;
        this.puck.frictionAir = 0.01;
        this.puck.friction = 0.03;
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
        for (let obj of this.fieldObjects) {
            obj.restitution = 0;
        }
        matter_js_1.World.add(this.engine.world, bodies);
        this.resetField();
    }
    addPlayer(socket) {
        this.playerSockets.push(socket);
    }
    getPlayerById(socketID) {
        var _a, _b;
        if (socketID === ((_a = this.playerSockets[0]) === null || _a === void 0 ? void 0 : _a.id)) {
            return this.player1Entity;
        }
        else if (socketID === ((_b = this.playerSockets[1]) === null || _b === void 0 ? void 0 : _b.id)) {
            return this.player2Entity;
        }
    }
    updatePlayerOnInput(socketId, data) {
        if (!this.shouldProcessInput)
            return;
        const player = this.getPlayerById(socketId);
        if (!player)
            return;
        if (player.constraint) {
            matter_js_1.World.remove(this.engine.world, player.constraint);
        }
        player.constraint = matter_js_1.Constraint.create({
            pointA: { x: data.x, y: data.y },
            bodyB: player.body,
            pointB: { x: 0, y: 0 },
            length: 0,
            stiffness: 0.9,
        });
        matter_js_1.World.add(this.engine.world, player.constraint);
    }
    beforeEngineupdate() {
        this.clampMaxVelocity(this.puck);
        this.clampMaxVelocity(this.player1Entity.body);
        this.clampMaxVelocity(this.player2Entity.body);
        if (this.player1Entity.body.position.y > Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT / 2 - Constants_1.default.PUCK_WIDTH / 2)
            this.player1Entity.body.position.y = Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT / 2 - Constants_1.default.PUCK_WIDTH / 2;
        if (this.player2Entity.body.position.y < Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.PUCK_WIDTH / 2)
            this.player1Entity.body.position.y = Constants_1.default.CONSTRAINT_WIDTH + Constants_1.default.PUCK_WIDTH / 2;
    }
    updateWorld() {
        // this.beforeEngineupdate();
        matter_js_1.Engine.update(this.engine, 1000 / 60);
        this.checkGoal();
    }
    tick() {
        this.updateWorld();
        this.getCollisions();
        this.fixPuck();
        this.sendState();
    }
    getCollisions() {
        this.repeatedCollisions = this.repeatedCollisions.filter(x => {
            x.ticksRemaining--;
            return x.ticksRemaining >= 0;
        });
        let currentCollisions = matter_js_1.Query.collides(this.puck, [...this.players, ...this.fieldObjects]);
        currentCollisions = currentCollisions.map(collision => {
            return {
                name: collision.bodyA.label,
                pos: collision.bodyA.position,
                puckPos: collision.bodyB.position
            };
        });
        currentCollisions = currentCollisions.filter(collision => {
            let isLegit = true;
            for (let repeatedCollision of this.repeatedCollisions) {
                if (collision.name == repeatedCollision.name) {
                    return false;
                }
            }
            for (let prevCollision of this.collisions) {
                if (collision.name == prevCollision.name) {
                    isLegit = false;
                    collision.ticksRemaining = 10;
                    this.repeatedCollisions.push(collision);
                }
            }
            return isLegit;
        });
        this.collisions = currentCollisions;
    }
    fixPuck() {
        if (this.shouldFixPuck) {
            matter_js_1.Body.applyForce(this.puck, this.puck.position, { x: this.puck.velocity.x / 500, y: this.puck.velocity.y / 500 });
        }
        if (this.collisions.length && this.puck.velocity.x < 0.04 && this.puck.velocity.y < 0.04) {
            this.shouldFixPuck = true;
        }
        else {
            this.shouldFixPuck = false;
        }
    }
    sendState() {
        for (const socket of this.playerSockets) {
            socket.emit(Constants_1.default.SOCKET_UPDATE, {
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
    resetField(playerScored) {
        if (this.player1Entity.constraint) {
            matter_js_1.World.remove(this.engine.world, this.player1Entity.constraint);
        }
        if (this.player2Entity.constraint) {
            matter_js_1.World.remove(this.engine.world, this.player2Entity.constraint);
        }
        this.resetSpeed([this.player1Entity.body, this.player2Entity.body, this.puck]);
        matter_js_1.Body.setPosition(this.player1Entity.body, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT * 0.35 });
        matter_js_1.Body.setPosition(this.player2Entity.body, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 - Constants_1.default.FIELD_HEIGHT * 0.35 });
        if (playerScored == PlayerRoles_1.PlayerRoles.Player2) {
            matter_js_1.Body.setPosition(this.puck, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT * 0.15 });
        }
        else if (playerScored == PlayerRoles_1.PlayerRoles.Player1) {
            matter_js_1.Body.setPosition(this.puck, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 - Constants_1.default.FIELD_HEIGHT * 0.15 });
        }
        else {
            matter_js_1.Body.setPosition(this.puck, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 });
        }
    }
    clampMaxVelocity(obj) {
        if (Math.abs(obj.velocity.x) > Constants_1.default.MAX_VELOCITY) {
            matter_js_1.Body.setVelocity(obj, {
                x: Math.sign(obj.velocity.x) * Constants_1.default.MAX_VELOCITY,
                y: obj.velocity.y
            });
        }
        if (Math.abs(obj.velocity.y) > Constants_1.default.MAX_VELOCITY) {
            matter_js_1.Body.setVelocity(obj, {
                y: Math.sign(obj.velocity.y) * Constants_1.default.MAX_VELOCITY,
                x: obj.velocity.x
            });
        }
        // if (obj.positionImpulse.x > 25.0) {
        //     obj.positionImpulse.x = 25.0;
        // }
        // if (obj.positionImpulse.y > 25.0) {
        //     obj.positionImpulse.y = 25.0;
        // }
    }
    resetSpeed(body) {
        let objs = [];
        Array.isArray(body) ? objs = body : objs = [body];
        for (let obj of objs) {
            matter_js_1.Body.setVelocity(obj, { x: 0, y: 0 });
            obj.angularVelocity = 0;
        }
    }
    checkGoal() {
        let playerScored = null;
        if (this.puck.position.y > Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT / 2 + 5) {
            playerScored = PlayerRoles_1.PlayerRoles.Player2;
        }
        else if (this.puck.position.y < Constants_1.default.CONSTRAINT_WIDTH - 5) {
            playerScored = PlayerRoles_1.PlayerRoles.Player1;
        }
        if (playerScored != null) {
            this.goals[playerScored]++;
            this.shouldProcessInput = false;
            setTimeout(() => { this.shouldProcessInput = true; }, 500);
            this.serverSocket.sockets.emit(Constants_1.default.SOCKET_GOAL_EVENT, playerScored);
            //win and gameover
            if (this.goals[PlayerRoles_1.PlayerRoles.Player1] == this.playToScore || this.goals[PlayerRoles_1.PlayerRoles.Player2] == this.playToScore) {
                const winner = this.goals[PlayerRoles_1.PlayerRoles.Player1] == this.playToScore ? PlayerRoles_1.PlayerRoles.Player1 : PlayerRoles_1.PlayerRoles.Player2;
                this.serverSocket.sockets.emit(Constants_1.default.SOCKET_GAME_OVER_EVENT, winner);
            }
            this.resetField(playerScored);
        }
    }
}
exports.default = Field;
//# sourceMappingURL=Field.js.map