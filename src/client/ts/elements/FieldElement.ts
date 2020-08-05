import Sprite from "../libs/Sprite";
import { gsap } from 'gsap';

export default class FieldElement extends Sprite {
    view: Sprite;
    viewGlow: Sprite;
    currentTimeline: gsap.core.Timeline | null = null;

    constructor(assetName: string) {
        super();
        this.view = this.addChild(new Sprite(assetName));
        this.viewGlow = this.addChild(new Sprite(assetName + '_e'));
        this.viewGlow.alpha = 0;
    }

    glowUp() {
        if(this.currentTimeline) {
            this.currentTimeline.kill();
        }

        this.currentTimeline = gsap.timeline();

        this.currentTimeline
            .to(this.viewGlow, {
                duration: 0.15*(1 - this.viewGlow.alpha),
                alpha: 1,
            })
            .to(this.viewGlow, {
                duration: 0.15,
                alpha: 0,
            })
    }
}