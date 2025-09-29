var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// scriptsDev/newSpine.tsx
var require_newSpine = __commonJS(() => {
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
    console.log(U);
    console.log(L);
    for (let i = 0;i < n; i++) {
      for (let j = i + 1;j < n; j++) {
        let div = U[j][i] / U[i][i];
        L[j][i] = div;
        for (let k = i;k < n; k++) {
          U[j][k] -= div * U[i][k];
        }
        console.table(U);
        console.table(L);
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
    let scalar = absMat > 1 ? Math.ceil(Math.log2(absMat)) : 1;
    let deltaMat = Matrix.map((row) => row.map((x2) => x2 / 2 ** scalar));
    let powerCache = [deltaMat];
    let coefficients = [];
    for (let i2 = 1;i2 <= order; i2++) {
      powerCache.push(multiplyMatrices(powerCache[i2 - 1], deltaMat));
      coefficients.push(factorial(order * 2 - i2) * factorial(order) / (factorial(order * 2) * factorial(i2) * factorial(order - i2)));
    }
    let numerator = powerCache.map((i2, index) => i2.map((row) => row.map((val) => val * coefficients[index]))).reduce((a, b) => matrixAddition(a, b));
    let denominator = powerCache.map((i2, index) => i2.map((row) => row.map((val) => val * coefficients[index] * (index % 2 === 0 ? 1 : -1)))).reduce((a, b) => matrixAddition(a, b));
    let { L, U } = LUDecompose(denominator);
    let x = Array.from({ length: size }, () => Array(size).fill(0));
    for (var v = 0;v < size; v++) {
      let y = Array(size).fill(0);
      for (var i = 0;i < size; i++) {
        let sum = numerator[i][v];
        if (i !== 0) {
          for (var j = 0;j < i - 1; j++) {
            sum -= L[i][j] * y[j];
          }
          y[i] /= L[i][i];
        }
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
  console.log(padeApproximation([
    [9, 2],
    [7, 1]
  ], 5));
});
export default require_newSpine();
