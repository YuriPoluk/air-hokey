import Sprite from './libs/Sprite'
import {LayoutManager, Orientation} from './libs/LayoutManager';
import GameScene from "./GameScene";
import {Engine, World, Bodies, Body} from 'matter-js';
import GameField from './GameField';


export default class MainGame extends GameScene  {
    gameField!: GameField;
    UICnt!: PIXI.Sprite;
    player1Score!: PIXI.Text;
    player2Score!: PIXI.Text;
    pauseIcon!: Sprite;


    interactive = false;

    constructor() {
        super();
        this.createChildren();

        this.gameField.on('GOAL', this.onGoal, this);
    }

    createChildren(): void {
        this.gameField = this.addChild(new GameField());
        this.UICnt = this.addChild(new Sprite());
        const scoreStyle = new PIXI.TextStyle({
            fontFamily: "main",
            fontSize: 36,
            fill: "white",
            stroke: '#000000',
            strokeThickness: 2,
        });
        this.player1Score = this.addChild(new PIXI.Text('0', scoreStyle));
        this.player1Score.anchor.set(0.5);
        this.player2Score = this.addChild(new PIXI.Text('0', scoreStyle));
        this.player2Score.anchor.set(0.5);
        this.pauseIcon = this.UICnt.addChild(new Sprite('pause_icon'));
        this.pauseIcon.rotation = this.player1Score.rotation = this.player2Score.rotation = Math.PI/2
    }

    onGoal(e: string) {
        if(e == '1') {
            this.player1Score.text = (parseInt(this.player1Score.text) + 1) + '';
        }
        else if(e == '2') {
            this.player2Score.text = (parseInt(this.player1Score.text) + 1) + '';
        }
    }

    onResize(): void {
        const w = LayoutManager.gameWidth;
        const h = LayoutManager.gameHeight;
        const ratio = w/h;

        if(ratio <= this.gameField.FIELD_RATIO) {
            this.gameField.scale.set((w*0.95) / this.gameField.FIELD_WIDTH);
        }
        else {
            this.gameField.scale.set((h*0.95) / this.gameField.FIELD_HEIGHT);
        }

        this.gameField.position.set(0, 0);

        this.pauseIcon.scale.set(w*0.1 / this.pauseIcon.getLocalBounds().height);
        this.player1Score.height = w*0.1;
        this.player1Score.scale.x = this.player1Score.scale.y;
        this.player2Score.scale.set(this.player1Score.scale.x);

        this.pauseIcon.position.set(w*0.49 - this.pauseIcon.height*0.75, 0);
        this.player1Score.position.set(this.pauseIcon.x, - this.player1Score.width*2);
        this.player2Score.position.set(this.pauseIcon.x, this.player2Score.width*2);
    }

    tick(delta: number): void {
        this.gameField.tick(delta);
    }
}
