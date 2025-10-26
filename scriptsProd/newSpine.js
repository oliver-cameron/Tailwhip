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
  spine.velocity[0] = spine.velocity[0].add(headforce.scale(deltaTime / 1000));
  let update = padeNextFrame(spine.points, spine.velocity, deltaTime / 1000);
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
      console.log();
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
console.table(padeApproximation([
  [1, 2],
  [0, -1]
], 5));
var targetLength = 20;
var springForces = [
  {
    coefficients: [1 / 9, 11 / 54, -10 / 27, 1 / 18],
    targetLength: targetLength * 10 / 27,
    stiffness: 1
  },
  {
    coefficients: [-1 / 18, 23 / 54, -23 / 54, 1 / 18],
    targetLength: targetLength * 7 / 27,
    stiffness: 1
  },
  {
    coefficients: [-1 / 18, 10 / 27, -11 / 54, -1 / 9],
    targetLength: targetLength * 10 / 27,
    stiffness: 1
  }
];
function padeNextFrame(spinePosition, spineVel, delta) {
  let n = spinePosition.length;
  let F = new Array(2 * n).fill(0).map(() => new Array(2 * n).fill(0));
  let V = new Array(2 * n).fill(0).map(() => 0);
  for (var i = -1;i < n - 2; i++) {
    let indecies = [i, i + 1, i + 2, i + 3];
    if (i == -1) {
      indecies = [0, 1, 2];
    }
    if (i == n - 3) {
      indecies = [n - 3, n - 2, n - 1];
    }
    for (var j = 0;j < 3; j++) {
      let coeffs = springForces[j].coefficients;
      let targetLength2 = springForces[j].targetLength;
      let stiffness = springForces[j].stiffness;
      if (i == -1) {
        coeffs[1] += coeffs[0];
        coeffs[2] -= coeffs[0] * 2;
        coeffs = coeffs.slice(1);
      }
      if (i == n - 3) {
        coeffs[1] -= coeffs[3] * 2;
        coeffs[2] += coeffs[3];
        coeffs = coeffs.slice(0, 3);
      }
      let S = indecies.map((o, index) => spinePosition[o].scale(coeffs[index])).reduce((a, b) => a.add(b));
      let sLen = Math.hypot(S.x, S.y);
      let sLenNeg3 = Math.pow(sLen, -3);
      for (var k = 0;k < indecies.length; k++) {
        for (var a1 = 0;a1 < 2; a1++) {
          let t1 = 2 * (a1 == 0 ? S.x : S.y) * coeffs[k] * stiffness;
          V[indecies[k] + n * a1] += t1 * (targetLength2 - sLen);
          for (var l = 0;l < indecies.length; l++) {
            let lm = coeffs[l] * targetLength2 * sLenNeg3 * t1;
            for (var a2 = 0;a2 < 2; a2++) {
              F[indecies[k] + n * a1][indecies[l] + n * a2] += (a2 == 0 ? S.x : S.y) * lm;
            }
          }
          let sum = F[indecies[k] + n * a1].reduce((a, b) => a + b);
        }
      }
    }
  }
  let identityMatrix = Array.from({ length: 2 * n }, () => Array(2 * n).fill(0)).map((row, i2) => row.map((val, j2) => i2 === j2 ? 1 : 0));
  let builtMatrix = [[]];
  let zeroN = Array.from({ length: 2 * n }, () => 0);
  for (var i = 0;i < 2 * n; i++) {
    builtMatrix.push(zeroN.concat(identityMatrix[i]).concat([0]));
  }
  for (var i = 0;i < 2 * n; i++) {
    builtMatrix.push(zeroN.concat(zeroN).concat(V[i]));
  }
  builtMatrix.push(zeroN.concat(zeroN).concat(0));
  builtMatrix = builtMatrix.slice(1).map((o) => o.map((k2) => k2 * delta));
  let a0 = spinePosition.map((o) => o.x).concat(spinePosition.map((o) => o.y)).concat(spineVel.map((o) => o.x)).concat(spineVel.map((o) => o.y)).concat([1]).map((o) => [o]);
  let newMatrix = padeApproximation(builtMatrix, 5);
  let answer = multiplyMatrices(newMatrix, a0).map((o) => o[0]);
  var pos = [];
  var vel = [];
  for (var i = 0;i < n; i++) {
    pos.push(new Point(answer[i], answer[i + n]));
    vel.push(new Point(answer[i + 2 * n], answer[i + 3 * n]));
  }
  return { spinePosition: pos, spineVel: vel };
}
export {
  updateSpine,
  Spine
};
