import { ASSETS_CONFIG } from '../configs/ASSETS_CONFIG'
import FontFaceObserver from 'fontfaceobserver'
import * as PIXI from 'pixi.js';

const cdnPath = (filename: string): string => {
    return ("./assets/" + filename);
}

export const preloadAssets = (): Promise<void[]> => {
    return Promise.all([loadPixiAssets(), loadFonts()]);
}

const loadPixiAssets = (): Promise<void> => {
    return new Promise(resolve => {
        const loaderOptions = {
            loadType: PIXI.LoaderResource.LOAD_TYPE.IMAGE,
            xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB
        };

        for(const assetType in ASSETS_CONFIG) {
            if(assetType == 'fonts')
                continue;
            ASSETS_CONFIG[assetType].forEach((asset: string) => {
                const url = cdnPath(assetType + '/' + asset);
                const name = asset.split(".")[0];
                const options = assetType == 'images' ? loaderOptions : {};
                PIXI.Loader.shared.add(name, url, options);
            });
        }

        PIXI.Loader.shared.load(() => {
            resolve();
        });
    });
}

const loadFonts = (): Promise<void> => {
    const observer: Array<Promise<void>> = [];
    const styles = document?.styleSheets[0] as CSSStyleSheet;
    ASSETS_CONFIG.fonts?.forEach((font: any) => {
        const name = font.split(".")[0];
        const url = "../assets/fonts/" + font;
        styles.insertRule(`@font-face {font-family: "${name}"; src: url("${url}");}`);
        console.log(`@font-face {font-family: "${name}"; src: url("${url}");}`);
        observer.push(new FontFaceObserver('Pangolin').load());
    });

    //@ts-ignore
    return Promise.all(observer)
        .then(
            () => {
                console.log('fonst loaded')
            },
            //@ts-ignore
            err => {
                console.error('Failed to load fonts!', err);
            });
}

