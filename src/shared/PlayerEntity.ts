import {Bodies, Body, Engine, World, Constraint, MouseConstraint} from "matter-js";


export default class PlayerEntity {

    constructor(public body: Body, public constraint?: Constraint) { }

}