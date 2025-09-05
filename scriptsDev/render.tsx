import { lizardCharacters } from "./lizard";
import { Point } from "./geo";
var app = new PIXI.Application();
// (async function () {
await app.init({ background: "#FFF", resizeTo: window, antialias: true });
console.log(app);
document.getElementById("graphics").appendChild(app.canvas);
// })();
let gfx = new PIXI.Graphics();
app.stage.addChild(gfx);
app.ticker.add((delta) => {
  gfx.clear();
  lizardCharacters.draw(lizardCharacters.myCharacter, gfx);
  lizardCharacters.updateSpine(
    lizardCharacters.myCharacter,
    new Point(1, 0),
    0,
    delta,
  );
  gfx.lineStyle(1, 0x000010, 1);
  gfx.moveTo(0, 0);
  gfx.lineTo(100, 100);
  gfx.closePath();
  gfx.stroke();
});
