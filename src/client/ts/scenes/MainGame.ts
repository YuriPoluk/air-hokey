import Sprite from '../libs/Sprite'
import {LayoutManager} from '../libs/LayoutManager';
import GameScene from "../core/GameScene";
import GameField from '../elements/GameField';
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import {playerRole, connect} from '../networking';
import { getRectangleSprite } from "../../../shared/Utils";
import sound from 'pixi-sound';


export default class MainGame extends GameScene  {
    gameField!: GameField;
    particlesCnt!: PIXI.Container;
    UICnt!: PIXI.Sprite;
    playerScore!: PIXI.Text;
    enemyScore!: PIXI.Text;
    winnerText!: PIXI.Text;
    overlay!: Sprite;
    waitingText!: PIXI.Text;
    scoreText!: PIXI.Text;
    retryBtn!: Sprite;
    role = playerRole == PlayerRoles.Player1 ? PlayerRoles.Player1 : PlayerRoles.Player2;


    interactive = false;

    constructor() {
        super();
        this.createChildren();

        this.gameController.socket.on(Constants.SOCKET_GOAL_EVENT, this.onGoal.bind(this));
        this.gameController.socket.on(Constants.SOCKET_PLAYERS_READY, this.startGame.bind(this));
        this.gameController.socket.on(Constants.SOCKET_GAME_OVER_EVENT, this.onGameOver.bind(this));
    }

    createChildren(): void {
        this.gameField = this.addChild(new GameField(this.role));
        this.gameField.interactive = false;
        this.particlesCnt = this.addChild(new PIXI.Container());

        this.UICnt = this.addChild(new Sprite());
        const scoreStyle = new PIXI.TextStyle({
            fontFamily: "ZonaPro",
            fontSize: 100,
            fill: "white",
            stroke: '#000000',
            strokeThickness: 2,
        });
        this.playerScore = this.UICnt.addChild(new PIXI.Text('0', scoreStyle));
        this.playerScore.anchor.set(0.5);
        this.enemyScore = this.UICnt.addChild(new PIXI.Text('0', scoreStyle));
        this.enemyScore.anchor.set(0.5);
        this.overlay = this.UICnt.addChild(getRectangleSprite(2, 2, this.gameController, 0x000000));
        this.overlay.alpha = 0.5;
        // scoreStyle.fontSize = 50;
        this.waitingText = this.UICnt.addChild(new PIXI.Text('WAITING FOR OTHER PLAYER', scoreStyle));
        this.waitingText.anchor.set(0.5);
        this.scoreText = this.UICnt.addChild(new PIXI.Text('3', scoreStyle));
        this.scoreText.anchor.set(0.5);
        this.scoreText.visible = false;
        this.winnerText = this.UICnt.addChild(new PIXI.Text('WINNER!', scoreStyle));
        this.winnerText.anchor.set(0.5);
        this.winnerText.visible = false;
        this.retryBtn = this.UICnt.addChild(new Sprite('retry_btn'));
        this.retryBtn.visible = false;
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

    playParticles() {
        // this.emitter = new particles.Emitter(
        //     this.particlesCnt,
        //     ['Pixel25px'],
        //     emitterConfig
        // );
    }

    onGoal(e: PlayerRoles) {
        this.gameField.pointerDowned = false;
        this.gameField.playerInput = undefined;
        if(e == this.role) {
            this.playerScore.text = (parseInt(this.playerScore.text) + 1) + '';
        }
        else {
            this.enemyScore.text = (parseInt(this.enemyScore.text) + 1) + '';
        }

        sound.play('goal');
    }

    onGameOver(winner: PlayerRoles) {
        console.log('GAME OVER')
        this.gameField.interactive = true;
        this.winnerText.visible = true;
        this.retryBtn.visible = true;
        if(winner !== playerRole) {
            this.winnerText.rotation = Math.PI;
            this.winnerText.y = - LayoutManager.gameHeight/4;
        }
        else {
            this.winnerText.rotation = 0;
            this.winnerText.y = LayoutManager.gameHeight/4;
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
        this.playerScore.height = w*0.1;
        this.playerScore.scale.x = this.playerScore.scale.y;
        this.enemyScore.scale.set(this.playerScore.scale.x);

        this.playerScore.position.set(w*0.49 - this.playerScore.height *0.75, - this.playerScore.width*2);
        this.enemyScore.position.set(w*0.49 - this.playerScore.height *0.75, this.enemyScore.width*2);

        this.overlay.width = w;
        this.overlay.height = h;
        this.waitingText.width = w*0.99;
        this.waitingText.scale.y = this.waitingText.scale.x;
        this.scoreText.width = w*0.2;
        this.scoreText.scale.y = this.scoreText.scale.x;

        this.winnerText.width = w*0.9;
        this.winnerText.scale.y = this.winnerText.scale.x;

        this.retryBtn.scale.set(w*0.2 / this.retryBtn.getLocalBounds().width);
    }

    tick(delta: number): void {
        this.gameField.tick(delta);
    }
}
