var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// scriptsDev/geo.tsx
class Point {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(vector) {
    return new Point(this.x + vector.x, this.y + vector.y);
  }
  subtract(vector) {
    return new Point(this.x - vector.x, this.y - vector.y);
  }
  scale(scalar) {
    return new Point(this.x * scalar, this.y * scalar);
  }
  dotProduct(operand) {
    return this.x * operand.x + this.y * operand.y;
  }
  crossProduct(operand) {
    return this.x * operand.y - this.y * operand.x;
  }
  geoProduct(operand) {
    return new Point(this.x * operand.x - this.y * operand.y, this.x * operand.y + this.y * operand.x);
  }
  length() {
    return Math.hypot(this.x, this.y);
  }
  normalise() {
    return this.scale(1 / this.length());
  }
  static lerp(a, b, t) {
    return a.scale(1 - t).add(b.scale(t));
  }
  static zero = new Point(0, 0);
}

class Curve {
  p0;
  p1;
  p2;
  p3;
  constructor(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
  static fromKSpline(p0, p1, p2, p3) {
    return new Curve(p1, p1.subtract(p0.scale(0.25)).add(p2.scale(0.25)), p2.subtract(p3.scale(0.25)).add(p1.scale(0.25)), p2);
  }
  coeff() {
    return {
      t3: this.p0.scale(-1).add(this.p1.scale(3)).add(this.p2.scale(-3)).add(this.p3.scale(1)),
      t2: this.p0.scale(3).add(this.p1.scale(-6)).add(this.p2.scale(3)),
      t1: this.p0.scale(-3).add(this.p1.scale(3)),
      t0: this.p0.scale(1)
    };
  }
  coeff1Dir() {
    return {
      t2: this.p0.scale(-3).add(this.p1.scale(9)).add(this.p2.scale(-9)).add(this.p3.scale(3)),
      t1: this.p0.scale(6).add(this.p1.scale(-12)).add(this.p2.scale(6)),
      t0: this.p0.scale(-3).add(this.p1.scale(3))
    };
  }
  coeff2Dir() {
    return {
      t1: this.p0.scale(-6).add(this.p1.scale(18)).add(this.p2.scale(-18)).add(this.p3.scale(6)),
      t0: this.p0.scale(6).add(this.p1.scale(-12)).add(this.p2.scale(6))
    };
  }
  value(coeff, t) {
    return coeff.t0.add(coeff.t1.scale(t)).add(coeff.t2 ? coeff.t2.scale(t ** 2) : Point.zero).add(coeff.t3 ? coeff.t3.scale(t ** 3) : Point.zero);
  }
  pass = ["p0", "p1", "p2", "p3"].map((o) => [this[o].x, this[o].y]).reduce((a, b) => a.concat(b));
  boundingBox() {
    let vCoeff = this.coeff();
    let d1Coeff = this.coeff1Dir();
    let compCoeff = { x: { t2: 0, t1: 0, t0: 0 }, y: { t2: 0, t1: 0, t0: 0 } };
    for (var value in d1Coeff) {
      compCoeff.x[value] = d1Coeff[value].x;
      compCoeff.y[value] = d1Coeff[value].y;
    }
    let candidates = {
      x: [0, 1],
      y: [0, 1]
    };
    for (var value in compCoeff) {
      let vals = compCoeff[value];
      if (vals.t2 === 0) {
        let root = -vals.t0 / vals.t1;
        candidates[value].push(root);
        continue;
      }
      let base = -vals.t1 / (2 * vals.t2);
      let diff = Math.sqrt(vals.t1 ** 2 - 4 * vals.t2 * vals.t0) / (2 * vals.t2);
      if (Number.isNaN(diff)) {
        continue;
      }
      candidates[value] = candidates[value].concat([1, -1].map((o) => base + diff * o));
    }
    for (var value in candidates) {
      candidates[value] = candidates[value].filter((o) => 0 <= o && 1 >= o).map((o) => this.value(vCoeff, o)[value]);
      candidates[value] = candidates[value].sort((a, b) => a - b);
    }
    let returner = {
      lowest: Point.zero,
      highest: Point.zero
    };
    returner.lowest = new Point(candidates.x[0], candidates.y[0]);
    returner.highest = new Point(candidates.x[candidates.x.length - 1], candidates.y[candidates.y.length - 1]);
    return returner;
  }
}
var other = {
  sl(t, s, c) {
    const tan = s / c;
    const tTan = Math.tan(Math.atan2(s, c) * t);
    return tTan / (s + (1 - c) * tTan);
  },
  lockDist(p1, p2, distance) {
    let vec = p2.subtract(p1);
    let len = vec.length();
    return p1.add(vec.scale(distance / len));
  },
  spring(p1, p2, p3, critAngle, t, deltaTime) {
    let vec1 = p2.subtract(p1);
    var vec2 = p3.subtract(p2);
    let currAngCos = vec1.normalise().dotProduct(vec2.normalise());
    let currAngSin = vec1.normalise().crossProduct(vec2.normalise());
    let angleVec = new Point(currAngCos, currAngSin);
    if (critAngle > currAngCos) {
      vec2 = Point.lerp(vec2, vec1, this.sl(t, currAngSin, currAngCos)).normalise().scale(vec1.length());
    }
    return p2.add(vec2);
  },
  toBSpace(point, offset, rotator) {
    return point.subtract(offset).geoProduct(new Point(rotator.x, -rotator.y));
  },
  fromBSpace(point, offset, rotator) {
    return point.geoProduct(rotator).add(offset);
  },
  inverseKinematics(origin, end, clockwise, armLength) {
    let secant = end.subtract(origin);
    let angCos = secant.length() / (2 * armLength);
    if (angCos > 1) {
      console.warn("Inverse Kinematics over constrained. Shortening length.");
      angCos = 1;
    }
    let angSin = Math.sqrt(1 - angCos ** 2) * (clockwise ? -1 : 1);
    return origin.add(new Point(angCos, angSin).geoProduct(secant.normalise()).scale(armLength));
  }
};
var geo_default = { Point, Curve, other };

// scriptsDev/lizard.tsx
class Lizard {
  static dub = (p) => {
    return p.concat(p.map((o) => ({
      index: o.index,
      offset: new Point(o.offset.x, -o.offset.y)
    })).reverse());
  };
  id;
  spine;
  vel;
  arms;
  bodyShape;
  spineLength = 6;
  constructor(id, spine, arms, bodyShape) {
    this.id = id;
    this.spine = spine;
    this.arms = arms;
    this.bodyShape = bodyShape;
    this.vel = {
      oldPoints: spine,
      velocitySpine: Array(spine.length).fill(Point.zero)
    };
  }
}
var spineAmount = 6;
var lizardCharacters = {
  lineLength: 50,
  limbLength: 40,
  limbDefs: [
    {
      index: 1,
      baseOffset: new Point(0, -15),
      handOffset: new Point(-5, -60),
      clockwise: false
    },
    {
      index: 1,
      baseOffset: new Point(0, 15),
      handOffset: new Point(5, 60),
      clockwise: true
    },
    {
      index: 3,
      baseOffset: new Point(0, -5),
      handOffset: new Point(-5, -50),
      clockwise: true
    },
    {
      index: 3,
      baseOffset: new Point(0, 5),
      handOffset: new Point(5, 50),
      clockwise: false
    }
  ],
  myCharacter: new Lizard(crypto.randomUUID(), Array(spineAmount).fill(0).map(() => new Point(Math.random() + 100, Math.random() + 100)), Array(4).fill(0).map(() => new Point(Math.random() + 100, Math.random() + 100)), Lizard.dub([
    { index: 5, offset: new Point(0, 4) },
    { index: 4, offset: new Point(0, 7) },
    { index: 3, offset: new Point(0, 10) },
    { index: 2, offset: new Point(-15, 20) },
    { index: 1, offset: new Point(0, 16) },
    { index: 0, offset: new Point(0, 20) },
    { index: 0, offset: new Point(-20, 10) }
  ])),
  others: {},
  updateSpine(lizard, direction, origin, deltaT) {
    let newSpine = lizard.spine;
    newSpine[0] = newSpine[0].add(direction.scale(deltaT.deltaTime) ?? Point.zero);
    for (var i = 1;i < newSpine.length; i++) {
      newSpine[i] = newSpine[i].add(lizard.vel.velocitySpine[i].scale(deltaT.deltaTime).scale(0.9));
    }
    for (var i = 2;i < newSpine.length; i++) {
      newSpine[i] = other.spring(newSpine[i - 2], newSpine[i - 1], newSpine[i], 0.5, 0.1, deltaT.deltaTime);
    }
    for (var i = 1;i < newSpine.length; i++) {
      newSpine[i] = other.lockDist(newSpine[i - 1], newSpine[i], this.lineLength);
    }
    for (var i = 0;i < newSpine.length; i++) {
      lizard.vel.velocitySpine[i] = newSpine[i].subtract(lizard.spine[i]).scale(1 / deltaT.deltaTime);
    }
    this.myCharacter.spine = newSpine;
    return newSpine;
  },
  toBodySpace(index, point) {
    let bodyPoint = this.myCharacter.spine[index];
    let secant = this.myCharacter.spine[index == spineAmount - 1 ? index : index + 1].subtract(this.myCharacter.spine[index == 0 ? index : index - 1]);
    return other.toBSpace(point, bodyPoint, secant.normalise());
  },
  fromBodySpace(index, point) {
    let bodyPoint = this.myCharacter.spine[index];
    let secant = this.myCharacter.spine[index == spineAmount - 1 ? index : index + 1].subtract(this.myCharacter.spine[index == 0 ? index : index - 1]);
    return other.fromBSpace(point, bodyPoint, secant.normalise());
  },
  updateArms(lizard, states) {
    let newArms = lizard.arms;
    for (var i = 0;i < 4; i++) {
      if (newArms[i].subtract(this.fromBodySpace(this.limbDefs[i].index, this.limbDefs[i].baseOffset)).length() >= this.limbLength * 2) {
        newArms[i] = other.lockDist(this.fromBodySpace(this.limbDefs[i].index, this.limbDefs[i].baseOffset), newArms[i], this.limbLength * 2);
      }
    }
    this.myCharacter.arms = newArms;
    return newArms;
  },
  draw(lizard, ctx) {
    ctx.lineStyle(4, 65536, 1);
    ctx.moveTo(lizard.spine[0].x, lizard.spine[0].y);
    for (var i = 1;i < lizard.spine.length; i++) {
      ctx.lineTo(lizard.spine[i].x, lizard.spine[i].y);
    }
    ctx.stroke();
    ctx.lineStyle(2, 16711935, 1);
    for (var i = 0;i < 4; i++) {
      let limbDef = this.limbDefs[i];
      let base = this.fromBodySpace(limbDef.index, limbDef.baseOffset);
      let hand = lizard.arms[i];
      let joint = other.inverseKinematics(base, hand, limbDef.clockwise, this.limbLength);
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(joint.x, joint.y);
      ctx.lineTo(hand.x, hand.y);
      ctx.stroke();
    }
    let bodyShapePoints = lizard.bodyShape.map((def) => this.fromBodySpace(def.index, def.offset));
    ctx.lineStyle(3, 65280, 1);
    ctx.moveTo(bodyShapePoints[0].x, bodyShapePoints[0].y);
    for (var i = 1;i < bodyShapePoints.length; i++) {
      ctx.lineTo(bodyShapePoints[i].x, bodyShapePoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
};
var lizard_default = { lizardCharacters, Lizard };
export {
  lizardCharacters,
  lizard_default as default,
  Lizard
};
