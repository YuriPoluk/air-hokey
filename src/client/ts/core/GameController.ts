import {preloadAssets} from '../libs/assetsLoading';
import GameScene from "./GameScene";
import {LayoutManager} from "../libs/LayoutManager";
import {socket, connect} from '../networking';
import { initState } from "../state";
import StartScreen from '../scenes/StartScreen'
import { gsap } from 'gsap';
import MainGame from "../scenes/MainGame";

export default class GameController {
    private static instance: GameController;
    layoutManager = new LayoutManager(this);
    app: PIXI.Application;
    size: {w: number, h: number};
    currentWindow!: GameScene;
    socket: SocketIOClient.Socket = socket;

    constructor(parent: HTMLCanvasElement) {
        this.size = {w: 800, h: 600};

        this.app = new PIXI.Application({
            transparent: false,
            backgroundColor : 0xf0f0f0,
            view: parent || document.body,
            antialias: true
        });

        this.app.ticker.add(this.tick, this);
        this.app.ticker.stop();
        gsap.ticker.add(() => {
            this.app.ticker.update();
        });

        this.initLayoutManager();

        //@ts-ignore
        window.GAME = this;
        window.PIXI = PIXI;

        Promise.all([preloadAssets()]).then( () => {
            initState();
            this.start();
        });
    }

    public static getInstance(): GameController {
        const parent = document.getElementById("scene") as  HTMLCanvasElement;
        if (!GameController.instance) {
            GameController.instance = new GameController(parent);
        }

        return GameController.instance;
    }

    initLayoutManager(): void {
        this.layoutManager.fitLayout();
        window.addEventListener("resize", this.onResize.bind(this));
        let resizeTimeout: any;
        window.addEventListener("resize", () => {
            if(resizeTimeout)
                clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(this.layoutManager.fitLayout.bind(this.layoutManager), 100);
        });
    }

    showWindow(w: GameScene): GameScene {
        if (this.currentWindow) this.app.stage.removeChild(this.currentWindow);
        this.app.stage.addChildAt(w, 0);
        this.currentWindow = w;
        w.position.set(this.app.renderer.width / 2, this.app.renderer.height / 2);
        w.onResize();
        return w;
    }

    onResize(): void {
        if(this.currentWindow) {
            this.currentWindow.position.set(this.app.renderer.width/2, this.app.renderer.height/2);
            if(this.currentWindow.onResize) this.currentWindow.onResize();
        }
    }

    start(): void {
        this.showWindow(new MainGame());
    }

    tick(): void {
        const delta = PIXI.Ticker.shared.elapsedMS;

        if(this?.currentWindow) {
            this.currentWindow.tick(delta);
        }
    }
}
