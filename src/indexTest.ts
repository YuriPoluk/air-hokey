import {Bodies, Body, Engine, World, Render, Composite} from "matter-js";


var engine = Engine.create();

var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: 250,
        height: 400,
        wireframes: false
    }
});
console.log(engine)
const leftConstraint = Bodies.rectangle(0, 200, 1, 400, { isStatic: true });
const rightConstraint = Bodies.rectangle(251, 200, 1, 400, { isStatic: true });
const topConstraint = Bodies.rectangle(125, 0, 250, 1, { isStatic: true });
const bottomConstraint = Bodies.rectangle(125, 401, 250, 1, { isStatic: true });
const blackPhysic = Bodies.circle(125, 225, 20);

World.add(engine.world, [leftConstraint, rightConstraint, topConstraint, bottomConstraint, blackPhysic]);
engine.world.bounds = {min: {x: 0, y: 0}, max: {x: 251, y: 401}};
engine.world.gravity.y = 0;
Body.applyForce(blackPhysic, {x: 0, y: 0}, {x: 0.01, y: 0.01});

Engine.run(engine);
Render.run(render);