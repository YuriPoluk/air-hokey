import Sprite from "../libs/Sprite";
import {Body, Constraint, Engine, World} from "matter-js";
import GameController from "../core/GameController";
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import { playerRole } from '../networking'
import { getCurrentState, getCurrentCollisions } from "../state";
import sound from 'pixi-sound';
import FieldElement from "./FieldElement";
import * as particles from 'pixi-particles'
import emitterConfig from '../configs/emitter_config';
import {getCollisionPoint} from "../../../shared/Utils";



interface Walls {
    left: FieldElement,
    topLeft: FieldElement,
    right: FieldElement,
    topRight: FieldElement
}

export default class GameField extends PIXI.Container {

    gameController = GameController.getInstance();
    engine = Engine.create();
    playerInput!: {x: number, y: number} | undefined;

    background!: Sprite;
    markup!: Sprite;

    particlesCnt!: PIXI.ParticleContainer;
    emitter!: particles.Emitter;

    player1!: FieldElement;
    player2!: FieldElement;
    currPlayer!: FieldElement;
    puck!: FieldElement;
    walls: Walls[] = [];
    fieldObjects = {} as any;

    hitArea = new PIXI.Rectangle(0, 0, Constants.WIDTH, Constants.HEIGHT)
    debugOverlay!: Sprite;
    interactive = true;
    pointerDowned = false;

    COLOR_BLUE = '#17ffff';
    COLOR_PURPLE = '#d500f9';

    constructor(role: PlayerRoles) {
        super();
        this.pivot.set(Constants.WIDTH/2, Constants.HEIGHT/2);
        this.engine.world.bounds = { min: { x: 0, y: 0 }, max: { x: Constants.WIDTH, y: Constants.HEIGHT }};
        this.engine.world.gravity.y = 0;
        this.init();
        this.setRole(role);
    }

    setRole(role: PlayerRoles) {
        this.currPlayer = role === PlayerRoles.Player1 ? this.player1 : this.player2;
        this.currPlayer.interactive = true;

        this.currPlayer.on('pointerdown', this.onPointerDown, this);
        this.on('pointerdown', (e: PIXI.interaction.InteractionEvent) => {
            console.log(e.data.getLocalPosition(this))
        });
        this.on('pointermove', this.onPointerMove, this);
        this.on('pointerup', this.onPointerUp, this);
    }

    onPointerDown(e: PIXI.interaction.InteractionEvent) {
        this.pointerDowned = true;
    }

    onPointerMove(e: PIXI.interaction.InteractionEvent) {
        if(!this.pointerDowned) return;
        let localPos =  e.data.getLocalPosition(this);
        if(localPos.x < Constants.CONSTRAINT_WIDTH + Constants.PLAYER_WIDTH/2) localPos.x = Constants.CONSTRAINT_WIDTH + Constants.PLAYER_WIDTH/2;
        if(localPos.x > Constants.WIDTH - Constants.CONSTRAINT_WIDTH - Constants.PLAYER_WIDTH/2) localPos.x = Constants.WIDTH - Constants.CONSTRAINT_WIDTH - Constants.PLAYER_WIDTH/2;
        if(playerRole == PlayerRoles.Player1) {
            if(localPos.y < Constants.CONSTRAINT_WIDTH + Constants.FIELD_HEIGHT/2 + Constants.PLAYER_WIDTH/2)
                localPos.y = Constants.CONSTRAINT_WIDTH + Constants.FIELD_HEIGHT/2 + Constants.PLAYER_WIDTH/2;
            if(localPos.y > Constants.HEIGHT - Constants.CONSTRAINT_WIDTH - Constants.PLAYER_WIDTH/2) localPos.y = Constants.HEIGHT - Constants.CONSTRAINT_WIDTH - Constants.PLAYER_WIDTH/2;
        }
        else {
            if(localPos.y < Constants.CONSTRAINT_WIDTH + Constants.PLAYER_WIDTH/2)
                localPos.y = Constants.CONSTRAINT_WIDTH + Constants.PLAYER_WIDTH/2;
            if(localPos.y > Constants.HEIGHT/2 - Constants.PLAYER_WIDTH/2) localPos.y = Constants.HEIGHT/2 - Constants.PLAYER_WIDTH/2;
        }

        this.playerInput = {x: localPos.x, y: localPos.y};
    }

