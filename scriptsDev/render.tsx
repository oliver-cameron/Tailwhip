import { lizardCharacters } from "./lizard";
import { Point } from "./geo";
import { Spine, updateSpine } from "./newSpine";
var app = new PIXI.Application();
// (async function () {
await app.init({ background: "#FFF", resizeTo: window, antialias: true });
console.log(app);
console.log("hello")
console.log(PIXI);
document.getElementById("graphics").appendChild(app.canvas);
// })();
let gfx = new PIXI.Graphics();
let testSpine = new Spine(
  // Array(4)
  //   .fill(Point.zero)
  //   .map((o) => o.add(new Point(300 + Math.random(), 300 + Math.random()))),
  [
    new Point(200, 200),
    new Point(200, 260),
    new Point(260, 260),
    new Point(260, 200),
    new Point(260, 300),
    new Point(300, 310),
  ],
);
let keyboard = {};
window.addEventListener("keydown", (e) => {
  keyboard[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  keyboard[e.key] = false;
});
app.stage.addChild(gfx);
app.ticker.add((delta) => {
  let headForce = Point.zero;
  if (keyboard["w"]) {
    headForce = headForce.add(new Point(0, -10));
  }
  if (keyboard["a"]) {
    headForce = headForce.add(new Point(-10, 0));
  }
  if (keyboard["s"]) {
    headForce = headForce.add(new Point(0, 10));
  }
  if (keyboard["d"]) {
    headForce = headForce.add(new Point(10, 0));
  }
  // console.log(headForce);
  // Update spine

  testSpine = updateSpine(testSpine, headForce, delta.deltaTime);
  gfx.clear();
  gfx.lineStyle(4, 0x000001, 1);
  gfx.moveTo(testSpine.points[0].x, testSpine.points[0].y);
  for (let i = 1; i < testSpine.points.length; i++) {
    gfx.lineTo(testSpine.points[i].x, testSpine.points[i].y);
  }
  // gfx.closePath();
  gfx.stroke();

  // lizardCharacters.draw(lizardCharacters.myCharacter, gfx);
  // lizardCharacters.updateSpine(
  //   lizardCharacters.myCharacter,
  //   new Point(1, Math.sin(Date.now() / 200) * 50),
  //   0,
  //   delta,
  // );
  // lizardCharacters.updateArms(lizardCharacters.myCharacter, [
  //   "walk",
  //   "walk",
  //   "walk",
  //   "walk",
  // ]);
  // gfx.lineStyle(1, 0x000010, 1);
  // gfx.moveTo(0, 0);
  // gfx.lineTo(100, 100);
  // gfx.closePath();
  // gfx.stroke();
});
