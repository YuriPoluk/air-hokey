import Sprite from "../libs/Sprite";
import {Body, Constraint, Engine, World} from "matter-js";
import GameController from "../core/GameController";
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import { playerRole } from '../networking'
import { getCurrentState } from "../state";
import { getRectangleSprite } from '../../../shared/Utils'
import W = PIXI.groupD8.W;

interface Walls {
    left: Sprite,
    topLeft: Sprite,
    right: Sprite,
    topRight: Sprite
}

export default class GameField extends PIXI.Container {

    gameController = GameController.getInstance();
    engine = Engine.create();
    playerInput!: {x: number, y: number};

    background!: Sprite;
    markup!: Sprite;

    player1!: Sprite;
    player2!: Sprite;
    currPlayer!: Sprite;
    puck!: Sprite;
    walls: Walls[] = [];

    hitArea = new PIXI.Rectangle(0, 0, Constants.WIDTH, Constants.HEIGHT)
    interactive = true;

    pointerDowned = false;

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
        if(parseInt(playerRole) == PlayerRoles.Player1) {
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
    }

    init() {
        this.background = this.addChild(new Sprite('background'));
        this.background.width = Constants.WIDTH;
        this.background.height = Constants.HEIGHT;
        this.background.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);

        this.markup = this.addChild(new Sprite('field_markup'));
        this.markup.scale.set(Constants.FIELD_WIDTH / this.markup.getLocalBounds().width);
        this.markup.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);

        this.walls[PlayerRoles.Player1] = {} as Walls;
        this.walls[PlayerRoles.Player2] = {} as Walls;

        const WALL_WIDTH = 8;

        //field bounds
        this.walls[PlayerRoles.Player1].left = this.addChild(new Sprite('wall_blue_v'));
        this.walls[PlayerRoles.Player1].left.scale.set((Constants.FIELD_HEIGHT/2)/this.walls[PlayerRoles.Player1].left.getLocalBounds().height);
        this.walls[PlayerRoles.Player1].left.position.set(Constants.WIDTH - Constants.CONSTRAINT_WIDTH + 14/2, Constants.FIELD_HEIGHT*0.75 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player1].right = this.addChild(new Sprite('wall_blue_v'));
        this.walls[PlayerRoles.Player1].right.scale.set((Constants.FIELD_HEIGHT/2)/this.walls[PlayerRoles.Player1].right.getLocalBounds().height);
        this.walls[PlayerRoles.Player1].right.position.set(Constants.CONSTRAINT_WIDTH - 14/2, Constants.FIELD_HEIGHT*0.75 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player1].topRight = this.addChild(new Sprite('wall_blue_h'));
        this.walls[PlayerRoles.Player1].topRight.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player1].topRight.getLocalBounds().width);
        this.walls[PlayerRoles.Player1].topRight.position.set((Constants.CONSTRAINT_WIDTH + (Constants.WIDTH - Constants.GATE_WIDTH)/2)/2, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH + 11/2);
        this.walls[PlayerRoles.Player1].topLeft = this.addChild(new Sprite('wall_blue_h'));
        this.walls[PlayerRoles.Player1].topLeft.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player1].topLeft.getLocalBounds().width);
        this.walls[PlayerRoles.Player1].topLeft.position.set((Constants.WIDTH - Constants.CONSTRAINT_WIDTH + Constants.WIDTH/2 + Constants.GATE_WIDTH/2)/2, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH + 11/2);

        this.walls[PlayerRoles.Player2].left = this.addChild(new Sprite('wall_purple_v'));
        this.walls[PlayerRoles.Player2].left.scale.set((Constants.FIELD_HEIGHT/2)/this.walls[PlayerRoles.Player2].left.getLocalBounds().height);
        this.walls[PlayerRoles.Player2].left.position.set(Constants.CONSTRAINT_WIDTH - 14/2, Constants.FIELD_HEIGHT*0.25 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player2].right = this.addChild(new Sprite('wall_purple_v'));
        this.walls[PlayerRoles.Player2].right.scale.set((Constants.FIELD_HEIGHT/2)/this.walls[PlayerRoles.Player2].right.getLocalBounds().height);
        this.walls[PlayerRoles.Player2].right.position.set(Constants.WIDTH - Constants.CONSTRAINT_WIDTH + 14/2, Constants.FIELD_HEIGHT*0.25 + Constants.CONSTRAINT_WIDTH);

        this.walls[PlayerRoles.Player2].topLeft = this.addChild(new Sprite('wall_purple_h'));
        this.walls[PlayerRoles.Player2].topLeft.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player2].topLeft.getLocalBounds().width);
        this.walls[PlayerRoles.Player2].topLeft.position.set((Constants.CONSTRAINT_WIDTH + (Constants.WIDTH - Constants.GATE_WIDTH)/2)/2, Constants.CONSTRAINT_WIDTH - 11/2);
        this.walls[PlayerRoles.Player2].topRight = this.addChild(new Sprite('wall_purple_h'));
        this.walls[PlayerRoles.Player2].topRight.scale.set((Constants.FIELD_WIDTH/2 - Constants.GATE_WIDTH/2)/this.walls[PlayerRoles.Player2].topRight.getLocalBounds().width);
        this.walls[PlayerRoles.Player2].topRight.position.set((Constants.WIDTH - Constants.CONSTRAINT_WIDTH + Constants.WIDTH/2 + Constants.GATE_WIDTH/2)/2, Constants.CONSTRAINT_WIDTH - 11/2);

        //strikers and puck
        this.player1 = this.addChild(new Sprite('striker_blue'));
        this.player1.width = this.player1.height = Constants.PLAYER_WIDTH;
        this.player1.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4)

        this.player2 = this.addChild(new Sprite('striker_purple'));
        this.player2.width = this.player2.height = Constants.PLAYER_WIDTH;
        this.player2.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 - Constants.FIELD_HEIGHT/4)


        this.puck = this.addChild(new Sprite('black'));
        this.puck.width = this.puck.height = Constants.PUCK_WIDTH;
        this.puck.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);
    }

    tick(): void {
        if(this.playerInput)
            this.gameController.socket.emit(Constants.SOCKET_PLAYER_ACTION, this.playerInput);
        this.updateBodies();
    }
}