// Classes
class Character {
  constructor() {
    const dub = (p) => {
      return p.concat(
        p
          .map((o) => ({
            index: o.index,
            offset: new Point(o.offset.x, -o.offset.y),
          }))
          .reverse(),
      );
    };
    this.limbDefs = [
      {
        name: "leftArm",
        index: 1,
        offset: new Point(0, -15),
        resetOffset: new Point(-5, -60),
        sign: -1,
        returning: false,
      },
      {
        name: "rightArm",
        index: 1,
        offset: new Point(0, 15),
        resetOffset: new Point(5, 60),
        sign: 1,
        returning: false,
      },
      {
        name: "leftLeg",
        index: 3,
        offset: new Point(0, -5),
        resetOffset: new Point(-5, -50),
        sign: 1,
        returning: false,
      },
      {
        name: "rightLeg",
        index: 3,
        offset: new Point(0, 5),
        resetOffset: new Point(5, 50),
        sign: -1,
        returning: false,
      },
    ];
    this.bodyShape = dub([
      { index: 5, offset: new Point(0, 4) },
      { index: 4, offset: new Point(0, 7) },
      { index: 3, offset: new Point(0, 10) },
      { index: 2, offset: new Point(-15, 20) },
      { index: 1, offset: new Point(0, 16) },
      { index: 0, offset: new Point(0, 20) },
      { index: 0, offset: new Point(20, 10) },
    ]);
    this.arms = {
      leftArm: Array.from({ length: 3 }, () => new Point(0, 0)),
      rightArm: Array.from({ length: 3 }, () => new Point(0, 0)),
      leftLeg: Array.from({ length: 3 }, () => new Point(0, 0)),
      rightLeg: Array.from({ length: 3 }, () => new Point(0, 0)),
    };
    this.points = Point.origin(pointCount).map((o) =>
      o.add(new Point(Math.random() + 500, Math.random() + 500)),
    );
    this.oldPoints = this.points.map((p) => new Point(p.x, p.y));
    // Initialize arms
    for (var limb of this.limbDefs) {
      this.arms[limb.name][0] = this.fromBSpace(limb.offset, limb.index);
      this.arms[limb.name][2] = this.fromBSpace(limb.resetOffset, limb.index);
      this.arms[limb.name][1] = Point.midpoint(
        this.arms[limb.name][0],
        this.arms[limb.name][2],
      );
      //   .multiply(-armLength)
      //   .add(this.arms[limb.name][0]);
      limb.pointMap = this.resetOffset;
    }
  }
  update() {
    let forward = 5;
    // Character Movement
    if (keys["KeyA"]) {
      this.points[0].x -= 5;
    }

    if (keys["KeyD"]) {
      this.points[0].x += 5;
    }
    if (keys["KeyW"]) {
      this.points[0].y -= 5;
    }
    if (keys["KeyS"]) {
      this.points[0].y += 5;
    }
    if (keys["KeyJ"]) {
      this.points[pointCount - 1] = this.fromBSpace(
        new Point(0, -5),
        pointCount - 1,
      );
    }
    if (keys["KeyL"]) {
      this.points[pointCount - 1] = this.fromBSpace(
        new Point(0, 5),
        pointCount - 1,
      );
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
      );
    }
    for (var i = 0; i < this.points.length - 2; i++) {
      this.points[i + 2] = Character.spring(
        this.points[i],
        this.points[i + 1],
        this.points[i + 2],
        linelength,
        0.7,
        0.3,
      );
    }
    let multiplyPoint = (p1, p2) =>
      new Point(p1.x * p2.x - p1.y * p2.y, p1.x * p2.y + p1.y * p2.x);
    gfx.lineStyle(2, 0x8800ff);
    // Arms and legs
    let armTravel = 30;

