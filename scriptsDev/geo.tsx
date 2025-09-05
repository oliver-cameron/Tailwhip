class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(vector: Point): Point {
    return new Point(this.x + vector.x, this.y + vector.y);
  }
  subtract(vector: Point): Point {
    return new Point(this.x - vector.x, this.y - vector.y);
  }
  scale(scalar: number): Point {
    return new Point(this.x * scalar, this.y * scalar);
  }
  dotProduct(operand: Point): number {
    return this.x * operand.x + this.y * operand.y;
  }
  crossProduct(operand: Point): number {
    return this.x * operand.y - this.y * operand.x;
  }
  geoProduct(operand: Point): Point {
    // The product of two vectors as if they were two numbers in the complex plane.
    return new Point(
      this.x * operand.x - this.y * operand.y,
      this.x * operand.y + this.y * operand.x,
    );
  }
  length(): number {
    return Math.hypot(this.x, this.y);
  }
  normalise(): Point {
    return this.scale(1 / this.length());
  }
  static lerp(a: Point, b: Point, t: number) {
    return a.scale(1 - t).add(b.scale(t));
  }
  static zero = new Point(0, 0);
}
// A cubic bezier curve
class Curve {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  constructor(p0: Point, p1: Point, p2: Point, p3: Point) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
  static fromKSpline(p0: Point, p1: Point, p2: Point, p3: Point): Curve {
    return new Curve(
      p1,
      p1.subtract(p0.scale(0.25)).add(p2.scale(0.25)),
      p2.subtract(p3.scale(0.25)).add(p1.scale(0.25)),
      p2,
    );
  }
  // Coefficients
  coeff(): { t3: Point; t2: Point; t1: Point; t0: Point } {
    return {
      t3: this.p0
        .scale(-1)
        .add(this.p1.scale(3))
        .add(this.p2.scale(-3))
        .add(this.p3.scale(1)),
      t2: this.p0.scale(3).add(this.p1.scale(-6)).add(this.p2.scale(3)),
      t1: this.p0.scale(-3).add(this.p1.scale(3)),
      t0: this.p0.scale(1),
    };
  }
  coeff1Dir(): { t2: Point; t1: Point; t0: Point } {
    return {
      t2: this.p0
        .scale(-3)
        .add(this.p1.scale(9))
        .add(this.p2.scale(-9))
        .add(this.p3.scale(3)),
      t1: this.p0.scale(6).add(this.p1.scale(-12)).add(this.p2.scale(6)),
      t0: this.p0.scale(-3).add(this.p1.scale(3)),
    };
  }
  coeff2Dir(): { t1: Point; t0: Point } {
    return {
      t1: this.p0
        .scale(-6)
        .add(this.p1.scale(18))
        .add(this.p2.scale(-18))
        .add(this.p3.scale(6)),
      t0: this.p0.scale(6).add(this.p1.scale(-12)).add(this.p2.scale(6)),
    };
  }
  value(
    coeff: { t3?: Point; t2?: Point; t1: Point; t0: Point },
    t: number,
  ): Point {
    return coeff.t0
      .add(coeff.t1.scale(t))
      .add(coeff.t2 ? coeff.t2.scale(t ** 2) : Point.zero)
      .add(coeff.t3 ? coeff.t3.scale(t ** 3) : Point.zero);
  }

