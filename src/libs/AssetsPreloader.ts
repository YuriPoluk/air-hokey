import { ASSETS_CONFIG } from '../ASSETS_CONFIG'
import FontFaceObserver from 'fontfaceobserver'
import * as PIXI from 'pixi.js';

export default class AssetsPreloader {
    fontsLoaded: boolean;
    preloaderFinished: boolean;
    endCallback: () => void;

    constructor(endCallback: () => void) {
        this.fontsLoaded = false;
        this.preloaderFinished = false;
        this.endCallback = endCallback;
    }

    cdnPath(filename: string): string {
        return ("./assets/" + filename);
    }

    preload(): void {

        const loaderOptions = {
            loadType: PIXI.LoaderResource.LOAD_TYPE.IMAGE,
            xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB
        };

        for(const assetType in ASSETS_CONFIG) {
            if(assetType == 'fonts')
                continue;
            ASSETS_CONFIG[assetType].forEach((asset: string) => {
                const url = this.cdnPath(assetType + '/' + asset);
                const name = asset.split(".")[0];
                const options = assetType == 'images' ? loaderOptions : {};
                PIXI.Loader.shared.add(name, url, options);
            });
        }

        this.loadFonts();

        PIXI.Loader.shared.load(() => {
            this.preloaderFinished = true;
            this.finish();
        });
    }

    loadFonts(): void {
        const observer: Array<Promise<void>> = [];
        const styles = document?.styleSheets[0] as CSSStyleSheet;
        ASSETS_CONFIG.fonts?.forEach(font => {
            const name = font.split(".")[0];
            const url = "../assets/fonts/" + font;
            styles.insertRule(`@font-face {font-family: "${name}"; src: url("${url}");}`);
            console.log(`@font-face {font-family: "${name}"; src: url("${url}");}`);
            observer.push(new FontFaceObserver('Pangolin').load());
        });

        //@ts-ignore
        Promise.all(observer)
            .then(
                () => {
                    this.fontsLoaded = true;
                    this.finish();
                },
                //@ts-ignore
                err => {
                    console.error('Failed to load fonts!', err);
                });
    }

    finish(): void {
        if(!this.fontsLoaded) return;
        if(!this.preloaderFinished) return;

        console.log('ASSETS PRELOADING FINISHED');
        if(this.endCallback) this.endCallback();
    }
}