    for (var limb of this.limbDefs) {
      if (limb.returning) {
        this.arms[limb.name][2] = this.fromBSpace(limb.pointMap, limb.index);
      }
      this.arms[limb.name][0] = this.fromBSpace(limb.offset, limb.index);
      if (
        this.arms[limb.name][2]
          .subtract(this.fromBSpace(limb.resetOffset, limb.index))
          .length() > armTravel ||
        // If the first segment of the arm is inside the body
        this.toBSpace(this.arms[limb.name][1], limb.index).y < limb.offset.y ||
        // If the second segment of the arm is inside the body
        this.toBSpace(this.arms[limb.name][2], limb.index).y < limb.offset.y
      ) {
        limb.returning = true;
      }
      if (
        this.arms[limb.name][2]
          .subtract(this.fromBSpace(limb.offset, limb.index))
          .length() >
        2 * armLength
      ) {
        this.arms[limb.name][2] = Character.scale(
          this.arms[limb.name][0],
          this.arms[limb.name][2],
          armLength,
        );
      }
      if (
        this.arms[limb.name][2]
          .subtract(this.fromBSpace(limb.resetOffset, limb.index))
          .length() < 5
      ) {
        limb.returning = false;
      }

      let secant = this.arms[limb.name][0].subtract(this.arms[limb.name][2]);
      let angle = Math.acos(secant.length() / (2 * armLength));
      let toPoint = (a, sign) => new Point(Math.cos(a), Math.sin(a) * sign);
      this.arms[limb.name][1] = multiplyPoint(
        toPoint(angle ?? 1, limb.sign),
        secant.normalise(),
      )
        .multiply(-armLength)
        .add(this.arms[limb.name][0]);
    }
    let t = 0.4;
    if (limb.returning) {
      let targetHand = this.fromBSpace(limb.resetOffset, limb.index);
      let targetOffset = this.fromBSpace(limb.offset, limb.index);
      let dlength =
        targetOffset.subtract(targetHand).length() / (armLength * 2);
      let normLength = targetOffset.subtract(targetHand).normalise();
      let doff = Math.acos(dlength);
      let toPoint = (a, sign) => new Point(Math.cos(a), Math.sin(a) * sign);
      let destJoint = multiplyPoint(toPoint(doff, limb.sign), normLength)
        .multiply(-armLength)
        .add(targetOffset);
      let theta1 = Math.acos(
        Point.dotProduct(
          this.arms[limb.name][1].subtract(this.arms[limb.name][0]).normalise(),
          destJoint.subtract(this.arms[limb.name][0]).normalise(),
        ),
      );
      let theta2 = Math.acos(
        Point.dotProduct(
          this.arms[limb.name][2].subtract(this.arms[limb.name][1]).normalise(),
          targetOffset.subtract(destJoint).normalise(),
        ),
      );
      this.arms[limb.name][1] = Point.lerp(
        this.arms[limb.name][1],
        destJoint,
        this.sl(t, theta1),
      );
      this.arms[limb.name][2] = Point.lerp(
        this.arms[limb.name][2].subtract(this.arms[limb.name][1]),
        targetHand.subtract(destJoint),
        this.sl(t, theta2),
      ).add(this.arms[limb.name][1]);
      gfx.moveTo(targetOffset.x, targetOffset.y);
      gfx.lineTo(destJoint.x, destJoint.y);
      gfx.lineTo(targetHand.x, targetHand.y);
    }
    gfx.stroke();
    gfx.closePath();
    limb.pointMap = this.toBSpace(this.arms[limb.name][2], limb.index);
  }
  sl(t, theta) {
    return (
      Math.tan(t * theta) /
      (Math.sin(theta) + (1 - Math.cos(theta)) * Math.tan(t * theta))
    );
  }
  // Inverse Kinematics
  IK() {}
  // Body Space
  fromBSpace(point, index) {
    // Find secant line
    const spoints = [
      this.points[index == 0 ? 0 : index - 1],
      this.points[index == pointCount - 1 ? index : index + 1],
    ];
    const secant = spoints[0].subtract(spoints[1]).normalise();
    // Rotate point by secant point
    var rpoint = new Point(
      secant.x * point.x - secant.y * point.y,
      secant.x * point.y + secant.y * point.x,
    );
    return rpoint.add(this.points[index]);
  }
  // Convert from world space to body space
  // This is the inverse of fromBSpace
  toBSpace(point, index) {
    // Find secant line
    const spoints = [
      this.points[index == 0 ? 0 : index - 1],
      this.points[index == pointCount - 1 ? index : index + 1],
    ];
    const secant = spoints[0].subtract(spoints[1]).normalise();
    // Rotate point by secant point
    var subPoint = point.subtract(this.points[index]);
    var rpoint = new Point(
      secant.x * subPoint.x + secant.y * subPoint.y,
      -secant.x * subPoint.y + secant.y * subPoint.x,
    );
    return rpoint;
  }
  draw() {
    let count = this.bodyShape.length;
    let bodyPoints = this.bodyShape.map((p) => {
      return { leaf: this.fromBSpace(p.offset, p.index), branch: p.index };
    });
    gfx.lineStyle(2, 0xff0000);
    gfx.moveTo(bodyPoints[0].x, bodyPoints[0].y);
    for (var i = 0; i < count; i++) {
      drawKSplineSegment(
        bodyPoints[i % count].leaf,
        bodyPoints[(i + 1) % count].leaf,
        bodyPoints[(i + 2) % count].leaf,
        bodyPoints[(i + 3) % count].leaf,
      );
    }
    gfx.stroke();
    gfx.closePath();
    gfx.lineStyle(1, 0x00ff00);
    gfx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 0; i < this.points.length; i++) {
      gfx.lineTo(this.points[i].x, this.points[i].y);
    }
    gfx.stroke();
    gfx.closePath();
    gfx.lineStyle(1, 0x0000ff);
    for (let i = 0; i < bodyPoints.length; i++) {
      gfx.moveTo(bodyPoints[i].leaf.x, bodyPoints[i].leaf.y);
      gfx.lineTo(
        this.points[bodyPoints[i].branch].x,
        this.points[bodyPoints[i].branch].y,
      );
    }
    gfx.stroke();
    gfx.closePath();
    // Draw arms
    gfx.lineStyle(2, 0xff00ff);
    for (let armName of ["leftArm", "rightArm", "leftLeg", "rightLeg"]) {
      let arm = this.arms[armName];
      gfx.moveTo(arm[0].x, arm[0].y);
      for (let i = 1; i < arm.length; i++) {
        gfx.lineTo(arm[i].x, arm[i].y);
      }
    }
    gfx.stroke();
    gfx.closePath();

    gfx.lineStyle(2, 0xffff00);
    for (let armName of ["leftArm", "rightArm", "leftLeg", "rightLeg"]) {
      let arm = this.arms[armName];
      gfx.moveTo(arm[0].x, arm[0].y);
      gfx.bezierCurveTo(
        arm[1].x,
        arm[1].y,
        arm[1].x,
        arm[1].y,
        arm[2].x,
        arm[2].y,
      );
    }
    gfx.stroke();
    gfx.closePath();
    // gfx.lineStyle(2, 0x00ffff);
    // gfx.moveTo(this.bspace(new Point(0, -5), 1).x, this.bspace(new Point(0, -5), 1).y);
    // gfx.lineTo(this.bspace(new Point(-5, -50), 1).x, this.bspace(new Point(-5, -50), 1).y);
    // gfx.stroke();
    // gfx.closePath();
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
  static lerp(a, b, t) {
    return new Point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
// Main Application
const app = new PIXI.Application();
await app.init({ background: "#FFF", resizeTo: window, antialias: true });
document.getElementById("graphics").appendChild(app.canvas);
const pointCount = 6;
var linelength = 50;
let armLength = 40;
var keys = {};
var player = new Character();
let gfx = new PIXI.Graphics();
function drawCharacter(time) {
  gfx.clear();
  player.update();
  player.draw();
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
  gfx.moveTo(b0.x, b0.y);
  gfx.bezierCurveTo(b1.x, b1.y, b2.x, b2.y, b3.x, b3.y);
}
window.play = () => {
  app.stage.addChild(gfx);
  app.ticker.add((delta) => {
    drawCharacter(performance.now());
  });
};
window.addEventListener("resize", () => {
  app.resize();
});
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
window.breakEval = (statement) => {
  eval(statement);
};
window.addEventListener("DOMContentLoaded", () => {
  var aud = document.getElementById("lizardmusic");
  aud.volume = 0.5; // Set volume to 50%
  aud.play();
});

// this is old movement code
//  if (keys["ArrowLeft"]) {
//       this.points[0] = this.bspace(new Point(3, -2), 0);
//       forward -= 2;
//     }
//     if (keys["ArrowRight"]) {
//       this.points[0] = this.bspace(new Point(forward == 5 ? 3 : -3, 2), 0);
//       forward -= 2;
//     }
//     if (keys["ArrowUp"]) {
//       this.points[0] = this.bspace(new Point(forward, 0), 0);
//     }
//     if (keys["KeyQ"]) {
//       this.points[pointCount - 1] = this.bspace(
//         new Point(0, -0.6),
//         pointCount - 1,
//       );
//     }
//     if (keys["KeyE"]) {
//       this.points[pointCount - 1] = this.bspace(
//         new Point(0, 0.6),
//         pointCount - 1,
//       );
//     }
app.ticker.maxFPS = 1;