  pass = ["p0", "p1", "p2", "p3"]
    .map((o) => [this[o].x, this[o].y])
    .reduce((a, b) => a.concat(b)) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  boundingBox(): { lowest: Point; highest: Point } {
    let vCoeff: { t3: Point; t2: Point; t1: Point; t0: Point } = this.coeff();
    let d1Coeff: { t2: Point; t1: Point; t0: Point } = this.coeff1Dir();
    let compCoeff: {
      x: { t2: number; t1: number; t0: number };
      y: { t2: number; t1: number; t0: number };
    } = { x: { t2: 0, t1: 0, t0: 0 }, y: { t2: 0, t1: 0, t0: 0 } };
    for (var value in d1Coeff) {
      compCoeff.x[value] = d1Coeff[value].x;
      compCoeff.y[value] = d1Coeff[value].y;
    }
    let candidates: { x: Array<number>; y: Array<number> } = {
      x: [0, 1],
      y: [0, 1],
    };
    for (var value in compCoeff) {
      // Quadratic Equation!!!
      let vals = compCoeff[value];
      if (vals.t2 === 0) {
        let root = -vals.t0 / vals.t1; // linear root
        candidates[value].push(root);
        continue;
      }
      let base = -vals.t1 / (2 * vals.t2);
      let diff =
        Math.sqrt(vals.t1 ** 2 - 4 * vals.t2 * vals.t0) / (2 * vals.t2);
      if (Number.isNaN(diff)) {
        continue;
      } // No real roots
      candidates[value] = candidates[value].concat(
        [1, -1].map((o) => base + diff * o),
      );
    }
    for (var value in candidates) {
      candidates[value] = candidates[value]
        .filter((o: number) => 0 <= o && 1 >= o)
        .map((o: number) => this.value(vCoeff, o)[value]);
      candidates[value] = candidates[value].sort((a, b) => a - b);
    }
    let returner: { lowest: Point; highest: Point } = {
      lowest: Point.zero,
      highest: Point.zero,
    };

    returner.lowest = new Point(candidates.x[0], candidates.y[0]);
    returner.highest = new Point(
      candidates.x[candidates.x.length - 1],
      candidates.y[candidates.y.length - 1],
    );
    return returner;
  }
}
var other = {
  // Gives t value across endpoints of an arc, given the angle of the arc and t value across the arc, such that
  // the lerp of the endpoints, normalised gives the same point as the arc at t.
  sl(t: number, s: number, c: number): number {
    const tan: number = s / c;
    const tTan = Math.tan(Math.atan(tan) * t);
    return tTan / (s + 1 - c * tTan);
  },
  lockDist(p1: Point, p2: Point, distance: number): Point {
    let vec = p2.subtract(p1);
    let len = vec.length();
    return p1.add(vec.scale(distance / len));
  },
  // A spring function that makes nuges a vector into the same direction as another vector, both of which have roughly the same length.
  spring(p1: Point, p2: Point, p3: Point, critAngle: number, t: number): Point {
    let vec1 = p2.subtract(p1);
    var vec2 = p3.subtract(p2);
    let currAngCos = vec1.normalise().dotProduct(vec2.normalise());
    let currAngSin = vec1.normalise().crossProduct(vec2.normalise());
    let newVec = new Point(currAngCos, currAngSin);
    if (critAngle < currAngCos) {
      newVec = Point.lerp(
        newVec,
        new Point(1, 0),
        this.sl(t, currAngSin, currAngCos),
      );
    }
    vec2 = newVec.geoProduct(vec1.normalise()).scale(vec2.length());
    return p2.add(vec2);
  },
  toBSpace(point: Point, offset: Point, rotator: Point): Point {
    return point.subtract(offset).geoProduct(new Point(rotator.x, -rotator.y));
  },
  fromBSpace(point: Point, offset: Point, rotator: Point): Point {
    return point.geoProduct(rotator).add(offset);
  },
  // Finds the position of the elbow in a 2-segment arm to reach a point.
  inverseKinematics(
    origin: Point,
    end: Point,
    clockwise: Boolean,
    armLength: number,
  ): Point {
    let secant: Point = end.subtract(origin);
    let angCos: number = secant.length() / (2 * armLength);
    if (angCos > 1) {
      console.warn("Inverse Kinematics over constrained. Shortening length.");
      angCos = 1;
    }
    let angSin: number = Math.sqrt(1 - angCos ** 2) * (clockwise ? -1 : 1);
    return origin.add(
      new Point(angCos, angSin).geoProduct(secant.normalise()).scale(armLength),
    );
  },
};
let geo = { Point, Curve, other };
