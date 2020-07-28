import '../styles/styles.css'
import GameController from './core/GameController';

GameController.getInstance();


// javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.ts/build/stats.min.ts';document.head.appendChild(script);})()
