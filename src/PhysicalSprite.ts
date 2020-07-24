import Sprite from './libs/Sprite';
import { Body } from 'matter-js'

export default class PhysicalSprite {

    constructor(public view: Sprite, public body: Body) {
        this.update();
    }

    update() {
        this.view.position.set(this.body.position.x, this.body.position.y);
    }

}