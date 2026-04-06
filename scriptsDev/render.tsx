import { lizardCharacters } from "./lizard";
import { Curve, Point } from "./geo";
import { Spine, updateSpine } from "./newSpine";
import { detector } from "./collide";
var app = new PIXI.Application();
// (async function () {
await app.init({ background: "#FFF", resizeTo: window, antialias: true });
document.getElementById("graphics").appendChild(app.canvas);
// })();
export let gfx = new PIXI.Graphics();
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
let blob = detector.blobloop;
export function drawBSplineSegment(p0, p1, p2, p3) {
  // Convert to Bézier control points
  let b0 = {
    x: (p0.x + 4 * p1.x + p2.x) / 6,
    y: (p0.y + 4 * p1.y + p2.y) / 6,
  };
  let b1 = {
    x: (2 * p1.x + p2.x) / 3,
    y: (2 * p1.y + p2.y) / 3,
  };
  let b2 = {
    x: (p1.x + 2 * p2.x) / 3,
    y: (p1.y + 2 * p2.y) / 3,
  };
  let b3 = {
    x: (p1.x + 4 * p2.x + p3.x) / 6,
    y: (p1.y + 4 * p2.y + p3.y) / 6,
  };
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
  // Update spine
  gfx.clear();
  // gfx.lineStyle(4, 0x000001, 1);
  // gfx.moveTo(testSpine.points[0].x, testSpine.points[0].y);
  // for (let i = 1; i < testSpine.points.length; i++) {
  //   gfx.lineTo(testSpine.points[i].x, testSpine.points[i].y);
  // }
  // gfx.closePath();
  gfx.stroke();
  lizardCharacters.myCharacter.spine = testSpine.points;
  // lizardCharacters.draw(lizardCharacters.myCharacter, gfx);
  let outline = lizardCharacters.outline(lizardCharacters.myCharacter);
  gfx.lineStyle(2, 0x0000ff, 1);
  for (var i = 0; i < outline.length; i++) {
    drawBSplineSegment(
      outline[(i - 1 + outline.length) % outline.length],
      outline[i],
      outline[(i + 1) % outline.length],
      outline[(i + 2) % outline.length],
    );
  }
  // gfx.closePath();
  gfx.stroke();
  // Draw Blob
  gfx.lineStyle(2, 0x00ff00, 1);
  gfx.moveTo(blob[2].x, blob[2].y);
  for (var i = 0; i < blob.length; i++) {
    drawBSplineSegment(
      blob[i],
      blob[(i + 1) % blob.length],
      blob[(i + 2) % blob.length],
      blob[(i + 3) % blob.length],
    );
  }
  // gfx.closePath();
  gfx.stroke();

  // Lizard Character draw bounding box
  let lizBox = detector.getCurveBoundingBoxes(outline);
  // gfx.lineStyle(1, 0xffff00, 1);
  // for (var i = 0; i < lizBox.length; i++) {
  //   let curBox = lizBox[i];
  //   gfx.moveTo(curBox[0].x, curBox[0].y);
  //   gfx.lineTo(curBox[1].x, curBox[0].y);
  //   gfx.lineTo(curBox[1].x, curBox[1].y);
  //   gfx.lineTo(curBox[0].x, curBox[1].y);
  //   gfx.lineTo(curBox[0].x, curBox[0].y);
  // }
  // gfx.stroke();

  // Blob draw bounding box
  // Lizard Character draw bounding box
  let blobBox = detector.getCurveBoundingBoxes(blob);
  // gfx.lineStyle(1, 0xffff00, 1);
  // for (var i = 0; i < blobBox.length; i++) {
  //   let curBox = blobBox[i];
  //   gfx.moveTo(curBox[0].x, curBox[0].y);
  //   gfx.lineTo(curBox[1].x, curBox[0].y);
  //   gfx.lineTo(curBox[1].x, curBox[1].y);
  //   gfx.lineTo(curBox[0].x, curBox[1].y);
  //   gfx.lineTo(curBox[0].x, curBox[0].y);
  // }
  // gfx.stroke();
  // Find collisions
  let collisionIndecies = detector.AABB(lizBox, blobBox);
  // gfx.lineStyle(1, 0xff0000, 1);
  // for (var i = 0; i < collisionIndecies.length; i++) {
  //   let collisionIndex = collisionIndecies[i];
  //   let curBox1 = lizBox[collisionIndex[0]];
  //   gfx.moveTo(curBox1[0].x, curBox1[0].y);
  //   gfx.lineTo(curBox1[1].x, curBox1[0].y);
  //   gfx.lineTo(curBox1[1].x, curBox1[1].y);
  //   gfx.lineTo(curBox1[0].x, curBox1[1].y);
  //   gfx.lineTo(curBox1[0].x, curBox1[0].y);

  //   let curBox2 = blobBox[collisionIndex[1]];
  //   gfx.moveTo(curBox2[0].x, curBox2[0].y);
  //   gfx.lineTo(curBox2[1].x, curBox2[0].y);
  //   gfx.lineTo(curBox2[1].x, curBox2[1].y);
  //   gfx.lineTo(curBox2[0].x, curBox2[1].y);
  //   gfx.lineTo(curBox2[0].x, curBox2[0].y);
  // }
  // gfx.stroke();
  // Now, draw circles at collision points. Only need to draw circles for lizard, as they are collisions and should be the same points on the blob
  // But good to check anyway
  let collisions: {t: number, u: number, add: boolean}[] = [];
  for (var i = 0; i < collisionIndecies.length; i++) {
    let collisionIndex = collisionIndecies[i];
    let curve1 = Curve.fromBSpline(
      outline[collisionIndex[0]],
      outline[(collisionIndex[0] + 1) % outline.length],
      outline[(collisionIndex[0] + 2) % outline.length],
      outline[(collisionIndex[0] + 3) % outline.length],
    );
    let curve2 = Curve.fromBSpline(
      blob[collisionIndex[1]],
      blob[(collisionIndex[1] + 1) % blob.length],
      blob[(collisionIndex[1] + 2) % blob.length],
      blob[(collisionIndex[1] + 3) % blob.length],
    );
    let collisionPoints = detector.solveCollision(curve1, curve2);
    collisions.push(...collisionPoints.map(o => ({t: o.i1 + collisionIndex[0], u: o.i2 + collisionIndex[1], add: o.add}))); 
    // for (var j = 0; j < collisionPoints.length; j++) {
    //   let collisionT = collisionPoints[j];
    //   let collisionPoint = curve1.value(curve1.coeff(), collisionT.i1);
    //   gfx.beginFill(0xffaa44, 1);
    //   gfx.drawCircle(collisionPoint.x, collisionPoint.y, 5);
    //   gfx.endFill();
    // }
  }
  // And now we can add a collider between the lizard and the blob at these collision points, and see how it reacts to forces and stuff. This is the basis for the "gameplay" of the game, as the player will be trying to get the blob to collide with the lizard in certain ways to achieve certain goals. For now, we can just draw circles at the collision points and make them repel each other or something.
  // First, fill a list of "shrinks" unaccounted by the collisions, where we have missing upper endpoint to the area integral. This will be between all integer t values between a true value and the next consecutive false value.
  let shrinks: number[] = []
  let pushingColliders: {index: number, t: number, u: number, otherCurve: Curve, add: boolean}[] = collisions.map(o => ({index: Math.floor(o.t), t: o.t % 1, u: o.u % 1, otherCurve: Curve.fromBSpline(blob[Math.floor(o.u)], blob[(Math.floor(o.u) + 1) % blob.length], blob[(Math.floor(o.u) + 2) % blob.length], blob[(Math.floor(o.u) + 3) % blob.length]), add: o.add}))
  if(collisions.length > 0){
  collisions.sort((a, b) => a.t - b.t);
  for(var i = 0; i < outline.length; i++){
    let first = collisions.findIndex(o => o.t > (i + 1) % outline.length);
    if(collisions[first == -1 ? 0 : first].add == false){
      shrinks.push(i);
    }
  }
  }
  testSpine = updateSpine(testSpine, headForce, delta.deltaTime, gfx, pushingColliders, shrinks);
  lizardCharacters.updateArms(lizardCharacters.myCharacter, [
    "walk",
    "walk",
    "walk",
    "walk",
  ]);
  gfx.closePath();
  gfx.stroke();
});