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
  static fromBSpline(p0, p1, p2, p3) {
    return new Curve(new Point((p0.x + 4 * p1.x + p2.x) / 6, (p0.y + 4 * p1.y + p2.y) / 6), new Point((2 * p1.x + p2.x) / 3, (2 * p1.y + p2.y) / 3), new Point((p1.x + 2 * p2.x) / 3, (p1.y + 2 * p2.y) / 3), new Point((p1.x + 4 * p2.x + p3.x) / 6, (p1.y + 4 * p2.y + p3.y) / 6));
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

// scriptsDev/collide.tsx
class detector {
  static blobloop = [
    new Point(500, 500),
    new Point(500, 550),
    new Point(550, 550),
    new Point(550, 600),
    new Point(500, 600),
    new Point(500, 650),
    new Point(450, 650),
    new Point(450, 600),
    new Point(400, 600),
    new Point(400, 550),
    new Point(450, 550),
    new Point(450, 500)
  ];
  static getCurveBoundingBoxes(inputKString) {
    let count = inputKString.length;
    let curves = [];
    for (var i = 0;i < count; i++) {
      curves.push(Curve.fromBSpline(inputKString[i], inputKString[(i + 1) % count], inputKString[(i + 2) % count], inputKString[(i + 3) % count]));
    }
    return curves.map((o) => o.boundingBox()).map((o) => [o.lowest, o.highest]);
  }
  static AABB(col1, col2) {
    let returnIndecies = [];
    for (var i = 0;i < col1.length; i++) {
      for (var j = 0;j < col2.length; j++) {
        let xCol = Math.max(col1[i][0].x, col2[j][0].x) <= Math.min(col1[i][1].x, col2[j][1].x);
        let yCol = Math.max(col1[i][0].y, col2[j][0].y) <= Math.min(col1[i][1].y, col2[j][1].y);
        if (xCol && yCol) {
          returnIndecies.push([i, j]);
        }
      }
    }
    return returnIndecies;
  }
  static quadFormula(a, b, c) {
    if (a === 0) {
      if (b === 0) {
        return [];
      }
      return [-c / b];
    }
    let base = -b / (2 * a);
    let diff = Math.sqrt(b ** 2 - 4 * a * c) / (2 * a);
    if (Number.isNaN(diff)) {
      return [];
    }
    return [base + diff, base - diff];
  }
  static refineHybclip(curve1, curve2, i1, i2) {
    let curve1coeff = curve1.coeff();
    let FE1 = curve1.value(curve1coeff, i1[0]);
    let FE2 = curve1.value(curve1coeff, i1[1]);
    let vec = FE2.subtract(FE1);
    let norm = new Point(-vec.y, vec.x);
    let c1dir = curve1.coeff1Dir();
    let dirFlat = { t2: c1dir.t2.dotProduct(norm), t1: c1dir.t1.dotProduct(norm), t0: c1dir.t0.dotProduct(norm) };
    let intersections = this.quadFormula(dirFlat.t2, dirFlat.t1, dirFlat.t0);
    let dists = intersections.filter((o) => o > i1[0] && o < i1[1]).map((o) => curve1.value(curve1coeff, o).dotProduct(norm)).concat([FE1.dotProduct(norm), FE2.dotProduct(norm)]);
    let maxDist = Math.max(...dists);
    let minDist = Math.min(...dists);
    let curve2coeff = curve2.coeff();
    let e0 = [i2[0] * i2[0] * i2[1], i2[0] * i2[1] * i2[1]];
    let e1 = [i2[0] * i2[0], i2[1] * i2[1]].map((o) => -2 * i2[0] * i2[1] - o);
    let e2 = [i2[0] * 2 + i2[1], i2[0] + i2[1] * 2];
    let flattenedCurve = { t0: curve2coeff.t0.dotProduct(norm), t1: curve2coeff.t1.dotProduct(norm), t2: curve2coeff.t2.dotProduct(norm), t3: curve2coeff.t3.dotProduct(norm) };
    let upLine = { t0: flattenedCurve.t0 + e0[0] * flattenedCurve.t3, t1: flattenedCurve.t1 + e1[0] * flattenedCurve.t3, t2: flattenedCurve.t2 + e2[0] * flattenedCurve.t3 };
    let downLine = { t0: flattenedCurve.t0 + e0[1] * flattenedCurve.t3, t1: flattenedCurve.t1 + e1[1] * flattenedCurve.t3, t2: flattenedCurve.t2 + e2[1] * flattenedCurve.t3 };
    let upIntersect1 = this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - maxDist).map((o) => ({ t: o, ingress: upLine.t1 + 2 * upLine.t2 * o < 0 }));
    let downIntersect1 = this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - maxDist).map((o) => ({ t: o, ingress: downLine.t1 + 2 * downLine.t2 * o < 0 }));
    let upIntersect2 = this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - minDist).map((o) => ({ t: o, ingress: upLine.t1 + 2 * upLine.t2 * o > 0 }));
    let downIntersect2 = this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - minDist).map((o) => ({ t: o, ingress: downLine.t1 + 2 * downLine.t2 * o > 0 }));
    let upCandidates = upIntersect1.concat(upIntersect2).filter((o) => o.t > i2[0] && o.t < i2[1]);
    let downCandidates = downIntersect1.concat(downIntersect2).filter((o) => o.t > i2[0] && o.t < i2[1]);
    let upStart = upLine.t0 + upLine.t1 * i2[0] + upLine.t2 * i2[0] ** 2;
    let downStart = downLine.t0 + downLine.t1 * i2[0] + downLine.t2 * i2[0] ** 2;
    let countStart = (upStart > minDist && upStart < maxDist ? 0 : 1) + (downStart > minDist && downStart < maxDist ? 0 : 1);
    let candidates = upCandidates.concat(downCandidates).sort((a, b) => a.t - b.t);
    let endPoints = [];
    if (countStart < 2) {
      endPoints.push(i2[0]);
    }
    console.log(countStart);
    console.log(candidates);
    var count = countStart;
    for (var i = 0;i < candidates.length; i++) {
      if (candidates[i].ingress) {
        count--;
        if (count == 1) {
          endPoints.push(candidates[i].t);
        }
      } else {
        count++;
        if (count == 2) {
          endPoints.push(candidates[i].t);
        }
      }
    }
    if (count < 2) {
      endPoints.push(i2[1]);
    }
    return endPoints;
  }
}
var collide_default = { detector };
export {
  detector,
  collide_default as default
};
