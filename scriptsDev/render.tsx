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
function drawKSplineSegment(p0, p1, p2, p3) {
  // Convert to Bézier control points
  let b0 = p1;
  let b1 = {
    x: p1.x - 0.25 * p0.x + 0.25 * p2.x,
    y: p1.y - 0.25 * p0.y + 0.25 * p2.y,
  };
  let b2 = {
    x: 0.25 * p1.x + p2.x - 0.25 * p3.x,
    y: 0.25 * p1.y + p2.y - 0.25 * p3.y,
  };
  let b3 = p2;
  gfx.moveTo(b0.x, b0.y);
  gfx.bezierCurveTo(b1.x, b1.y, b2.x, b2.y, b3.x, b3.y);
}
app.stage.addChild(gfx);
app.ticker.add((delta) => {
  let headForce = Point.zero;
  if (keyboard["w"]) {
    headForce = headForce.add(new Point(0, -100));
  }
  if (keyboard["a"]) {
    headForce = headForce.add(new Point(-100, 0));
  }
  if (keyboard["s"]) {
    headForce = headForce.add(new Point(0, 100));
  }
  if (keyboard["d"]) {
    headForce = headForce.add(new Point(100, 0));
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
  lizardCharacters.myCharacter.spine = testSpine.points;
  // lizardCharacters.draw(lizardCharacters.myCharacter, gfx);
  let outline = lizardCharacters.outline(lizardCharacters.myCharacter);
  gfx.lineStyle(2, 0x0000ff, 1);
  gfx.moveTo(outline[0].x, outline[0].y);
  for (var i = 0; i < outline.length; i++) {
    drawKSplineSegment(
      outline[(i - 1 + outline.length) % outline.length],
      outline[i],
      outline[(i + 1) % outline.length],
      outline[(i + 2) % outline.length],
    )
  }
  gfx.closePath();
  gfx.stroke();
  lizardCharacters.updateArms(lizardCharacters.myCharacter, [
    "walk",
    "walk",
    "walk",
    "walk",
  ]);
  gfx.lineStyle(1, 0x000010, 1);
  gfx.moveTo(0, 0);
  gfx.lineTo(100, 100);
  gfx.closePath();
  gfx.stroke();
});
