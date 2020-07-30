import Sprite from "../libs/Sprite";
import {Body, Constraint, Engine, World} from "matter-js";
import GameController from "../core/GameController";
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import { playerRole } from '../networking'
import { getCurrentState } from "../state";
import { getRectangleSprite } from '../../../shared/Utils'

export default class GameField extends PIXI.Container {

    gameController = GameController.getInstance();
    engine = Engine.create();
    playerInput!: {x: number, y: number};

    background!: Sprite;

    player1!: Sprite;
    player2!: Sprite;
    currPlayer!: Sprite;
    puck!: Sprite;

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
        console.log(role, PlayerRoles.Player1)
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

        console.log('prevPosOnClient', {x: this.currPlayer.x, y: this.currPlayer.y})
        console.log({x: localPos.x, y: localPos.y})
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
        this.background = this.addChild(getRectangleSprite(2, 2, this.gameController, 0xf5f5f5));
        this.background.width = Constants.WIDTH;
        this.background.height = Constants.HEIGHT;
        this.background.position.set(Constants.WIDTH/2, Constants.HEIGHT/2);

        //field bounds
        let leftConstraint = this.addChild(getRectangleSprite(Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT, this.gameController));
        leftConstraint.position.set(Constants.CONSTRAINT_WIDTH / 2, Constants.FIELD_HEIGHT / 2 + Constants.CONSTRAINT_WIDTH);
        let rightConstraint = this.addChild(getRectangleSprite(Constants.CONSTRAINT_WIDTH, Constants.FIELD_HEIGHT, this.gameController));
        rightConstraint.position.set(Constants.WIDTH - Constants.CONSTRAINT_WIDTH / 2, Constants.FIELD_HEIGHT / 2 + Constants.CONSTRAINT_WIDTH);
        let topLeftConstraint = this.addChild(getRectangleSprite(Constants.WIDTH/2 - Constants.GATE_WIDTH/2, Constants.CONSTRAINT_WIDTH, this.gameController));
        topLeftConstraint.position.set((Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.CONSTRAINT_WIDTH / 2);
        let topRightConstraint = this.addChild(getRectangleSprite(Constants.WIDTH/2 - Constants.GATE_WIDTH/2, Constants.CONSTRAINT_WIDTH, this.gameController));
        topRightConstraint.position.set(Constants.WIDTH - (Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.CONSTRAINT_WIDTH / 2);
        let bottomLeftConstraint = this.addChild(getRectangleSprite(Constants.WIDTH/2 - Constants.GATE_WIDTH/2, Constants.CONSTRAINT_WIDTH, this.gameController));
        bottomLeftConstraint.position.set((Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH / 2);
        let bottomRightConstraint = this.addChild(getRectangleSprite(Constants.WIDTH/2 - Constants.GATE_WIDTH/2, Constants.CONSTRAINT_WIDTH, this.gameController));
        bottomRightConstraint.position.set(Constants.WIDTH - (Constants.WIDTH - Constants.GATE_WIDTH) / 4, Constants.HEIGHT - Constants.CONSTRAINT_WIDTH / 2);

        //strikers and puck
        this.player1 = this.addChild(new Sprite('blue'));
        this.player1.width = this.player1.height = Constants.PLAYER_WIDTH;
        this.player1.position.set(Constants.WIDTH/2, Constants.HEIGHT/2 + Constants.FIELD_HEIGHT/4)

        this.player2 = this.addChild(new Sprite('red'));
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