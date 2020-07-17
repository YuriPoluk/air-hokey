import CONFIG from '../Config';
import GameController from '../GameController';

export enum Orientation { PORTRAIT, LANDSCAPE}

export class LayoutManager {
    private static instance: LayoutManager;
    static width = 0;
    static height = 0;
    static gameWidth = 0;
    static gameHeight = 0;
    static orientation: Orientation;
    private gameController: GameController;

    constructor(gameController: GameController) {
        this.gameController = gameController;
    }

    fitLayout(): void {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if(LayoutManager.width === w && LayoutManager.height === h) return;

        this.gameController.app.view.style.width = w + "px";
        this.gameController.app.view.style.height = h + "px";

        LayoutManager.orientation = w > h ? Orientation.LANDSCAPE : Orientation.PORTRAIT;

        if (!CONFIG.portraitEnabled) LayoutManager.orientation = Orientation.LANDSCAPE;
        if (!CONFIG.landscapeEnabled) LayoutManager.orientation = Orientation.PORTRAIT;

        const gameRatio = this.gameController.size.w / this.gameController.size.h;
        const canvasRatio = w/h;
        let gw, gh;//new renderer dimentions

        if(gameRatio > canvasRatio) {
            gh = this.gameController.size.h;
            gw = Math.floor(gh * canvasRatio);
        }
        else {
            gw = this.gameController.size.w;
            gh = Math.floor(gw * canvasRatio);
        }

        if(LayoutManager.orientation == Orientation.LANDSCAPE) {
            const temp = gw;
            gw = gh;
            gh = temp;
        }


        LayoutManager.gameWidth = gw;
        LayoutManager.gameHeight = gh;

        this.gameController.app.renderer.resize(gw, gh);
        this.gameController.onResize();
    }
}