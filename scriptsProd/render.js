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
function updateSpine(spine, headforce, deltaTime) {
  spine.velocity[0] = spine.velocity[0].add(headforce.scale(deltaTime));
  let update = padeNextFrame(spine.points, spine.velocity, deltaTime / 10);
  spine.points = update.spinePosition;
  spine.velocity = update.spineVel;
  let avgVel = spine.velocity.reduce((a, b) => a.add(b)).scale(1 / spine.points.length);
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
console.log(springData);
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
function padeNextFrame(spinePosition, spineVel, delta) {
  let n = spinePosition.length;
  let { F, V } = bodySprings(spinePosition);
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
  ];
  static getCurveBoundingBoxes(inputKString) {
    let count = inputKString.length;
    let curves = [];
    for (var i2 = 0;i2 < count; i2++) {
      curves.push(Curve.fromKSpline(inputKString[i2], inputKString[(i2 + 1) % count], inputKString[(i2 + 2) % count], inputKString[(i2 + 3) % count]));
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
}
var collide_default = { detector };

// scriptsDev/render.tsx
var app = new PIXI.Application;
await app.init({ background: "#FFF", resizeTo: window, antialias: true });
console.log(app);
console.log("hello");
console.log(PIXI);
document.getElementById("graphics").appendChild(app.canvas);
var gfx = new PIXI.Graphics;
var testSpine = new Spine([
  new Point(200, 200),
  new Point(200, 260),
  new Point(260, 260),
  new Point(260, 200),
  new Point(260, 300),
  new Point(300, 310)
]);
var keyboard = {};
window.addEventListener("keydown", (e) => {
  keyboard[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  keyboard[e.key] = false;
});
var blob = detector.blobloop;
function drawKSplineSegment(p0, p1, p2, p3) {
  let b0 = p1;
  let b1 = {
    x: p1.x - 0.25 * p0.x + 0.25 * p2.x,
    y: p1.y - 0.25 * p0.y + 0.25 * p2.y
  };
  let b2 = {
    x: 0.25 * p1.x + p2.x - 0.25 * p3.x,
    y: 0.25 * p1.y + p2.y - 0.25 * p3.y
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
  testSpine = updateSpine(testSpine, headForce, delta.deltaTime);
  gfx.clear();
  gfx.lineStyle(4, 1, 1);
  gfx.moveTo(testSpine.points[0].x, testSpine.points[0].y);
  for (let i3 = 1;i3 < testSpine.points.length; i3++) {
    gfx.lineTo(testSpine.points[i3].x, testSpine.points[i3].y);
  }
  gfx.stroke();
  lizardCharacters.myCharacter.spine = testSpine.points;
  let outline = lizardCharacters.outline(lizardCharacters.myCharacter);
  gfx.lineStyle(2, 255, 1);
  gfx.moveTo(outline[0].x, outline[0].y);
  for (var i2 = 0;i2 < outline.length; i2++) {
    drawKSplineSegment(outline[(i2 - 1 + outline.length) % outline.length], outline[i2], outline[(i2 + 1) % outline.length], outline[(i2 + 2) % outline.length]);
  }
  gfx.closePath();
  gfx.stroke();
  gfx.lineStyle(2, 65280, 1);
  gfx.moveTo(blob[1].x, blob[1].y);
  for (var i2 = 0;i2 < blob.length; i2++) {
    drawKSplineSegment(blob[i2], blob[(i2 + 1) % blob.length], blob[(i2 + 2) % blob.length], blob[(i2 + 3) % blob.length]);
  }
  gfx.stroke();
  let lizBox = detector.getCurveBoundingBoxes(outline);
  gfx.lineStyle(1, 16776960, 1);
  for (var i2 = 0;i2 < lizBox.length; i2++) {
    let curBox = lizBox[i2];
    gfx.moveTo(curBox[0].x, curBox[0].y);
    gfx.lineTo(curBox[1].x, curBox[0].y);
    gfx.lineTo(curBox[1].x, curBox[1].y);
    gfx.lineTo(curBox[0].x, curBox[1].y);
    gfx.lineTo(curBox[0].x, curBox[0].y);
  }
  gfx.stroke();
  let blobBox = detector.getCurveBoundingBoxes(blob);
  gfx.lineStyle(1, 16776960, 1);
  for (var i2 = 0;i2 < blobBox.length; i2++) {
    let curBox = blobBox[i2];
    gfx.moveTo(curBox[0].x, curBox[0].y);
    gfx.lineTo(curBox[1].x, curBox[0].y);
    gfx.lineTo(curBox[1].x, curBox[1].y);
    gfx.lineTo(curBox[0].x, curBox[1].y);
    gfx.lineTo(curBox[0].x, curBox[0].y);
  }
  gfx.stroke();
  let collisionIndecies = detector.AABB(lizBox, blobBox);
  gfx.lineStyle(1, 16711680, 1);
  for (var i2 = 0;i2 < collisionIndecies.length; i2++) {
    let collisionIndex = collisionIndecies[i2];
    let curBox1 = lizBox[collisionIndex[0]];
    gfx.moveTo(curBox1[0].x, curBox1[0].y);
    gfx.lineTo(curBox1[1].x, curBox1[0].y);
    gfx.lineTo(curBox1[1].x, curBox1[1].y);
    gfx.lineTo(curBox1[0].x, curBox1[1].y);
    gfx.lineTo(curBox1[0].x, curBox1[0].y);
    let curBox2 = blobBox[collisionIndex[1]];
    gfx.moveTo(curBox2[0].x, curBox2[0].y);
    gfx.lineTo(curBox2[1].x, curBox2[0].y);
    gfx.lineTo(curBox2[1].x, curBox2[1].y);
    gfx.lineTo(curBox2[0].x, curBox2[1].y);
    gfx.lineTo(curBox2[0].x, curBox2[0].y);
  }
  gfx.stroke();
  lizardCharacters.updateArms(lizardCharacters.myCharacter, [
    "walk",
    "walk",
    "walk",
    "walk"
  ]);
  gfx.lineStyle(1, 16, 1);
  gfx.moveTo(0, 0);
  gfx.lineTo(100, 100);
  gfx.closePath();
  gfx.stroke();
});
