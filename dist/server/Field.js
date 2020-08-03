"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matter_js_1 = require("matter-js");
const Constants_1 = __importDefault(require("../shared/Constants"));
const PlayerEntity_1 = __importDefault(require("./PlayerEntity"));
class Field {
    constructor(socket) {
        this.playerSockets = [];
        this.serverSocket = socket;
        this.engine = matter_js_1.Engine.create();
        this.engine.world.bounds = { min: { x: 0, y: 0 }, max: { x: Constants_1.default.WIDTH, y: Constants_1.default.HEIGHT } };
        this.engine.world.gravity.y = 0;
        this.init();
        setInterval(this.tick.bind(this), 1000 / 60);
    }
    init() {
        //field bounds
        const leftConstraint = matter_js_1.Bodies.rectangle(Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.FIELD_HEIGHT / 2 + Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.FIELD_HEIGHT, { isStatic: true });
        const rightConstraint = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.FIELD_HEIGHT / 2 + Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.CONSTRAINT_WIDTH, Constants_1.default.FIELD_HEIGHT, { isStatic: true });
        const topLeftConstraint = matter_js_1.Bodies.rectangle((Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true });
        const topRightConstraint = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - (Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true });
        const bottomLeftConstraint = matter_js_1.Bodies.rectangle((Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.HEIGHT - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true });
        const bottomRightConstraint = matter_js_1.Bodies.rectangle(Constants_1.default.WIDTH - (Constants_1.default.WIDTH - Constants_1.default.GATE_WIDTH) / 4, Constants_1.default.HEIGHT - Constants_1.default.CONSTRAINT_WIDTH / 2, Constants_1.default.WIDTH / 2 - Constants_1.default.GATE_WIDTH / 2, Constants_1.default.CONSTRAINT_WIDTH, { isStatic: true });
        //strikers and Constants
        const player1Body = matter_js_1.Bodies.circle(Constants_1.default.WIDTH / 2, Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT / 4, Constants_1.default.PLAYER_WIDTH / 2);
        player1Body.restitution = 0.5;
        this.player1Entity = new PlayerEntity_1.default(player1Body);
        const player2Body = matter_js_1.Bodies.circle(Constants_1.default.WIDTH / 2, Constants_1.default.HEIGHT / 2 - Constants_1.default.FIELD_HEIGHT / 4, Constants_1.default.PLAYER_WIDTH / 2);
        player2Body.restitution = 0.5;
        this.player2Entity = new PlayerEntity_1.default(player2Body);
        this.puck = matter_js_1.Bodies.circle(Constants_1.default.WIDTH / 2, Constants_1.default.HEIGHT / 2, Constants_1.default.PUCK_WIDTH / 2);
        this.puck.restitution = 0.5;
        matter_js_1.World.add(this.engine.world, [leftConstraint,
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
    addPlayer(socket) {
        console.log('SOCKET', socket.id);
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
            stiffness: 0.75,
        });
        matter_js_1.World.add(this.engine.world, player.constraint);
    }
    updateWorld() {
        matter_js_1.Engine.update(this.engine, 1000 / 60);
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
        for (const socket of this.playerSockets) {
            socket.emit(Constants_1.default.SOCKET_UPDATE, {
                t: Date.now(),
                player1: this.player1Entity.body.position,
                player2: this.player2Entity.body.position,
                puck: this.puck.position
            });
        }
    }
    resetField() {
        this.resetSpeed([this.player1Entity.body, this.player2Entity.body, this.puck]);
        matter_js_1.Body.setPosition(this.player1Entity.body, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT * 0.35 });
        matter_js_1.Body.setPosition(this.player2Entity.body, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 - Constants_1.default.FIELD_HEIGHT * 0.35 });
        matter_js_1.Body.setPosition(this.puck, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 });
    }
    clampMaxVelocity(obj) {
        if (obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y > Constants_1.default.MAX_VELOCITY_SQRD) {
            const velocityAngle = Math.atan(obj.velocity.y / obj.velocity.x);
            obj.velocity.x = Constants_1.default.MAX_VELOCITY * Math.cos(velocityAngle);
            obj.velocity.y = Constants_1.default.MAX_VELOCITY * Math.sin(velocityAngle);
        }
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
        let isGoal = false;
        if (this.puck.position.y > Constants_1.default.HEIGHT / 2 + Constants_1.default.FIELD_HEIGHT / 2 + 5) {
            this.serverSocket.sockets.emit('GOAL', '1');
            isGoal = true;
        }
        else if (this.puck.position.y < Constants_1.default.CONSTRAINT_WIDTH - 5) {
            this.serverSocket.sockets.emit('GOAL', '2');
            isGoal = true;
        }
        if (isGoal) {
            // if(this.mouseConstraint) {
            //     World.remove(this.engine.world, this.mouseConstraint);
            // }
            this.resetField();
            matter_js_1.Body.setPosition(this.puck, { x: Constants_1.default.WIDTH / 2, y: Constants_1.default.HEIGHT / 2 - Constants_1.default.FIELD_HEIGHT * 0.15 });
        }
    }
}
exports.default = Field;
//# sourceMappingURL=Field.js.map