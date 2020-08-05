import Sprite from "../client/ts/libs/Sprite";
import GameController from "../client/ts/core/GameController";
import Constants from "./Constants";

interface Vector {
    x: number,
    y: number
}

export const getRectangleSprite = (width: number, height: number, gameController: GameController, color?: number): Sprite => {
    const rectangle = new PIXI.Graphics();
    if(color === undefined) {
        color = 0xff0000;
    }
    rectangle.beginFill(color);
    rectangle.drawRect(0, 0, width, height);
    rectangle.endFill();
    // rectangle.alpha = 0.35;
    //@ts-ignore
    //TODO investigate, probably types mistake
    return new Sprite(gameController.app.renderer.generateTexture(rectangle));
}

export const getCollisionPoint = (collisionData: any, colliderType: 'wall' | 'striker'): {x: number, y: number} => {
    console.log(Constants.PUCK_REL_WIDTH)
    if(colliderType == 'striker') {
        const vectorToStriker = {x: collisionData.pos.x - collisionData.puckPos.x, y: collisionData.pos.y - collisionData.puckPos.y};
        const normalisedVector = normalizeVector(vectorToStriker);
        return {
            x: collisionData.puckPos.x + Constants.PUCK_WIDTH*0.5 * normalisedVector.x,
            y: collisionData.puckPos.y + Constants.PUCK_WIDTH*0.5 * normalisedVector.y,
        };
    }
    else {
        if(collisionData.puckPos.x <= Constants.CONSTRAINT_WIDTH + Constants.PLAYER_WIDTH/2) {
            return {
                x: Constants.CONSTRAINT_WIDTH,
                y: collisionData.puckPos.y
            }
        }
        else if(collisionData.puckPos.x >= Constants.WIDTH - Constants.CONSTRAINT_WIDTH - Constants.PUCK_WIDTH/2) {
            return {
                x: Constants.WIDTH - Constants.CONSTRAINT_WIDTH,
                y: collisionData.puckPos.y
            }
        }
        else if(collisionData.puckPos.y >= Constants.HEIGHT - Constants.CONSTRAINT_WIDTH - Constants.PUCK_WIDTH/2) {
            return {
                x: collisionData.puckPos.x,
                y: Constants.HEIGHT - Constants.CONSTRAINT_WIDTH,

            }
        }
        else {
            return {
                x: collisionData.puckPos.x,
                y: Constants.CONSTRAINT_WIDTH,
            }
        }
    }
}

const normalizeVector = (vector: Vector): Vector => {
    const magnitude = Math.sqrt(vector.x*vector.x + vector.y*vector.y);
    vector.x /= magnitude;
    vector.y /= magnitude;
    return vector;
}