    onPointerUp(e: PIXI.interaction.InteractionEvent) {
        this.pointerDowned = false;
    }

    updateBodies() {
        const state = getCurrentState();
        if(!state.player1) return;
        this.player1.position.set(state.player1.x, state.player1.y);
        this.player2.position.set(state.player2.x, state.player2.y);
        this.puck.position.set(state.puck.x, state.puck.y);

        let collisions = getCurrentCollisions();
        if(collisions.length) {
            this.processCollisions(collisions);
        }
    }

    processCollisions(collisions: any) {
        if(collisions.length)
            this.puck.glowUp();

        for (let collision of collisions) {
            let colliderType: 'striker' | 'wall';
            if(collision.data.name == 'p1_striker' || collision.data.name == 'p2_striker') {
                sound.play('striker_hit');
                colliderType = 'striker';
            }
            else {
                sound.play('wall_hit');
                colliderType = 'wall'
            }

            let collisionPoint = getCollisionPoint(collision.data, colliderType);
            let color;
            if(collisionPoint.y > Constants.HEIGHT/2){
                color = this.COLOR_BLUE
            }
            else {
                color = this.COLOR_PURPLE
            }

            this.launchParticles(collisionPoint, color);
            console.log
            this.fieldObjects[collision.data.name].glowUp();
        }
    }

    launchParticles(point: {x: number, y: number}, color: string): void {
        emitterConfig.pos = point;
        emitterConfig.color.start = color;
        emitterConfig.color.end = color;

        const emitter = new particles.Emitter(
            this.particlesCnt,
            ['Pixel25px'],
            emitterConfig);
        emitter.updateSpawnPos(point.x, point.y);
        emitter.playOnceAndDestroy();
    }

    init() {
        this.background = this.addChild(new Sprite('background'));
        this.background.width = Constants.WIDTH;
        this.background.height = Constants.HEIGHT;
        this.background.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);

