import Sprite from "../libs/Sprite";
import GameController from "../core/GameController";
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import {getCurrentCollisions, getCurrentState} from "../state";
import sound from 'pixi-sound';
import FieldElement from "./FieldElement";
import * as particles from 'pixi-particles'
import emitterConfig from '../configs/emitter_config';
import {getCollisionPoint} from "../../../shared/Utils";
import {gsap} from 'gsap';
import FieldPrediction from "./FieldPrediction";


interface Walls {
    left: FieldElement,
    topLeft: FieldElement,
    right: FieldElement,
    topRight: FieldElement
}

export default class GameField extends PIXI.Container {

    gameController = GameController.getInstance();
    enginePrediction = new FieldPrediction()
    playerInput!: {x: number, y: number} | undefined;

    background!: Sprite;
    markup!: Sprite;

    particlesCnt!: PIXI.ParticleContainer;
    emitter!: particles.Emitter;

    player1!: FieldElement;
    player2!: FieldElement;
    currPlayer!: FieldElement;
    enemyPlayer!: FieldElement;
    puck!: FieldElement;
    walls: Walls[] = [];
    fieldObjects = {} as any;
    role!: PlayerRoles;

    hitArea = new PIXI.Rectangle(0, 0, Constants.WIDTH, Constants.HEIGHT)
    debugOverlay!: Sprite;
    interactive = true;
    pointerDowned = false;

    COLOR_BLUE = '#17ffff';
    COLOR_PURPLE = '#d500f9';

    constructor() {
        super();
        this.pivot.set(Constants.WIDTH/2, Constants.HEIGHT/2);
        this.init();
    }

