import Sprite from '../libs/Sprite'
import {LayoutManager} from '../libs/LayoutManager';
import GameScene from "../core/GameScene";
import GameField from '../elements/GameField';
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import {playerRole} from '../networking';
import { getRectangleSprite } from "../../../shared/Utils";

export default class MainGame extends GameScene  {
    gameField!: GameField;
    UICnt!: PIXI.Sprite;
    playerScore!: PIXI.Text;
    enemyScore!: PIXI.Text;
    pauseIcon!: Sprite;
    overlay!: Sprite;
    waitingText!: PIXI.Text;
    scoreText!: PIXI.Text;
    role: PlayerRoles = playerRole=='0' ? PlayerRoles.Player1 : PlayerRoles.Player2;


    interactive = false;

    constructor() {
        super();
        this.createChildren();

        this.gameController.socket.on(Constants.SOCKET_GOAL_EVENT, this.onGoal.bind(this));
        this.gameController.socket.on(Constants.SOCKET_PLAYERS_READY, this.startGame.bind(this));
    }

    createChildren(): void {
        this.gameField = this.addChild(new GameField(this.role));
        this.gameField.interactive = false;
        this.UICnt = this.addChild(new Sprite());
        const scoreStyle = new PIXI.TextStyle({
            fontFamily: "main",
            fontSize: 36,
            fill: "white",
            stroke: '#000000',
            strokeThickness: 2,
        });
        this.playerScore = this.UICnt.addChild(new PIXI.Text('0', scoreStyle));
        this.playerScore.anchor.set(0.5);
        this.enemyScore = this.UICnt.addChild(new PIXI.Text('0', scoreStyle));
        this.enemyScore.anchor.set(0.5);
        this.pauseIcon = this.UICnt.addChild(new Sprite('pause_icon'));
        this.pauseIcon.rotation = this.playerScore.rotation = this.enemyScore.rotation = Math.PI/2;
        this.overlay = this.UICnt.addChild(getRectangleSprite(2, 2, this.gameController, 0x000000));
        this.overlay.alpha = 0.5;
        scoreStyle.fontSize = 50;
        this.waitingText = this.UICnt.addChild(new PIXI.Text('Waiting for other player', scoreStyle));
        this.waitingText.anchor.set(0.5);
        this.scoreText = this.UICnt.addChild(new PIXI.Text('3', scoreStyle));
        this.scoreText.anchor.set(0.5);
        this.scoreText.visible = false;
    }

    startGame() {
        this.overlay.visible = false;
        this.waitingText.visible = false;
        this.scoreText.visible = true;
        setTimeout(()=>{ this.scoreText.text = '2'; }, 1000);
        setTimeout(()=>{ this.scoreText.text = '1'; }, 2000);
        setTimeout(()=>{
            this.scoreText.visible = false;
            this.gameField.interactive = true;
        }, 3000);
    }

    onGoal(e: string) {
        if(e == '1') {
            this.playerScore.text = (parseInt(this.playerScore.text) + 1) + '';
        }
        else if(e == '2') {
            this.enemyScore.text = (parseInt(this.playerScore.text) + 1) + '';
        }
    }

    onResize(): void {
        const w = LayoutManager.gameWidth;
        const h = LayoutManager.gameHeight;
        const ratio = w/h;

        //field
        if(ratio <= Constants.FIELD_RATIO) {
            this.gameField.scale.set((w*0.95) / Constants.FIELD_WIDTH);
        }
        else {
            this.gameField.scale.set((h*0.95) / Constants.FIELD_HEIGHT);
        }

        if(this.role == PlayerRoles.Player2) {
            this.gameField.scale.set(-this.gameField.scale.x, -this.gameField.scale.y);
        }
        this.gameField.position.set(0, 0);

        //UI
        this.pauseIcon.scale.set(w*0.1 / this.pauseIcon.getLocalBounds().height);
        this.playerScore.height = w*0.1;
        this.playerScore.scale.x = this.playerScore.scale.y;
        this.enemyScore.scale.set(this.playerScore.scale.x);

        this.pauseIcon.position.set(w*0.49 - this.pauseIcon.height*0.75, 0);
        this.playerScore.position.set(this.pauseIcon.x, - this.playerScore.width*2);
        this.enemyScore.position.set(this.pauseIcon.x, this.enemyScore.width*2);

        this.overlay.width = w;
        this.overlay.height = h;
        this.waitingText.width = w*0.99;
        this.waitingText.scale.y = this.waitingText.scale.x;
        this.scoreText.width = w*0.2;
        this.scoreText.scale.y = this.scoreText.scale.x;
    }

    tick(delta: number): void {
        this.gameField.tick();
    }
}