        this.markup = this.addChild(new Sprite('field_markup'));
        this.markup.scale.set(Constants.FIELD_WIDTH / this.markup.getLocalBounds().width);
        this.markup.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);

        this.particlesCnt = this.addChild(new PIXI.ParticleContainer());

        this.walls[PlayerRoles.Player1] = {} as Walls;
        this.walls[PlayerRoles.Player2] = {} as Walls;

        const WALL_WIDTH = 8;

        //field bounds
        this.walls[PlayerRoles.Player1].left = this.addChild(new FieldElement('wall_blue_v'));
        this.walls[PlayerRoles.Player1].left.scale.set((Constants.FIELD_HEIGHT*0.49)/this.walls[PlayerRoles.Player1].left.view.getLocalBounds().height);
        this.walls[PlayerRoles.Player1].left.position.set(Constants.WIDTH - Constants.CONSTRAINT_WIDTH + 3, Constants.FIELD_HEIGHT*0.75 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player1].right = this.addChild(new FieldElement('wall_blue_v'));
        this.walls[PlayerRoles.Player1].right.scale.set((Constants.FIELD_HEIGHT*0.495)/this.walls[PlayerRoles.Player1].right.view.getLocalBounds().height);
        this.walls[PlayerRoles.Player1].right.position.set(Constants.CONSTRAINT_WIDTH - 3, Constants.FIELD_HEIGHT*0.75 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player1].topRight = this.addChild(new FieldElement('wall_blue_h'));
        this.walls[PlayerRoles.Player1].topRight.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player1].topRight.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player1].topRight.position.set((Constants.CONSTRAINT_WIDTH + (Constants.WIDTH - Constants.GATE_WIDTH)/2)/2, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH + 3);
        this.walls[PlayerRoles.Player1].topLeft = this.addChild(new FieldElement('wall_blue_h'));
        this.walls[PlayerRoles.Player1].topLeft.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player1].topLeft.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player1].topLeft.position.set((Constants.WIDTH - Constants.CONSTRAINT_WIDTH + Constants.WIDTH/2 + Constants.GATE_WIDTH/2)/2, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH + 3);

        this.walls[PlayerRoles.Player2].left = this.addChild(new FieldElement('wall_purple_v'));
        this.walls[PlayerRoles.Player2].left.scale.set((Constants.FIELD_HEIGHT*0.495)/this.walls[PlayerRoles.Player2].left.view.getLocalBounds().height);
        this.walls[PlayerRoles.Player2].left.position.set(Constants.CONSTRAINT_WIDTH - 3, Constants.FIELD_HEIGHT*0.25 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player2].right = this.addChild(new FieldElement('wall_purple_v'));
        this.walls[PlayerRoles.Player2].right.scale.set((Constants.FIELD_HEIGHT*0.495)/this.walls[PlayerRoles.Player2].right.view.getLocalBounds().height);
        this.walls[PlayerRoles.Player2].right.position.set(Constants.WIDTH - Constants.CONSTRAINT_WIDTH + 3, Constants.FIELD_HEIGHT*0.25 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player2].topLeft = this.addChild(new FieldElement('wall_purple_h'));
        this.walls[PlayerRoles.Player2].topLeft.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player2].topLeft.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player2].topLeft.position.set((Constants.CONSTRAINT_WIDTH + (Constants.WIDTH - Constants.GATE_WIDTH)/2)/2, Constants.CONSTRAINT_WIDTH - 3);
        this.walls[PlayerRoles.Player2].topRight = this.addChild(new FieldElement('wall_purple_h'));
        this.walls[PlayerRoles.Player2].topRight.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player2].topRight.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player2].topRight.position.set((Constants.WIDTH - Constants.CONSTRAINT_WIDTH + Constants.WIDTH/2 + Constants.GATE_WIDTH/2)/2, Constants.CONSTRAINT_WIDTH - 3);

        const viewMultiplier = 1.5; //multiplier for correct scale of strikers
        //strikers and puck
        this.player1 = this.addChild(new FieldElement('striker_blue'));
        this.player1.scale.set(Constants.PLAYER_WIDTH*viewMultiplier / this.player1.view.getLocalBounds().width);
        this.player1.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4)

        this.player2 = this.addChild(new FieldElement('striker_purple'));
        this.player2.scale.set(Constants.PLAYER_WIDTH*viewMultiplier / this.player2.view.getLocalBounds().width);
        this.player2.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 - Constants.FIELD_HEIGHT/4)


        this.puck = this.addChild(new FieldElement('puck'));
        this.puck.scale.set(Constants.PUCK_WIDTH*viewMultiplier / this.puck.view.getLocalBounds().width);
        this.puck.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);
        //
        // this.debugOverlay = this.addChild(getRectangleSprite(Constants.FIELD_WIDTH, Constants.FIELD_HEIGHT, this.gameController, 0xff0000));
        // this.debugOverlay.anchor.set(0);
        // this.debugOverlay.position.set(Constants.CONSTRAINT_WIDTH, Constants.CONSTRAINT_WIDTH);

        this.fieldObjects = {
            'p1_striker': this.player1,
            'p2_striker': this.player2,
            'p1_left': this.walls[PlayerRoles.Player1].left,
            'p1_right': this.walls[PlayerRoles.Player1].right,
            'p1_topleft': this.walls[PlayerRoles.Player1].topLeft,
            'p1_topright': this.walls[PlayerRoles.Player1].topRight,
            'p2_left': this.walls[PlayerRoles.Player2].left,
            'p2_right': this.walls[PlayerRoles.Player2].right,
            'p2_topleft': this.walls[PlayerRoles.Player2].topLeft,
            'p2_topright': this.walls[PlayerRoles.Player2].topRight,
        }

    }

    tick(delta: number): void {
        if(this.playerInput)
            this.gameController.socket.emit(Constants.SOCKET_PLAYER_ACTION, this.playerInput);
        this.updateBodies();
    }
}