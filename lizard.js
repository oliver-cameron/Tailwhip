const app = new PIXI.Application();
await app.init({ background: "#000", resizeTo: window, antialias: true });
document.body.appendChild(app.canvas);
const pointCount = 6;
class Character {
  constructor() {
    this.bodyShape = [
      { index: 0, offset: new Point(0, 0) },
      { index: 1, offset: new Point(0, 0) },
      { index: 2, offset: new Point(0, 0) },
      { index: 3, offset: new Point(0, 0) },
    ];
    this.points = Point.origin(pointCount).map((o) =>
      o.add(new Point(Math.random() + 200, Math.random() + 200)),
    );
    this.oldPoints = this.points.map((p) => new Point(p.x, p.y));
  }
  update() {
    // Character Movement
    if (keys["ArrowLeft"]) {
      this.points[0].x -= 2;
    }
    if (keys["ArrowRight"]) {
      this.points[0].x += 2;
    }
    if (keys["ArrowUp"]) {
      this.points[0].y -= 2;
    }
    if (keys["ArrowDown"]) {
      this.points[0].y += 2;
    }
    // Body Movement
    for (var i = 0; i < this.points.length; i++) {
      let vel = this.points[i].subtract(this.oldPoints[i]).multiply(0.5);
      this.oldPoints[i].x = this.points[i].x;
      this.oldPoints[i].y = this.points[i].y;
      this.points[i] = this.points[i].add(vel);
    }
    for (var i = 0; i < this.points.length - 1; i++) {
      this.points[i + 1] = Character.scale(
        this.points[i],
        this.points[i + 1],
        linelength,
        0,
      );
    }
    for (var i = 0; i < this.points.length - 2; i++) {
      this.points[i + 2] = Character.spring(
        this.points[i],
        this.points[i + 1],
        this.points[i + 2],
        linelength,
        0.5,
        0.1,
      );
    }
  }
  // Body Space
  bspace(point, index) {
    // Find secant line
    const spoints = [
      this.points[index == 0 ? 0 : index - 1],
      this.points[index == pointCount ? 0 : index + 1],
    ];
    const secant = spoints[0].subtract(spoints[1]).normalise();
    // Rotate point by secant point
    var rpoint = new Point(
      secant.x * point.x - secant.y * point.y,
      secant.x * point.y + secant.y * point.x,
    );
    return rpoint.add(this.points[index]);
  }
  draw() {
    let count = this.bodyShape.length;
    let bodyPoints = this.bodyShape.map((p) => {
      return this.bspace(p.offset, p.index);
    });
    gfx.lineStyle(2, 0xff0000);
    gfx.moveTo(bodyPoints[0].x, bodyPoints[0].y);
    for (var i = 1; i < count; i++) {
      drawKSplineSegment(
        bodyPoints[i % count],
        bodyPoints[(i + 1) % count],
        bodyPoints[(i + 2) % count],
        bodyPoints[(i + 3) % count],
      );
    }
    gfx.stroke();
    gfx.closePath();
  }
  static scale(p1, p2, dist) {
    const vec = p2.subtract(p1);
    const length = vec.length();
    const scale = dist / length;
    const scaledVec = vec.multiply(scale);
    return p1.add(scaledVec);
  }
  static spring(p1, p2, p3, lengthApprox, thresholdCos = 0.5, stiffness = 0.1) {
    let vec1 = p2.subtract(p1);
    let vec2 = p3.subtract(p2);
    let dot = Point.dotProduct(vec1, vec2);
    let normDot = dot / lengthApprox ** 2;
    if (normDot >= thresholdCos) {
      return p3;
    }
    const strength = (thresholdCos - normDot) / thresholdCos;
    let newB = new Point(
      vec2.x + stiffness * strength * (vec1.x - vec2.x),
      vec2.y + stiffness * strength * (vec1.y - vec2.y),
    );
    const norm = newB.length();
    return newB.multiply(lengthApprox / norm).add(p2);
  }
}
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  length() {
    return Math.hypot(this.x, this.y);
  }
  normalise() {
    const length = this.length();
    if (length === 0) return new Point(0, 0);
    return new Point(this.x / length, this.y / length);
  }
  static midpoint(p1, p2) {
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  }
  add(p) {
    return new Point(this.x + p.x, this.y + p.y);
  }
  subtract(p) {
    return new Point(this.x - p.x, this.y - p.y);
  }
  multiply(scalar) {
    return new Point(this.x * scalar, this.y * scalar);
  }
  static fromArray(arr) {
    return new Point(arr[0], arr[1]);
  }
  static origin(amount = 1) {
    if (amount > 1) {
      return Array.from({ length: amount }, () => new Point(0, 0));
    }
    return new Point(0, 0);
  }
  static dotProduct(p1, p2) {
    return p1.x * p2.x + p1.y * p2.y;
  }
}
var linelength = 50;
var keys = {};
var player = new Character();
let gfx = new PIXI.Graphics();
function drawCharacter(time) {
  gfx.clear();
  player.update();
  player.draw();
  gfx.stroke({ color: 0xff0000, pixelLine: true });
}
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
  gfx.bezierCurveTo(b1.x, b1.y, b2.x, b2.y, b3.x, b3.y);
}
app.ticker.add((delta) => {
  drawCharacter(performance.now());
});
app.stage.addChild(gfx);
window.addEventListener("resize", () => {
  app.resize();
});
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
window.logCharacter = () => {
  console.log(player);
};
