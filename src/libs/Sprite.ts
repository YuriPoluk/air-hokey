class Sprite extends PIXI.Sprite {
    constructor(tex?: string | PIXI.Texture | undefined) {
        if(typeof tex == "string") {
            if(PIXI.Loader.shared.resources[tex]) {
                tex = PIXI.Loader.shared.resources[tex].texture;
            }
            else {
                try {
                    tex = PIXI.Texture.from(tex);
                }
                catch(err) {
                    console.log('no texture with such name');
                    tex = undefined;
                }
            }
        }

        super(tex);
        this.anchor.set(0.5);
    }
}

export default Sprite;