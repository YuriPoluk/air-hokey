import Sprite from '../libs/Sprite'
import {LayoutManager} from '../libs/LayoutManager';
import GameScene from "../core/GameScene";
import GameField from '../elements/GameField';
import {PlayerRoles} from '../../../shared/PlayerRoles';
import Constants from "../../../shared/Constants";
import { getRectangleSprite } from "../../../shared/Utils";
import sound from 'pixi-sound';
import {connect} from "../networking";
import { gsap } from 'gsap';



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
    goalText!: PIXI.Text;
    retryBtn!: Sprite;
    playBtn!: Sprite;
    role!: PlayerRoles;
    currentTimeline!: gsap.core.Timeline;

    interactive = true;

    constructor() {
        super();
        this.createChildren();

        this.playBtn.once('pointerdown', async () => {
            this.playBtn.interactive = false;
            this.playBtnAnimation();
            await connect();
        })

        this.retryBtn.on('pointerdown',() => {
            location.reload();
        })

        this.gameController.socket.on(Constants.SOCKET_GOAL_EVENT, this.onGoal.bind(this));
        this.gameController.socket.on(Constants.SOCKET_PLAYERS_READY, this.startGame.bind(this));
        this.gameController.socket.on(Constants.SOCKET_GAME_OVER_EVENT, this.onGameOver.bind(this));
        this.gameController.socket.on(Constants.SOCKET_ROLE_ASSIGN, (role: PlayerRoles) => {
            this.role = role;
            if(this.role == PlayerRoles.Player2) {
                this.gameField.scale.set(-this.gameField.scale.x, -this.gameField.scale.y);
            }
            this.gameField.setRole(this.role);
        });
    }

    createChildren(): void {
        this.gameField = this.addChild(new GameField());
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

        this.waitingText = this.UICnt.addChild(new PIXI.Text('WAITING FOR OTHER PLAYER', scoreStyle));
        this.waitingText.anchor.set(0.5);
        this.waitingText.alpha = 0;

        this.scoreText = this.UICnt.addChild(new PIXI.Text('3', scoreStyle));
        this.scoreText.anchor.set(0.5);
        this.scoreText.visible = false;

        this.goalText = this.UICnt.addChild(new PIXI.Text('GOAL!', scoreStyle));
        this.goalText.anchor.set(0.5);
        this.goalText.alpha = 0;

        this.winnerText = this.UICnt.addChild(new PIXI.Text('WINNER!', scoreStyle));
        this.winnerText.anchor.set(0.5);
        this.winnerText.alpha = 0;

        this.retryBtn = this.UICnt.addChild(new Sprite('retry_btn'));
        this.retryBtn.alpha = 0;
        this.retryBtn.interactive = true;

        this.playBtn = this.UICnt.addChild(new Sprite('play'));
        this.playBtn.interactive = true;
    }

    playBtnAnimation() {
        this.currentTimeline = gsap.timeline();
        this.currentTimeline
            .to(this.playBtn, {
                alpha: 0,
                duration: 0.3
            })
            .to(this.waitingText, {
                alpha: 1,
                duration: 0.3
            })
    }

    celebrateAnimation(e: PlayerRoles, event: 'goal' | 'win') {
        let timeline = gsap.timeline();
        let rotationStart: number, rotationEnd: number, yEnd: number;
        let text = event == 'goal' ? this.goalText : this.winnerText;
        if(e == this.role) {
            rotationStart = Math.PI;
            rotationEnd = 0;
            yEnd = LayoutManager.gameHeight*0.2;
        }
        else {
            rotationStart = 0;
            rotationEnd = Math.PI;
            yEnd = - LayoutManager.gameHeight*0.2;
        }

        timeline
            .fromTo(text, {
                y: 0,
                rotation: rotationStart
            }, {
                y: yEnd,
                rotation: rotationEnd,
                duration: 0.5,
                onStart: () => { text.alpha = 1 },
            })
            .to(this.goalText, {
                alpha: 0,
                duration: 0.5
            })
    }

    startGame() {
        this.scoreText.visible = true;
        if(this.currentTimeline)
            this.currentTimeline.progress(1);

        this.currentTimeline = gsap.timeline();
        this.currentTimeline
            .to([this.overlay, this.waitingText], {
                alpha: 0,
                duration: 0.5,
                onComplete: () => { this.scoreText.alpha = 1 }
            })
            .to({}, {
                duration: 1,
                onComplete: () => { this.scoreText.text = '2' }
            })
            .to({}, {
                duration: 1,
                onComplete: () => { this.scoreText.text = '1' }
            })
            .to({}, {
                duration: 1,
                onComplete: () => {
                    this.scoreText.visible = false;
                    this.gameField.interactive = true;
                }
            })
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
        if(parseInt(this.playerScore.text) < Constants.PLAY_TO_SCORE && parseInt(this.enemyScore.text) < Constants.PLAY_TO_SCORE) {
            this.celebrateAnimation(e, 'goal');
            this.gameField.onGoal();
        }
    }

    onGameOver(winner: PlayerRoles) {
        gsap.to(this.retryBtn, {
            alpha: 1,
            duration: 0.5
        });
        this.celebrateAnimation(winner, 'win')
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

        this.playerScore.position.set(w*0.49 - this.playerScore.height *0.75, this.playerScore.width*2);
        this.enemyScore.position.set(w*0.49 - this.playerScore.height *0.75, - this.enemyScore.width*2);

        this.overlay.width = w;
        this.overlay.height = h;

        this.waitingText.width = w*0.99;
        this.waitingText.scale.y = this.waitingText.scale.x;
        this.waitingText.y = -h*0.2;

        this.scoreText.width = w*0.2;
        this.scoreText.scale.y = this.scoreText.scale.x;

        this.goalText.width = w*0.5;
        this.goalText.scale.y = this.winnerText.scale.x;

        this.winnerText.width = w*0.9;
        this.winnerText.scale.y = this.winnerText.scale.x;

        this.retryBtn.scale.set(w*0.2 / this.retryBtn.getLocalBounds().width);

        this.playBtn.scale.set(w*0.25 / this.playBtn.getLocalBounds().width);
    }

    tick(delta: number): void {
        this.gameField.tick(delta);
    }
}