    setRole(role: PlayerRoles) {
        this.role = role;
        this.currPlayer = role === PlayerRoles.Player1 ? this.player1 : this.player2;

        this.enginePrediction.setRole(this.role);
        this.showPlayersAndBounds()

        this.currPlayer.on('pointerdown', this.onPointerDown, this);
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
        if(this.role == PlayerRoles.Player1) {
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

    showPlayersAndBounds() {
        gsap.to(Object.values(this.fieldObjects), {
            alpha: 1,
            duration: 1,
            onComplete: () => { this.currPlayer.interactive = true }
        })

        this.puck.alpha = 1;
        this.setPuck(0);
    }

    onGoal() {
        this.pointerDowned = false;
        this.currPlayer.interactive = false;
        this.puck.alpha = 0;
        this.setPuck(1);
    }

    onGameOver() {
        this.currPlayer.interactive = false;
        this.puck.visible = false;
    }

    setPuck(delay: number) {
        gsap.fromTo(this.puck.scale, {
            x: this.puck.scale.x * 2.5,
            y: this.puck.scale.y * 2.5,
        }, {
            x: this.puck.scale.x,
            y: this.puck.scale.y,
            duration: 1,
            delay: delay,
            onComplete: () => { this.currPlayer.interactive = true },
            onStart: () => { this.puck.alpha = 1 }
        })

    }

    updateBodies() {
        const state = getCurrentState();
        if(!state.player1) return;

        if(this.role == PlayerRoles.Player1) {
            this.player1.position.set(this.enginePrediction.player.body.position.x, this.enginePrediction.player.body.position.y);
            this.player2.position.set(state.player2.x, state.player2.y);
        }

        if(this.role == PlayerRoles.Player2) {
            this.player1.position.set(state.player1.x, state.player1.y);
            this.player2.position.set(this.enginePrediction.player.body.position.x, this.enginePrediction.player.body.position.y);

        }


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
            let player: number;
            if(collisionPoint.y > Constants.HEIGHT/2){
                player = 2;
            }
            else {
                player = 1;
            }

            this.launchParticles(collisionPoint, player);
            console.log
            this.fieldObjects[collision.data.name].glowUp();
        }
    }

    launchParticles(point: {x: number, y: number}, player: number): void {
        emitterConfig.pos = point;

        let images: string[] = [];
        if(player == 1) {
            images = ['purple_triangle', 'purple_circle', 'purple_square'];
        }
        else {
            images = ['blue_triangle', 'blue_circle', 'blue_square'];
        }

        const emitter = new particles.Emitter(
            this.particlesCnt,
            images,
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
        this.walls[PlayerRoles.Player1].topRight.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2 + 7)/this.walls[PlayerRoles.Player1].topRight.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player1].topRight.position.set((Constants.CONSTRAINT_WIDTH + (Constants.WIDTH - Constants.GATE_WIDTH)/2)/2, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH + 3);
        this.walls[PlayerRoles.Player1].topLeft = this.addChild(new FieldElement('wall_blue_h'));
        this.walls[PlayerRoles.Player1].topLeft.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2 + 7)/this.walls[PlayerRoles.Player1].topLeft.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player1].topLeft.position.set((Constants.WIDTH - Constants.CONSTRAINT_WIDTH + Constants.WIDTH/2 + Constants.GATE_WIDTH/2)/2, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH + 3);

        this.walls[PlayerRoles.Player2].left = this.addChild(new FieldElement('wall_purple_v'));
        this.walls[PlayerRoles.Player2].left.scale.set((Constants.FIELD_HEIGHT*0.495)/this.walls[PlayerRoles.Player2].left.view.getLocalBounds().height);
        this.walls[PlayerRoles.Player2].left.position.set(Constants.CONSTRAINT_WIDTH - 3, Constants.FIELD_HEIGHT*0.25 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player2].right = this.addChild(new FieldElement('wall_purple_v'));
        this.walls[PlayerRoles.Player2].right.scale.set((Constants.FIELD_HEIGHT*0.495)/this.walls[PlayerRoles.Player2].right.view.getLocalBounds().height);
        this.walls[PlayerRoles.Player2].right.position.set(Constants.WIDTH - Constants.CONSTRAINT_WIDTH + 3, Constants.FIELD_HEIGHT*0.25 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player2].topLeft = this.addChild(new FieldElement('wall_purple_h'));
        this.walls[PlayerRoles.Player2].topLeft.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2 + 7)/this.walls[PlayerRoles.Player2].topLeft.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player2].topLeft.position.set((Constants.CONSTRAINT_WIDTH + (Constants.WIDTH - Constants.GATE_WIDTH)/2)/2, Constants.CONSTRAINT_WIDTH - 3);
        this.walls[PlayerRoles.Player2].topRight = this.addChild(new FieldElement('wall_purple_h'));
        this.walls[PlayerRoles.Player2].topRight.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2 + 7)/this.walls[PlayerRoles.Player2].topRight.view.getLocalBounds().width);
        this.walls[PlayerRoles.Player2].topRight.position.set((Constants.WIDTH - Constants.CONSTRAINT_WIDTH + Constants.WIDTH/2 + Constants.GATE_WIDTH/2)/2, Constants.CONSTRAINT_WIDTH - 3);

        const viewMultiplier = 1.25; //multiplier for correct scale of strikers
        //strikers and puck
        this.player1 = this.addChild(new FieldElement('striker_blue'));
        this.player1.scale.set(Constants.PLAYER_WIDTH*viewMultiplier / this.player1.view.getLocalBounds().width);
        this.player1.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4)

        this.player2 = this.addChild(new FieldElement('striker_purple'));
        this.player2.scale.set(Constants.PLAYER_WIDTH*viewMultiplier / this.player2.view.getLocalBounds().width);
        this.player2.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 - Constants.FIELD_HEIGHT/4);


        this.puck = this.addChild(new FieldElement('puck'));
        this.puck.scale.set(Constants.PUCK_WIDTH*viewMultiplier / this.puck.view.getLocalBounds().width);
        this.puck.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);
        this.puck.alpha = 0;



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

        for (let obj in this.fieldObjects) {
            this.fieldObjects[obj].alpha = 0
        }

    }

    tick(delta: number): void {
        if(this.playerInput) {
            this.gameController.socket.emit(Constants.SOCKET_PLAYER_ACTION, this.playerInput);
            this.enginePrediction.updatePlayerOnInput(this.playerInput);
        }

        this.enginePrediction.update(delta);
        this.updateBodies();
    }
}