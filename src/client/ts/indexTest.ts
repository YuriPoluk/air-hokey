import {Bodies, Body, Engine, World, Render, Mouse, MouseConstraint} from "matter-js";


const FIELD_WIDTH = 250;
const FIELD_HEIGHT = 400;
const CONSTRAINT_WIDTH = 25;
const WIDTH = FIELD_WIDTH + CONSTRAINT_WIDTH*2;
const HEIGHT = FIELD_HEIGHT + CONSTRAINT_WIDTH*2;

var engine = Engine.create();

var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false
    }
});

const defaultCategory = 0x0001,
    playerCategory = 0x0002;

const playBall = Bodies.circle(50, 50, 20, {
    collisionFilter: {
        category: playerCategory,
        mask: defaultCategory | playerCategory
    }
});
playBall.restitution = 0.5;

const leftConstraint = Bodies.rectangle(CONSTRAINT_WIDTH/2, FIELD_HEIGHT/2 + CONSTRAINT_WIDTH, CONSTRAINT_WIDTH, FIELD_HEIGHT, { isStatic: true });
const rightConstraint = Bodies.rectangle(WIDTH - CONSTRAINT_WIDTH/2, FIELD_HEIGHT/2 + CONSTRAINT_WIDTH, CONSTRAINT_WIDTH, FIELD_HEIGHT, { isStatic: true });
const topConstraint = Bodies.rectangle(WIDTH/2, CONSTRAINT_WIDTH/2, WIDTH, CONSTRAINT_WIDTH, { isStatic: true });
const bottomConstraint = Bodies.rectangle(WIDTH/2, HEIGHT - CONSTRAINT_WIDTH/2, WIDTH, CONSTRAINT_WIDTH, { isStatic: true });


const half = Bodies.rectangle(WIDTH/2, HEIGHT/2 - CONSTRAINT_WIDTH - FIELD_HEIGHT/2, FIELD_WIDTH, FIELD_HEIGHT/2, {
    isStatic: true,
    collisionFilter: {
        category: playerCategory,
        mask: playerCategory
    }
});
World.add(engine.world, [leftConstraint, rightConstraint, topConstraint, bottomConstraint, playBall, half]);

engine.world.bounds = {min: {x: 0, y: 0}, max: {x: WIDTH, y: HEIGHT}};
engine.world.gravity.y = 0;
Body.applyForce(playBall, {x: 0, y: 0}, {x: 0.025, y: 0.025});

// add mouse control
// var mouse = Mouse.create(render.canvas),
//     mouseConstraint = MouseConstraint.create(engine, {
//         mouse: mouse,
//         constraint: {
//             stiffness: 0.2,
//             render: {
//                 visible: true
//             }
//         }
//     });

// World.add(engine.world, mouseConstraint);
//
// Engine.run(engine);
// Render.run(render);