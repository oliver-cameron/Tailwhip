import { Point, Curve } from "./geo";
export class Spine {
  points: Point[];
  velocity: Point[];
  constructor(points: Point[]) {
    this.points = points;
    this.velocity = Array(points.length).fill(Point.zero);
  }
}
// let stiffness = 1;
// let segmentLength = 20;
// let inertia = 0.6;
// let mass = 50;
export function updateSpine(
  spine: Spine,
  headforce: Point,
  deltaTime: number,
): Spine {
  spine.velocity[0] = spine.velocity[0].add(headforce.scale(deltaTime));
  // spine.velocity[spine.velocity.length - 1] = spine.velocity[
  //   spine.velocity.length - 1
  // ].subtract(headforce.scale(deltaTime));
  let update = padeNextFrame(spine.points, spine.velocity, deltaTime / 10);
  spine.points = update.spinePosition;
  spine.velocity = update.spineVel;
  let avgVel = spine.velocity
    .reduce((a, b) => a.add(b))
    .scale(1 / spine.points.length);
  // spine.points = spine.points.map((o) => o.subtract(avgVel));
  return spine;
}

export function multiplyMatrices(lhs: number[][], rhs: number[][]): number[][] {
  // A row is an array of numbers
  // Check dimensions
  let lhsHeight = lhs[0].length;
  for (var i = 0; i < lhs.length; i++) {
    if (lhs[i].length != lhsHeight) {
      throw new Error("LHS is not a valid matrix");
    }
  }
  let rhsHeight = rhs[0].length;
  for (var i = 0; i < rhs.length; i++) {
    if (rhs[i].length != rhsHeight) {
      throw new Error("RHS is not a valid matrix");
    }
  }
  if (lhsHeight != rhs.length) {
    throw new Error("Matrix dimensions do not match");
  }
  // Multiply Matrices
  let returner: number[][] = Array.from({ length: lhs.length }, () =>
    Array(rhs[0].length).fill(0),
  );
  for (var i = 0; i < lhs.length; i++) {
    for (var j = 0; j < rhs[0].length; j++) {
      let sum = 0;
      for (var k = 0; k < lhsHeight; k++) {
        sum += lhs[i][k] * rhs[k][j];
      }
      returner[i][j] = sum;
    }
  }
  return returner;
}
function LUDecompose(Matrix: number[][]): { L: number[][]; U: number[][] } {
  let n = Matrix.length;
  let L: number[][] = Array.from({ length: n }, () => Array(n).fill(0)).map(
    (row, i) => row.map((val, j) => (i === j ? 1 : 0)),
  );
  let U = multiplyMatrices(L, Matrix);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let div = U[j][i] / U[i][i];
      L[j][i] = div;
      for (let k = i; k < n; k++) {
        U[j][k] -= div * U[i][k];
      }
    }
  }
  return { L, U };
}
function factorial(n: number): number {
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
function matrixAddition(lhs: number[][], rhs: number[][]): number[][] {
  return lhs.map((row, i) => row.map((val, j) => val + rhs[i][j]));
}
function padeApproximation(Matrix: number[][], order: number): number[][] {
  let size = Matrix.length;
  for (var i = 0; i < size; i++) {
    if (Matrix[i].length != size) {
      throw new Error("Matrix is not square");
    }
  }
  let absMat: number = Matrix.map((row) =>
    row.map((x) => Math.abs(x)).reduce((a: number, b: number) => a + b),
  ).reduce((a, b) => (a > b ? a : b));
  let scalar: number = absMat > 1 ? Math.ceil(Math.log2(absMat)) : 0;
  let deltaMat = Matrix.map((row) => row.map((x) => x / 2 ** scalar));
  let powerCache: number[][][] = [
    Array.from({ length: size }, () => Array(size).fill(0)).map((row, i) =>
      row.map((val, j) => (i === j ? 1 : 0)),
    ),
  ];

  let coefficients: number[] = [1];
  for (let i = 1; i <= order; i++) {
    powerCache.push(multiplyMatrices(powerCache[i - 1], deltaMat));
    coefficients.push(
      (factorial(order * 2 - i) * factorial(order)) /
        (factorial(order * 2) * factorial(i) * factorial(order - i)),
    );
  }

  let numerator = powerCache
    .map((i, index) =>
      i.map((row) => row.map((val) => val * coefficients[index])),
    )
    .reduce((a, b) => matrixAddition(a, b));

  let denominator = powerCache
    .map((i, index) =>
      i.map((row) =>
        row.map(
          (val) => val * coefficients[index] * (index % 2 === 0 ? 1 : -1),
        ),
      ),
    )
    .reduce((a, b) => matrixAddition(a, b));

  // LU decomposition of denominator
  let { L, U } = LUDecompose(denominator);
  let x: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  // Forward and backward substitution
  for (var v = 0; v < size; v++) {
    // Forward substitution
    let y = Array(size)
      .fill(0)
      .map(() => 0);
    for (var i = 0; i < size; i++) {
      let sum = numerator[i][v];

      if (i !== 0) {
        for (var j = 0; j < i; j++) {
          sum -= L[i][j] * y[j];
        }
      }
      y[i] = sum / L[i][i];
    }

    // Backward substitution
    for (var i = size - 1; i >= 0; i--) {
      let sum = y[i];
      for (var j = i + 1; j < size; j++) {
        sum -= U[i][j] * x[j][v];
      }
      x[i][v] = sum / U[i][i];
    }
  }

  // Rescale
  for (var i = 0; i < scalar; i++) {
    x = multiplyMatrices(x, x);
  }
  return x;
}
function krylovApproximation(
  matrix: number[][],
  start: number[],
  order: number,
  delta: number,
): number[] {
  let n = matrix.length;
  let B = matrix.map((row) => row.map((val) => val * delta));
  let m = order;
  let Q: number[][] = Array.from({ length: m + 1 }, () => Array(n).fill(0));

  let startNorm = Math.sqrt(start.reduce((a, b) => a + b * b, 0));
  let q0 = start.map((val) => val / startNorm);
  for (var i = 0; i < n; i++) {
    Q[i][0] = q0[i];
  }
  let H: number[][] = Array.from({ length: m + 1 }, () => Array(m).fill(0));
  let { Q: finalQ, H: finalH } = KAIteration(m, B, Q, H);

  let expH = padeApproximation(
    finalH.slice(0, m).map((row) => row.slice(0, m)),
    6,
  );
  let result = multiplyMatrices(
    finalQ.map((row) => row.slice(0, m)),
    expH,
  )[0].map((val) => val * startNorm);
  return result;
}
export function InvertMatrix(matrix: number[][]): number[][]{
  // Check matrix is square  
  let n = matrix.length
  for(var i = 0; i < n; i++){
    if(matrix[i].length != n){
      throw new Error("Matrix is not square")
    }
  }
  let L: number[][] = Array.from({ length: n }, () => Array(n).fill(0)).map(
    (row, i) => row.map((val, j) => (i === j ? 1 : 0)),
  );
  // Down pass  
  for(var i = 0; i < n; i++){
    for(var j=i+1; j < n; j++){
      let scale = matrix[j][i] / matrix[i][i]
      for(var k = 0; k < n; k++){
        matrix[j][k] -= scale * matrix[i][k]
        L[j][k] -= scale * L[i][k]
      }
    }
  }
  // Up Pass
  for(var i = n-1; i >=0; i--){
    for(var j = n-1; j > i; j--){
      let scale = matrix[j][i] / matrix[i][i]
      for(var k = 0; k < n; k++){
        matrix[j][k] -= scale * matrix[i][k]
        L[j][k] -= scale * L[i][k]
      }
    }
  }
  // Through Pass
  for(var i = 0; i < n; i++){
    for(var j = 0; j < n; j++){
      L[i][j] /= matrix[i][i] 
    }
  }
  return L
}
function KAIteration(
  // M: iteration number
  // B is square matrix. Q is result matrix, with same height, and width = m + 1.
  // H is hessianberg matrix to fill in, which is which height is m+1, and width is m
  M: number,
  B: number[][],
  Q: number[][],
  H: number[][],
): { Q: number[][]; H: number[][] } {
  // Check dimensions
  let n = B.length;
  {
    if (Q[0].length != n || Q.length != M + 1) {
      throw new Error("Q has wrong dimensions");
    }
    for (var i = 0; i < n; i++) {
      if (B[i].length != n) {
        throw new Error("B is not square");
      }
      if (Q[i].length != n) {
        throw new Error("Q is not a matrix");
      }
    }
    for (var i = 0; i <= M; i++) {
      if (H[i].length != M) {
        throw new Error("H has wrong dimensions");
      }
    }
  }
  // Begin iteration
  for (var k = 1; k <= M; k++) {
    // 1. Compute the k-th column of Q
    let qk = multiplyMatrices(B, [Q.map((row) => row[k - 1])])[0];
    for (var j = 0; j < k; j++) {
      let dot = 0;
      for (var i = 0; i < n; i++) {
        dot += qk[i] * Q[i][j];
      }
      H[j][k - 1] = dot;
      for (var i = 0; i < n; i++) {
        qk[i] -= dot * Q[i][j];
      }
    }
    let norm = Math.sqrt(qk.reduce((a, b) => a + b * b, 0));
    if (norm < 1e-10) {
    }
    qk = qk.map((val) => val / norm);
    for (var i = 0; i < n; i++) {
      Q[i][k] = qk[i];
    }
    H[k - 1][k - 1] = norm;
  }
  return { Q, H };
}
let bodyLineLength = 50;
let springForces: {
  coefficients: number[];
  targetLength: number;
  stiffness: number;
}[] = [
  {
    coefficients: [1 / 9, 11 / 54, -10 / 27, 1 / 18],
    targetLength: (bodyLineLength * 10) / 27,
    stiffness: 50,
  },
  {
    coefficients: [-1 / 18, 23 / 54, -23 / 54, 1 / 18],
    targetLength: (bodyLineLength * 7) / 27,
    stiffness: 50,
  },
  {
    coefficients: [-1 / 18, 10 / 27, -11 / 54, -1 / 9],
    targetLength: (bodyLineLength * 10) / 27,
    stiffness: 50,
  },
];
let pointAmount = 6;
let springData: {
  coefficients: number[];
  targetLength: number;
  stiffness: number;
}[] = [{ coefficients: [], targetLength: 0, stiffness: 0 }];
for (var i = 0; i < springForces.length; i++) {
  for (var j = 0; j < pointAmount - 3; j++) {
    let coeffRow = Array(pointAmount).fill(0);
    coeffRow.splice(j, 4, ...springForces[i].coefficients);
    springData.push({
      coefficients: coeffRow,
      targetLength: springForces[i].targetLength,
      stiffness: springForces[i].stiffness,
    });
  }
  // Handle start
  let coeffRowStart = Array(pointAmount).fill(0);
  let startCoeffs = [...springForces[i].coefficients];
  startCoeffs[1] += startCoeffs[0] * 2;
  startCoeffs[2] -= startCoeffs[0];
  coeffRowStart.splice(0, 3, ...startCoeffs.slice(1));
  springData.push({
    coefficients: coeffRowStart,
    targetLength: springForces[i].targetLength,
    stiffness: springForces[i].stiffness,
  });
  // Handle end
  let coeffRowEnd = Array(pointAmount).fill(0);
  let endCoeffs = [...springForces[i].coefficients];
  endCoeffs[endCoeffs.length - 3] -= endCoeffs[endCoeffs.length - 1];
  endCoeffs[endCoeffs.length - 2] += endCoeffs[endCoeffs.length - 1] * 2;
  coeffRowEnd.splice(
    pointAmount - 3,
    3,
    ...endCoeffs.slice(0, endCoeffs.length - 1),
  );
  springData.push({
    coefficients: coeffRowEnd,
    targetLength: springForces[i].targetLength,
    stiffness: springForces[i].stiffness,
  });
}
springData = springData.slice(1);
console.log(springData);
function bodySprings(spinePosition: Point[]): { F: number[][]; V: number[] } {
  let n = spinePosition.length;
  let F = new Array(2 * n).fill(0).map(() => new Array(2 * n).fill(0));
  let V = new Array(2 * n).fill(0).map(() => 0);
  for (var i = 0; i < springData.length; i++) {
    let coeffs = springData[i].coefficients;
    let targetLength = springData[i].targetLength;
    let stiffness = springData[i].stiffness;
    let S: Point = coeffs
      .map((o, index) => spinePosition[index].scale(o))
      .reduce((a, b) => a.add(b));
    let invSlen = 1 / S.length;
    let sLenNeg3 = invSlen ** 3;
    // tslen = T / |s|
    let tslen = targetLength * invSlen;
    // First, we compute V
    // Handle X
    let xv = coeffs.map((o) => -2 * stiffness * o * S.x * (1 - tslen));
    for (var j = 0; j < n; j++) {
      V[j] += xv[j];
    }
    // Handle Y
    let yv = coeffs.map((o) => -2 * stiffness * o * S.y * (1 - tslen));
    for (var j = 0; j < n; j++) {
      V[j + n] += yv[j];
    }
    // Then, we compute F's blocks
    // Handle XX
    // tsxl = T sx^2 / |s|^3
    let tsxl = targetLength * sLenNeg3 * S.x * S.x;
    for (var a = 0; a < n; a++) {
      for (var b = 0; b < n; b++) {
        let addVal =
          -2 * stiffness * coeffs[a] * coeffs[b] * (1 - tslen + tsxl);
        F[a][b] += addVal;
      }
    }
    // Handle YY
    let tsyl = targetLength * sLenNeg3 * S.y * S.y;
    for (var a = 0; a < n; a++) {
      for (var b = 0; b < n; b++) {
        let addVal =
          -2 * stiffness * coeffs[a] * coeffs[b] * (1 - tslen + tsyl);
        F[a + n][b + n] += addVal;
      }
    }
    // Handle XY (yx block is the same)
    let tsxy = targetLength * sLenNeg3 * S.x * S.y;
    for (var a = 0; a < n; a++) {
      for (var b = 0; b < n; b++) {
        let addVal = -2 * stiffness * coeffs[a] * coeffs[b] * tsxy;
        F[a][b + n] += addVal;
        F[a + n][b] += addVal;
      }
    }
  }
  return { F, V };
}
function padeNextFrame(
  spinePosition: Point[],
  spineVel: Point[],
  delta: number,
): { spinePosition: Point[]; spineVel: Point[] } {
  // Calculate matrix
  // Vector values are p1x, p2x, p3x, ..., p1y, p2y, p3y, ... v1x, v2x, v3x, ..., v1y, v2y, v3y, ..., 1
  // > 1. Construct blocks for dynamic force matrix (nxn), f and static force vector (nx1), v
  let n = spinePosition.length;
  let { F, V } = bodySprings(spinePosition);
  //Subroutine: Change last column of matrix to account for velocity
  let shiftPos = spinePosition
    .map((o) => [[[o.x]], [[o.y]]])
    .reduce((a, b) => [a[0].concat(b[0]), a[1].concat(b[1])]);
  let acc = multiplyMatrices(F, shiftPos[0].concat(shiftPos[1])).map(
    (o) => o[0],
  );
  for (var i = 0; i < 2 * n; i++) {
    V[i] -= acc[i];
  }
  // Step 2: Construct matrix from sub-blocks
  let identityMatrix: number[][] = Array.from({ length: 2 * n }, () =>
    Array(2 * n).fill(0),
  ).map((row, i) => row.map((val, j) => (i === j ? 1 : 0)));
  let builtMatrix: number[][] = [[]];
  let zeroN: number[] = Array.from({ length: 2 * n }, () => 0);
  for (var i = 0; i < 2 * n; i++) {
    builtMatrix.push(zeroN.concat(identityMatrix[i]).concat([0]));
  }
  for (var i = 0; i < 2 * n; i++) {
    // also add some minor damping
    builtMatrix.push(
      F[i].concat(identityMatrix[i].map((val) => val * -1)).concat([V[i]]),
    );
  }
  builtMatrix.push(zeroN.concat(zeroN).concat(0));
  builtMatrix = builtMatrix.slice(1).map((o) => o.map((k) => k * delta));

  let a0 = spinePosition
    .map((o) => o.x)
    .concat(spinePosition.map((o) => o.y))
    .concat(spineVel.map((o) => o.x))
    .concat(spineVel.map((o) => o.y))
    .concat([1])
    .map((o) => [o]);
  // Perform estimates for matrix exponentiation
  let newMatrix = padeApproximation(builtMatrix, 5);
  let answer = multiplyMatrices(newMatrix, a0).map((o) => o[0]);
  var pos = [];
  var vel = [];
  for (var i = 0; i < n; i++) {
    pos.push(new Point(answer[i], answer[i + n]));
    vel.push(new Point(answer[i + 2 * n], answer[i + 3 * n]));
  }
  return { spinePosition: pos, spineVel: vel };
}
console.log(InvertMatrix([
  [1,0, 0,0],
  [-3, 3, 0, 0],
  [3, -6, 3, 0],
  [-1, 3, -3, 1]
]
))
