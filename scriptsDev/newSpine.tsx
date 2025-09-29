// import { Point, Curve } from "./geo";
// export class Spine {
//   points: Point[];
//   velocity: Point[];
//   constructor(points: Point[]) {
//     this.points = points;
//     this.velocity = Array(points.length).fill(Point.zero);
//   }
// }
// let stiffness = 1;
// let segmentLength = 20;
// let inertia = 0.6;
// let mass = 50;
// export function updateSpine(
//   spine: Spine,
//   headforce: Point,
//   deltaTime: number,
// ): Spine {
//   let newSpine = spine;
//   // Calculate interior forces
//   let pointAmount = spine.points.length;
//   let differences: Point[] = Array(pointAmount - 1)
//     .fill(Point.zero)
//     .map((element: Point, index: number) =>
//       spine.points[index].subtract(spine.points[index + 1]),
//     );
//   let springForces: Point[] = differences.map((diff: Point) =>
//     diff.scale(stiffness * (diff.length() - segmentLength)),
//   );
//   let forces: Point[] = Array(pointAmount)
//     .fill(Point.zero)
//     .map((element: Point, index: number) =>
//       (index == pointAmount - 1 ? Point.zero : springForces[index])
//         .subtract(index == 0 ? Point.zero : springForces[index - 1])
//         .scale(-1),
//     );
//   let newVel = spine.velocity.map((vel: Point, index: number) =>
//     vel.scale(inertia).add(forces[index].scale(deltaTime / mass)),
//   );
//   newVel[0] = newVel[0].add(headforce.scale(deltaTime / mass));
//   // Update positions
//   let newPoints = spine.points.map((point: Point, index: number) =>
//     point.add(newVel[index].scale(deltaTime)),
//   );
//   newSpine.points = newPoints;
//   newSpine.velocity = newVel;
//   return newSpine;
// }

import { multiplyColors } from "pixi.js";

function multiplyMatrices(lhs: number[][], rhs: number[][]): number[][] {
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
  // console.log("DeltaMat", deltaMat);
  let coefficients: number[] = [1];
  for (let i = 1; i <= order; i++) {
    powerCache.push(multiplyMatrices(powerCache[i - 1], deltaMat));
    coefficients.push(
      (factorial(order * 2 - i) * factorial(order)) /
        (factorial(order * 2) * factorial(i) * factorial(order - i)),
    );
  }
  // console.log("PowerCache", powerCache);
  // console.log("Coefficients", coefficients);
  let numerator = powerCache
    .map((i, index) =>
      i.map((row) => row.map((val) => val * coefficients[index])),
    )
    .reduce((a, b) => matrixAddition(a, b));
  // console.log("Numerator", numerator);
  let denominator = powerCache
    .map((i, index) =>
      i.map((row) =>
        row.map(
          (val) => val * coefficients[index] * (index % 2 === 0 ? 1 : -1),
        ),
      ),
    )
    .reduce((a, b) => matrixAddition(a, b));
  // console.log("Denominator", denominator);
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
      console.log();
      if (i !== 0) {
        for (var j = 0; j < i; j++) {
          sum -= L[i][j] * y[j];
        }
      }
      y[i] = sum / L[i][i];
    }
    console.log("Y", y);
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
console.log(
  padeApproximation(
    [
      [1, 2],
      [0, -1],
    ],
    5,
  ),
);
