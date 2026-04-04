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
    { index: 4.99, offset: new Point(50, 4) },
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
    let t = index % 1;
    let seg = Math.floor(index);
    let p0 = seg == 0 ? this.myCharacter.spine[0].scale(2).subtract(this.myCharacter.spine[1]) : this.myCharacter.spine[seg - 1];
    let p1 = this.myCharacter.spine[seg];
    let p2 = this.myCharacter.spine[seg + 1];
    let p3 = seg == spineAmount - 2 ? this.myCharacter.spine[spineAmount - 1].scale(2).subtract(this.myCharacter.spine[spineAmount - 2]) : this.myCharacter.spine[seg + 2];
    let curCurve = Curve.fromKSpline(p0, p1, p2, p3);
    let curvePoint = curCurve.value(curCurve.coeff(), t);
    let secant = curCurve.value(curCurve.coeff1Dir(), t).scale(1 / this.lineLength);
    let normal = new Point(-secant.y, secant.x);
    return curvePoint.add(secant.scale(point.x)).add(normal.scale(point.y));
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
  },
  outline(lizard) {
    return lizard.bodyShape.map((def) => this.fromBodySpace(def.index, def.offset));
  }
};
var lizard_default = { lizardCharacters, Lizard };

// scriptsDev/newSpine.tsx
class Spine {
  points;
  velocity;
  constructor(points) {
    this.points = points;
    this.velocity = Array(points.length).fill(Point.zero);
  }
}
function updateSpine(spine, headforce, deltaTime, gtx, pushingColliders, shrinks) {
  spine.velocity[0] = spine.velocity[0].add(headforce.scale(deltaTime));
  let update = padeNextFrame(spine.points, spine.velocity, deltaTime / 1000, gtx, pushingColliders, shrinks);
  spine.points = update.spinePosition;
  spine.velocity = update.spineVel;
  return spine;
}
function multiplyMatrices(lhs, rhs) {
  let lhsHeight = lhs[0].length;
  for (var i = 0;i < lhs.length; i++) {
    if (lhs[i].length != lhsHeight) {
      throw new Error("LHS is not a valid matrix");
    }
  }
  let rhsHeight = rhs[0].length;
  for (var i = 0;i < rhs.length; i++) {
    if (rhs[i].length != rhsHeight) {
      throw new Error("RHS is not a valid matrix");
    }
  }
  if (lhsHeight != rhs.length) {
    throw new Error("Matrix dimensions do not match");
  }
  let returner = Array.from({ length: lhs.length }, () => Array(rhs[0].length).fill(0));
  for (var i = 0;i < lhs.length; i++) {
    for (var j = 0;j < rhs[0].length; j++) {
      let sum = 0;
      for (var k = 0;k < lhsHeight; k++) {
        sum += lhs[i][k] * rhs[k][j];
      }
      returner[i][j] = sum;
    }
  }
  return returner;
}
function LUDecompose(Matrix) {
  let n = Matrix.length;
  let L = Array.from({ length: n }, () => Array(n).fill(0)).map((row, i) => row.map((val, j) => i === j ? 1 : 0));
  let U = multiplyMatrices(L, Matrix);
  for (let i = 0;i < n; i++) {
    for (let j = i + 1;j < n; j++) {
      let div = U[j][i] / U[i][i];
      L[j][i] = div;
      for (let k = i;k < n; k++) {
        U[j][k] -= div * U[i][k];
      }
    }
  }
  return { L, U };
}
function factorial(n) {
  if (n % 1 !== 0) {
    Error("Fractional factorial not implemented");
  }
  if (n < 0) {
    Error("Negative factorial not defined");
  } else if (n === 0 || n === 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}
function matrixAddition(lhs, rhs) {
  return lhs.map((row, i) => row.map((val, j) => val + rhs[i][j]));
}
function padeApproximation(Matrix, order) {
  let size = Matrix.length;
  for (var i = 0;i < size; i++) {
    if (Matrix[i].length != size) {
      throw new Error("Matrix is not square");
    }
  }
  let absMat = Matrix.map((row) => row.map((x2) => Math.abs(x2)).reduce((a, b) => a + b)).reduce((a, b) => a > b ? a : b);
  let scalar = absMat > 1 ? Math.ceil(Math.log2(absMat)) : 0;
  let deltaMat = Matrix.map((row) => row.map((x2) => x2 / 2 ** scalar));
  let powerCache = [
    Array.from({ length: size }, () => Array(size).fill(0)).map((row, i2) => row.map((val, j2) => i2 === j2 ? 1 : 0))
  ];
  let coefficients = [1];
  for (let i2 = 1;i2 <= order; i2++) {
    powerCache.push(multiplyMatrices(powerCache[i2 - 1], deltaMat));
    coefficients.push(factorial(order * 2 - i2) * factorial(order) / (factorial(order * 2) * factorial(i2) * factorial(order - i2)));
  }
  let numerator = powerCache.map((i2, index) => i2.map((row) => row.map((val) => val * coefficients[index]))).reduce((a, b) => matrixAddition(a, b));
  let denominator = powerCache.map((i2, index) => i2.map((row) => row.map((val) => val * coefficients[index] * (index % 2 === 0 ? 1 : -1)))).reduce((a, b) => matrixAddition(a, b));
  let { L, U } = LUDecompose(denominator);
  let x = Array.from({ length: size }, () => Array(size).fill(0));
  for (var v = 0;v < size; v++) {
    let y = Array(size).fill(0).map(() => 0);
    for (var i = 0;i < size; i++) {
      let sum = numerator[i][v];
      if (i !== 0) {
        for (var j = 0;j < i; j++) {
          sum -= L[i][j] * y[j];
        }
      }
      y[i] = sum / L[i][i];
    }
    for (var i = size - 1;i >= 0; i--) {
      let sum = y[i];
      for (var j = i + 1;j < size; j++) {
        sum -= U[i][j] * x[j][v];
      }
      x[i][v] = sum / U[i][i];
    }
  }
  for (var i = 0;i < scalar; i++) {
    x = multiplyMatrices(x, x);
  }
  return x;
}
function InvertMatrix(matrix) {
  let n = matrix.length;
  for (var i = 0;i < n; i++) {
    if (matrix[i].length != n) {
      throw new Error("Matrix is not square");
    }
  }
  let L = Array.from({ length: n }, () => Array(n).fill(0)).map((row, i2) => row.map((val, j2) => i2 === j2 ? 1 : 0));
  for (var i = 0;i < n; i++) {
    for (var j = i + 1;j < n; j++) {
      let scale = matrix[j][i] / matrix[i][i];
      for (var k = 0;k < n; k++) {
        matrix[j][k] -= scale * matrix[i][k];
        L[j][k] -= scale * L[i][k];
      }
    }
  }
  for (var i = n - 1;i >= 0; i--) {
    for (var j = n - 1;j > i; j--) {
      let scale = matrix[j][i] / matrix[i][i];
      for (var k = 0;k < n; k++) {
        matrix[j][k] -= scale * matrix[i][k];
        L[j][k] -= scale * L[i][k];
      }
    }
  }
  for (var i = 0;i < n; i++) {
    for (var j = 0;j < n; j++) {
      L[i][j] /= matrix[i][i];
    }
  }
  return L;
}
var bodyLineLength = 50;
var springForces = [
  {
    coefficients: [1 / 9, 11 / 54, -10 / 27, 1 / 18],
    targetLength: bodyLineLength * 10 / 27,
    stiffness: 50
  },
  {
    coefficients: [-1 / 18, 23 / 54, -23 / 54, 1 / 18],
    targetLength: bodyLineLength * 7 / 27,
    stiffness: 50
  },
  {
    coefficients: [-1 / 18, 10 / 27, -11 / 54, -1 / 9],
    targetLength: bodyLineLength * 10 / 27,
    stiffness: 50
  }
];
var pointAmount = 6;
var springData = [{ coefficients: [], targetLength: 0, stiffness: 0 }];
for (i = 0;i < springForces.length; i++) {
  for (j = 0;j < pointAmount - 3; j++) {
    let coeffRow = Array(pointAmount).fill(0);
    coeffRow.splice(j, 4, ...springForces[i].coefficients);
    springData.push({
      coefficients: coeffRow,
      targetLength: springForces[i].targetLength,
      stiffness: springForces[i].stiffness
    });
  }
  let coeffRowStart = Array(pointAmount).fill(0);
  let startCoeffs = [...springForces[i].coefficients];
  startCoeffs[1] += startCoeffs[0] * 2;
  startCoeffs[2] -= startCoeffs[0];
  coeffRowStart.splice(0, 3, ...startCoeffs.slice(1));
  springData.push({
    coefficients: coeffRowStart,
    targetLength: springForces[i].targetLength,
    stiffness: springForces[i].stiffness
  });
  let coeffRowEnd = Array(pointAmount).fill(0);
  let endCoeffs = [...springForces[i].coefficients];
  endCoeffs[endCoeffs.length - 3] -= endCoeffs[endCoeffs.length - 1];
  endCoeffs[endCoeffs.length - 2] += endCoeffs[endCoeffs.length - 1] * 2;
  coeffRowEnd.splice(pointAmount - 3, 3, ...endCoeffs.slice(0, endCoeffs.length - 1));
  springData.push({
    coefficients: coeffRowEnd,
    targetLength: springForces[i].targetLength,
    stiffness: springForces[i].stiffness
  });
}
var j;
var i;
springData = springData.slice(1);
function bodySprings(spinePosition) {
  let n = spinePosition.length;
  let F = new Array(2 * n).fill(0).map(() => new Array(2 * n).fill(0));
  let V = new Array(2 * n).fill(0).map(() => 0);
  for (var i2 = 0;i2 < springData.length; i2++) {
    let coeffs = springData[i2].coefficients;
    let targetLength = springData[i2].targetLength;
    let stiffness = springData[i2].stiffness;
    let S = coeffs.map((o, index) => spinePosition[index].scale(o)).reduce((a2, b2) => a2.add(b2));
    let invSlen = 1 / S.length();
    let sLenNeg3 = invSlen ** 3;
    let tslen = targetLength * invSlen;
    let xv = coeffs.map((o) => -2 * stiffness * o * S.x * (1 - tslen));
    for (var j2 = 0;j2 < n; j2++) {
      V[j2] += xv[j2];
    }
    let yv = coeffs.map((o) => -2 * stiffness * o * S.y * (1 - tslen));
    for (var j2 = 0;j2 < n; j2++) {
      V[j2 + n] += yv[j2];
    }
    let tsxl = targetLength * sLenNeg3 * S.x * S.x;
    for (var a = 0;a < n; a++) {
      for (var b = 0;b < n; b++) {
        let addVal = -2 * stiffness * coeffs[a] * coeffs[b] * (1 - tslen + tsxl);
        F[a][b] += addVal;
      }
    }
    let tsyl = targetLength * sLenNeg3 * S.y * S.y;
    for (var a = 0;a < n; a++) {
      for (var b = 0;b < n; b++) {
        let addVal = -2 * stiffness * coeffs[a] * coeffs[b] * (1 - tslen + tsyl);
        F[a + n][b + n] += addVal;
      }
    }
    let tsxy = targetLength * sLenNeg3 * S.x * S.y;
    for (var a = 0;a < n; a++) {
      for (var b = 0;b < n; b++) {
        let addVal = -2 * stiffness * coeffs[a] * coeffs[b] * tsxy;
        F[a][b + n] += addVal;
        F[a + n][b] += addVal;
      }
    }
  }
  return { F, V };
}
function backTrackCurve(forces, index) {
  let p3 = forces[3].scale(1).add(forces[2].scale(0)).add(forces[1].scale(0)).add(forces[0].scale(0)).scale(1 / 6);
  let p2 = forces[3].scale(-3).add(forces[2].scale(3)).add(forces[1].scale(3)).add(forces[0].scale(1)).scale(1 / 6);
  let p1 = forces[3].scale(3).add(forces[2].scale(-6)).add(forces[1].scale(0)).add(forces[0].scale(4)).scale(1 / 6);
  let p0 = forces[3].scale(-1).add(forces[2].scale(3)).add(forces[1].scale(-3)).add(forces[0].scale(1)).scale(1 / 6);
  return [p0, p1, p2, p3];
}
function backTrackPoint(point, index, bodyShape) {
  let bodyPoint = new Point(point.y, -point.x).scale(bodyShape.y).add(point.scale(bodyShape.x)).scale(1 / lizardCharacters.lineLength);
  let t = index % 1;
  let weightPos = [-3 * t ** 3 + 6 * t ** 2 - 3 * t, 5 * t ** 3 - 9 * t ** 2 + 4, -5 * t ** 3 + 6 * t ** 2 + 3 * t, 3 * t ** 3 - 3 * t ** 2].map((o) => o / 4);
  let dirPos = [-9 * t ** 2 + 12 * t - 3, 15 * t ** 2 - 18 * t, -15 * t ** 2 + 12 * t + 3, 9 * t ** 2 - 6 * t].map((o) => o / 4);
  let p0 = point.scale(weightPos[0]).add(bodyPoint.scale(dirPos[0]));
  let p1 = point.scale(weightPos[1]).add(bodyPoint.scale(dirPos[1]));
  let p2 = point.scale(weightPos[2]).add(bodyPoint.scale(dirPos[2]));
  let p3 = point.scale(weightPos[3]).add(bodyPoint.scale(dirPos[3]));
  return [p0, p1, p2, p3];
}
function shrinkPoints(spinePosition, bodyShape, gtx, pushingColliders, shrinks) {
  let n = spinePosition.length;
  let skinForces = Array(bodyShape.length).fill(Point.zero);
  let outline = bodyShape.map((o) => {
    let index = o.index;
    let point = o.offset;
    let spineAmount2 = n;
    let t = index % 1;
    let seg = Math.floor(index);
    let p0 = seg == 0 ? spinePosition[0].scale(2).subtract(spinePosition[1]) : spinePosition[seg - 1];
    let p1 = spinePosition[seg];
    let p2 = spinePosition[seg + 1];
    let p3 = seg == spineAmount2 - 2 ? spinePosition[spineAmount2 - 1].scale(2).subtract(spinePosition[spineAmount2 - 2]) : spinePosition[seg + 2];
    let curCurve = Curve.fromKSpline(p0, p1, p2, p3);
    let curvePoint = curCurve.value(curCurve.coeff(), t);
    let secant = curCurve.value(curCurve.coeff1Dir(), t).scale(1 / lizardCharacters.lineLength);
    let normal = new Point(-secant.y, secant.x);
    return curvePoint.add(secant.scale(point.x)).add(normal.scale(point.y));
  });
  for (var b = 0;b < shrinks.length; b++) {
    let i3 = shrinks[b];
    let curve = Curve.fromBSpline(outline[i3], outline[(i3 + 1) % outline.length], outline[(i3 + 2) % outline.length], outline[(i3 + 3) % outline.length]);
    let curveForces = backTrackCurve(detector.shrinkCurve(curve), i3);
    skinForces[i3] = skinForces[i3].add(curveForces[0]);
    skinForces[(i3 + 1) % outline.length] = skinForces[(i3 + 1) % outline.length].add(curveForces[1]);
    skinForces[(i3 + 2) % outline.length] = skinForces[(i3 + 2) % outline.length].add(curveForces[2]);
    skinForces[(i3 + 3) % outline.length] = skinForces[(i3 + 3) % outline.length].add(curveForces[3]);
  }
  for (var b = 0;b < pushingColliders.length; b++) {
    let collision = pushingColliders[b];
    let i3 = pushingColliders[b].index;
    let curve = Curve.fromBSpline(outline[i3], outline[(i3 + 1) % outline.length], outline[(i3 + 2) % outline.length], outline[(i3 + 3) % outline.length]);
    let curveForces = backTrackCurve(detector.dir1Force(curve, collision.otherCurve, collision.t, collision.u)[0], i3).map((o) => !collision.add ? o : o.scale(-1));
    skinForces[i3] = skinForces[i3].add(curveForces[0]);
    skinForces[(i3 + 1) % outline.length] = skinForces[(i3 + 1) % outline.length].add(curveForces[1]);
    skinForces[(i3 + 2) % outline.length] = skinForces[(i3 + 2) % outline.length].add(curveForces[2]);
    skinForces[(i3 + 3) % outline.length] = skinForces[(i3 + 3) % outline.length].add(curveForces[3]);
  }
  gtx.lineStyle(2, 16711680);
  for (var i2 = 0;i2 < bodyShape.length; i2++) {
    gtx.moveTo(outline[i2].x, outline[i2].y);
    gtx.lineTo(outline[i2].x + skinForces[i2].x, outline[i2].y + skinForces[i2].y);
  }
  gtx.stroke();
  let spineForces = Array(spinePosition.length).fill(Point.zero);
  for (var i2 = 0;i2 < skinForces.length; i2++) {
    let index = Math.floor(bodyShape[i2].index);
    let pointForces = backTrackPoint(skinForces[i2], bodyShape[i2].index, bodyShape[i2].offset);
    if (index > 0 && index < spinePosition.length - 2) {
      spineForces[index - 1] = spineForces[index - 1].add(pointForces[0]);
      spineForces[index] = spineForces[index].add(pointForces[1]);
      spineForces[index + 1] = spineForces[index + 1].add(pointForces[2]);
      spineForces[index + 2] = spineForces[index + 2].add(pointForces[3]);
    } else if (index == 0) {
      spineForces[0] = spineForces[0].add(pointForces[1].add(pointForces[0].scale(2)));
      spineForces[1] = spineForces[1].add(pointForces[2]).subtract(pointForces[0]);
      spineForces[2] = spineForces[2].add(pointForces[3]);
    } else {
      spineForces[index - 1] = spineForces[index - 1].add(pointForces[0]);
      spineForces[index] = spineForces[index].add(pointForces[1]).subtract(pointForces[3]);
      spineForces[index + 1] = spineForces[index + 1].add(pointForces[2]).add(pointForces[3].scale(2));
    }
  }
  return spineForces;
}
function padeNextFrame(spinePosition, spineVel, delta, gtx, pushingColliders, shrinks) {
  let n = spinePosition.length;
  let { F, V } = bodySprings(spinePosition);
  let shrink = shrinkPoints(spinePosition, lizardCharacters.myCharacter.bodyShape, gtx, pushingColliders, shrinks);
  let shrinkX = shrink.map((o) => o.x);
  let shrinkY = shrink.map((o) => o.y);
  for (var i2 = 0;i2 < n; i2++) {
    V[i2] -= shrinkX[i2];
    V[i2 + n] -= shrinkY[i2];
  }
  let shiftPos = spinePosition.map((o) => [[[o.x]], [[o.y]]]).reduce((a, b) => [a[0].concat(b[0]), a[1].concat(b[1])]);
  let acc = multiplyMatrices(F, shiftPos[0].concat(shiftPos[1])).map((o) => o[0]);
  for (var i2 = 0;i2 < 2 * n; i2++) {
    V[i2] -= acc[i2];
  }
  let identityMatrix = Array.from({ length: 2 * n }, () => Array(2 * n).fill(0)).map((row, i3) => row.map((val, j2) => i3 === j2 ? 1 : 0));
  let builtMatrix = [[]];
  let zeroN = Array.from({ length: 2 * n }, () => 0);
  for (var i2 = 0;i2 < 2 * n; i2++) {
    builtMatrix.push(zeroN.concat(identityMatrix[i2]).concat([0]));
  }
  for (var i2 = 0;i2 < 2 * n; i2++) {
    builtMatrix.push(F[i2].concat(identityMatrix[i2].map((val) => val * -1)).concat([V[i2]]));
  }
  builtMatrix.push(zeroN.concat(zeroN).concat(0));
  builtMatrix = builtMatrix.slice(1).map((o) => o.map((k) => k * delta));
  let a0 = spinePosition.map((o) => o.x).concat(spinePosition.map((o) => o.y)).concat(spineVel.map((o) => o.x)).concat(spineVel.map((o) => o.y)).concat([1]).map((o) => [o]);
  let newMatrix = padeApproximation(builtMatrix, 5);
  let answer = multiplyMatrices(newMatrix, a0).map((o) => o[0]);
  var pos = [];
  var vel = [];
  for (var i2 = 0;i2 < n; i2++) {
    pos.push(new Point(answer[i2], answer[i2 + n]));
    vel.push(new Point(answer[i2 + 2 * n], answer[i2 + 3 * n]));
  }
  return { spinePosition: pos, spineVel: vel };
}

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
  ].reverse();
  static getCurveBoundingBoxes(inputBString) {
    let count = inputBString.length;
    let curves = [];
    for (var i2 = 0;i2 < count; i2++) {
      curves.push(Curve.fromBSpline(inputBString[i2], inputBString[(i2 + 1) % count], inputBString[(i2 + 2) % count], inputBString[(i2 + 3) % count]));
    }
    return curves.map((o) => o.boundingBox()).map((o) => [o.lowest, o.highest]);
  }
  static AABB(col1, col2) {
    let returnIndecies = [];
    for (var i2 = 0;i2 < col1.length; i2++) {
      for (var j2 = 0;j2 < col2.length; j2++) {
        let xCol = Math.max(col1[i2][0].x, col2[j2][0].x) <= Math.min(col1[i2][1].x, col2[j2][1].x);
        let yCol = Math.max(col1[i2][0].y, col2[j2][0].y) <= Math.min(col1[i2][1].y, col2[j2][1].y);
        if (xCol && yCol) {
          returnIndecies.push([i2, j2]);
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
    let dirFlat = {
      t2: c1dir.t2.dotProduct(norm),
      t1: c1dir.t1.dotProduct(norm),
      t0: c1dir.t0.dotProduct(norm)
    };
    let intersections = this.quadFormula(dirFlat.t2, dirFlat.t1, dirFlat.t0);
    let dists = intersections.filter((o) => o > i1[0] && o < i1[1]).map((o) => curve1.value(curve1coeff, o).dotProduct(norm)).concat([FE1.dotProduct(norm), FE2.dotProduct(norm)]);
    let maxDist = Math.max(...dists);
    let minDist = Math.min(...dists);
    let curve2coeff = curve2.coeff();
    let e0 = [i2[0] * i2[0] * i2[1], i2[0] * i2[1] * i2[1]];
    let e1 = [i2[0] * i2[0], i2[1] * i2[1]].map((o) => -2 * i2[0] * i2[1] - o);
    let e2 = [i2[0] * 2 + i2[1], i2[0] + i2[1] * 2];
    let flattenedCurve = {
      t0: curve2coeff.t0.dotProduct(norm),
      t1: curve2coeff.t1.dotProduct(norm),
      t2: curve2coeff.t2.dotProduct(norm),
      t3: curve2coeff.t3.dotProduct(norm)
    };
    let upLine = {
      t0: flattenedCurve.t0 + e0[0] * flattenedCurve.t3,
      t1: flattenedCurve.t1 + e1[0] * flattenedCurve.t3,
      t2: flattenedCurve.t2 + e2[0] * flattenedCurve.t3
    };
    let downLine = {
      t0: flattenedCurve.t0 + e0[1] * flattenedCurve.t3,
      t1: flattenedCurve.t1 + e1[1] * flattenedCurve.t3,
      t2: flattenedCurve.t2 + e2[1] * flattenedCurve.t3
    };
    let upIntersect1 = this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - maxDist).map((o) => ({
      t: o,
      ingress: upLine.t1 + 2 * upLine.t2 * o < 0 ? 0 : 1,
      line: true
    }));
    let downIntersect1 = this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - maxDist).map((o) => ({
      t: o,
      ingress: downLine.t1 + 2 * downLine.t2 * o < 0 ? 0 : 1,
      line: false
    }));
    let upIntersect2 = this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - minDist).map((o) => ({
      t: o,
      ingress: upLine.t1 + 2 * upLine.t2 * o > 0 ? 0 : -1,
      line: true
    }));
    let downIntersect2 = this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - minDist).map((o) => ({
      t: o,
      ingress: downLine.t1 + 2 * downLine.t2 * o > 0 ? 0 : -1,
      line: false
    }));
    let upCandidates = upIntersect1.concat(upIntersect2).filter((o) => o.t > i2[0] && o.t < i2[1]);
    let downCandidates = downIntersect1.concat(downIntersect2).filter((o) => o.t > i2[0] && o.t < i2[1]);
    let upStart = upLine.t0 + upLine.t1 * i2[0] + upLine.t2 * i2[0] ** 2;
    var upCount = upStart > minDist ? upStart < maxDist ? 0 : 1 : -1;
    let downStart = downLine.t0 + downLine.t1 * i2[0] + downLine.t2 * i2[0] ** 2;
    var downCount = downStart > minDist ? downStart < maxDist ? 0 : 1 : -1;
    let candidates = upCandidates.concat(downCandidates).sort((a, b) => a.t - b.t);
    let endPoints = [];
    if (Math.abs(upCount + downCount) < 2) {
      endPoints.push(i2[0]);
    }
    for (var i3 = 0;i3 < candidates.length; i3++) {
      let prevCount = upCount + downCount;
      if (candidates[i3].line) {
        upCount = candidates[i3].ingress;
      } else {
        downCount = candidates[i3].ingress;
      }
      if (Math.abs(upCount + downCount) < 2 != Math.abs(prevCount) < 2) {
        endPoints.push(candidates[i3].t);
      }
    }
    if (Math.abs(upCount + downCount) < 2) {
      endPoints.push(i2[1]);
    }
    var result = [];
    for (var i3 = 0;i3 < endPoints.length; i3 += 2) {
      result.push([endPoints[i3], endPoints[i3 + 1]]);
    }
    if (result.length == 1) {
      if (result[0][1] - result[0][0] > 0.8 * (i2[1] - i2[0])) {
        let mp = (result[0][0] + result[0][1]) / 2;
        return [
          [result[0][0], mp],
          [mp, result[0][1]]
        ];
      }
    }
    return result;
  }
  static solveCollision(curve1, curve2, i1 = [0, 1], i2 = [0, 1], depth = 5) {
    if (depth == 0) {
      let cr = curve1.value(curve1.coeff1Dir(), i1[0]).crossProduct(curve2.value(curve2.coeff1Dir(), i2[0]));
      let add = cr > 0 ? true : false;
      return [{ i1: i1[0], i2: i2[0], add }];
    }
    let returner = [];
    if (depth % 2 == 0) {
      let refined = this.refineHybclip(curve2, curve1, i2, i1);
      for (var i3 = 0;i3 < refined.length; i3++) {
        let subResult = this.solveCollision(curve1, curve2, refined[i3], i2, depth - 1);
        returner = returner.concat(subResult);
      }
    } else {
      let refined = this.refineHybclip(curve1, curve2, i1, i2);
      for (var i3 = 0;i3 < refined.length; i3++) {
        let subResult = this.solveCollision(curve1, curve2, i1, refined[i3], depth - 1);
        returner = returner.concat(subResult);
      }
    }
    return returner;
  }
  static dir1Force(curve1, curve2, t, u) {
    let tc = curve1.coeff();
    let arrTc = [tc.t0, tc.t1, tc.t2, tc.t3];
    let uc = curve2.coeff();
    let arrUc = [uc.t0, uc.t1, uc.t2, uc.t3];
    let tsd0 = Array(4).fill(Array(4).fill(0)).map((o, j2) => o.map((p, i3) => i3 + j2 == 0 ? 0 : (j2 - i3) / (i3 + j2) * t ** (i3 + j2)));
    let tsd1 = Array(4).fill(Array(4).fill(0)).map((o, j2) => o.map((p, i3) => (j2 - i3) * t ** (i3 + j2 - 1) * arrTc[i3].x * arrTc[j2].y)).flat().reduce((a, b) => a + b);
    let usd0 = Array(4).fill(Array(4).fill(0)).map((o, j2) => o.map((p, i3) => i3 + j2 == 0 ? 0 : (j2 - i3) / (i3 + j2) * u ** (i3 + j2)));
    let usd1 = Array(4).fill(Array(4).fill(0)).map((o, j2) => o.map((p, i3) => (j2 - i3) * u ** (i3 + j2 - 1) * arrUc[i3].x * arrUc[j2].y)).flat().reduce((a, b) => a + b);
    let c1dir = curve1.value(curve1.coeff1Dir(), t);
    let c2dir = curve2.value(curve2.coeff1Dir(), t);
    let curve1Weights = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3];
    let curve2Weights = [(1 - u) ** 3, 3 * (1 - u) ** 2 * u, 3 * (1 - u) * u ** 2, u ** 3];
    let dirMat = [
      [-c1dir.x, c2dir.x],
      [-c1dir.y, c2dir.y]
    ];
    let revDir = InvertMatrix(dirMat);
    let xtcrut = tsd0.map((o, i3) => o.map((p, index) => -arrTc[index].y * p).reduce((a, b) => a + b) + revDir.map((p, index) => [tsd1, usd1][index] * p[0] * curve1Weights[i3]).reduce((a, b) => a + b));
    let ytcrut = tsd0.map((o, i3) => o.map((p, index) => arrTc[index].x * p).reduce((a, b) => a + b) + revDir.map((p, index) => [tsd1, usd1][index] * p[1] * curve1Weights[i3]).reduce((a, b) => a + b));
    let xucrut = usd0.map((o, i3) => o.map((p, index) => -arrUc[index].y * p).reduce((a, b) => a + b) + revDir.map((p, index) => [tsd1, usd1][index] * p[0] * -curve2Weights[i3]).reduce((a, b) => a + b));
    let yucrut = usd0.map((o, i3) => o.map((p, index) => arrUc[index].x * p).reduce((a, b) => a + b) + revDir.map((p, index) => [tsd1, usd1][index] * p[1] * -curve2Weights[i3]).reduce((a, b) => a + b));
    let retT = [];
    let retU = [];
    for (var i2 = 0;i2 < 4; i2++) {
      retT.push(new Point(xtcrut[i2], ytcrut[i2]));
      retU.push(new Point(xucrut[i2], yucrut[i2]));
    }
    return [retT, retU];
  }
  static shrinkCurve(curve) {
    let tc = curve.coeff();
    let arrTc = [tc.t0, tc.t1, tc.t2, tc.t3];
    let tsd0 = Array(4).fill(Array(4).fill(0)).map((o, j2) => o.map((p, i3) => i3 + j2 == 0 ? 0 : (j2 - i3) / (i3 + j2)));
    let xtcrut = tsd0.map((o) => o.map((p, index) => p * -arrTc[index].y).reduce((a, b) => a + b));
    let ytcrut = tsd0.map((o) => o.map((p, index) => p * arrTc[index].x).reduce((a, b) => a + b));
    let ret = [];
    for (var i2 = 0;i2 < 4; i2++) {
      ret.push(new Point(xtcrut[i2], ytcrut[i2]));
    }
    return ret;
  }
}
var collide_default = { detector };
export {
  detector,
  collide_default as default
};
