import { Point, Curve, other } from "./geo";
import {InvertMatrix, multiplyMatricies } from "./newSpine.tsx"
export class detector {
  static blobloop: Point[] = [
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
    new Point(450, 500),
  ];
  static getCurveBoundingBoxes(inputBString: Point[]): [Point, Point][] {
    let count = inputBString.length;
    let curves: Curve[] = [] as Curve[];
    for (var i = 0; i < count; i++) {
      curves.push(
        Curve.fromBSpline(
          inputBString[i],
          inputBString[(i + 1) % count],
          inputBString[(i + 2) % count],
          inputBString[(i + 3) % count],
        ),
      );
    }
    return curves.map((o) => o.boundingBox()).map((o) => [o.lowest, o.highest]);
  }
  static AABB(
    col1: [Point, Point][],
    col2: [Point, Point][],
  ): [number, number][] {
    let returnIndecies: [number, number][] = [] as [number, number][];
    for (var i = 0; i < col1.length; i++) {
      for (var j = 0; j < col2.length; j++) {
        // Check if boxes are colliding
        let xCol: boolean =
          Math.max(col1[i][0].x, col2[j][0].x) <=
          Math.min(col1[i][1].x, col2[j][1].x);
        let yCol: boolean =
          Math.max(col1[i][0].y, col2[j][0].y) <=
          Math.min(col1[i][1].y, col2[j][1].y);
        if (xCol && yCol) {
          returnIndecies.push([i, j]);
        }
      }
    }
    return returnIndecies;
  }
  static quadFormula(a: number, b: number, c: number): number[] {
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
  static refineHybclip(
    curve1: Curve,
    curve2: Curve,
    i1: [number, number],
    i2: [number, number],
  ): [number, number][] {
    // 1. Get fat line
    let curve1coeff = curve1.coeff();
    let FE1 = curve1.value(curve1coeff, i1[0]);
    let FE2 = curve1.value(curve1coeff, i1[1]);
    let vec = FE2.subtract(FE1);
    let norm = new Point(-vec.y, vec.x);
    let c1dir = curve1.coeff1Dir();
    let dirFlat = {
      t2: c1dir.t2.dotProduct(norm),
      t1: c1dir.t1.dotProduct(norm),
      t0: c1dir.t0.dotProduct(norm),
    };
    let intersections = this.quadFormula(dirFlat.t2, dirFlat.t1, dirFlat.t0);
    let dists = intersections
      .filter((o) => o > i1[0] && o < i1[1])
      .map((o) => curve1.value(curve1coeff, o).dotProduct(norm))
      .concat([FE1.dotProduct(norm), FE2.dotProduct(norm)]);
    let maxDist = Math.max(...dists);
    let minDist = Math.min(...dists);
    // 2. Get implicit line of curve2
    let curve2coeff = curve2.coeff();
    let e0 = [i2[0] * i2[0] * i2[1], i2[0] * i2[1] * i2[1]];
    let e1 = [i2[0] * i2[0], i2[1] * i2[1]].map((o) => -2 * i2[0] * i2[1] - o);
    let e2 = [i2[0] * 2 + i2[1], i2[0] + i2[1] * 2];
    let flattenedCurve = {
      t0: curve2coeff.t0.dotProduct(norm),
      t1: curve2coeff.t1.dotProduct(norm),
      t2: curve2coeff.t2.dotProduct(norm),
      t3: curve2coeff.t3.dotProduct(norm),
    };
    let upLine = {
      t0: flattenedCurve.t0 + e0[0] * flattenedCurve.t3,
      t1: flattenedCurve.t1 + e1[0] * flattenedCurve.t3,
      t2: flattenedCurve.t2 + e2[0] * flattenedCurve.t3,
    };
    let downLine = {
      t0: flattenedCurve.t0 + e0[1] * flattenedCurve.t3,
      t1: flattenedCurve.t1 + e1[1] * flattenedCurve.t3,
      t2: flattenedCurve.t2 + e2[1] * flattenedCurve.t3,
    };
    // 3. Get intersection of implicit line with fat line
    // Ingress:
    // Going to above max: 1
    // Going to between min and max: 0
    // Going to below min: -1
    // Line: true for up, false for down
    let upIntersect1: { t: number; ingress: number; line: boolean }[] =
      this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - maxDist).map((o) => ({
        t: o,
        ingress: upLine.t1 + 2 * upLine.t2 * o < 0 ? 0 : 1,
        line: true,
      }));
    let downIntersect1: { t: number; ingress: number; line: boolean }[] =
      this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - maxDist).map(
        (o) => ({
          t: o,
          ingress: upLine.t1 + 2 * upLine.t2 * o < 0 ? 0 : 1,
          line: false,
        }),
      );
    let upIntersect2: { t: number; ingress: number; line: boolean }[] =
      this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - minDist).map((o) => ({
        t: o,
        ingress: upLine.t1 + 2 * upLine.t2 * o > 0 ? 0 : -1,
        line: true,
      }));
    let downIntersect2: { t: number; ingress: number; line: boolean }[] =
      this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - minDist).map(
        (o) => ({
          t: o,
          ingress: downLine.t1 + 2 * downLine.t2 * o > 0 ? 0 : -1,
          line: false,
        }),
      );
    let upCandidates: { t: number; ingress: number; line: boolean }[] =
      upIntersect1
        .concat(upIntersect2)
        .filter((o) => o.t > i2[0] && o.t < i2[1]);
    let downCandidates: { t: number; ingress: number; line: boolean }[] =
      downIntersect1
        .concat(downIntersect2)
        .filter((o) => o.t > i2[0] && o.t < i2[1]);
    let upStart = upLine.t0 + upLine.t1 * i2[0] + upLine.t2 * i2[0] ** 2;
    var upCount: number = upStart > minDist ? (upStart < maxDist ? 0 : 1) : -1;
    let downStart =
      downLine.t0 + downLine.t1 * i2[0] + downLine.t2 * i2[0] ** 2;
    var downCount: number =
      downStart > minDist ? (downStart < maxDist ? 0 : 1) : -1;
    let candidates = upCandidates
      .concat(downCandidates)
      .sort((a, b) => a.t - b.t);
    let endPoints: number[] = [];
    if (Math.abs(upCount + downCount) < 2) {
      endPoints.push(i2[0]);
    }
    for (var i = 0; i < candidates.length; i++) {
      let prevCount = upCount + downCount;
      if (candidates[i].line) {
        upCount = candidates[i].ingress;
      } else {
        downCount = candidates[i].ingress;
      }
      if (Math.abs(upCount + downCount) < 2 != Math.abs(prevCount) < 2) {
        endPoints.push(candidates[i].t);
      }
    }
    if (Math.abs(upCount + downCount) < 2) {
      endPoints.push(i2[0]);
    }
    var result: [number, number][] = [];
    for (var i = 0; i < endPoints.length; i += 2) {
      result.push([endPoints[i], endPoints[i + 1]]);
    }
    if (result.length == 1) {
      if (result[0][1] - result[0][0] > 0.8 * (i2[1] - i2[0])) {
        let mp = (result[0][0] + result[0][1]) / 2;
        return [
          [result[0][0], mp],
          [mp, result[0][1]],
        ];
      }
    }
    return result;
  }
  static solveCollision(
    curve1: Curve,
    curve2: Curve,
    i1: [number, number] = [0, 1],
    i2: [number, number] = [0, 1],
    depth: number = 5,
  ): { i1: [number, number]; i2: [number, number] }[] {
    if (depth == 0) {
      return [{ i1: i1, i2: i2 }];
    }
    let returner = [] as {
      i1: [number, number];
      i2: [number, number];
    }[];
    if (depth % 2 == 0) {
      let refined = this.refineHybclip(curve2, curve1, i2, i1);
      console.log(depth);
      for (var i = 0; i < refined.length; i++) {
        let subResult = this.solveCollision(
          curve1,
          curve2,
          refined[i],
          i2,
          depth - 1,
        );
        returner = returner.concat(subResult);
      }
    } else {
      let refined = this.refineHybclip(curve1, curve2, i1, i2);
      console.log(depth);
      for (var i = 0; i < refined.length; i++) {
        let subResult = this.solveCollision(
          curve1,
          curve2,
          i1,
          refined[i],
          depth - 1,
        );
        returner = returner.concat(subResult);
      }
    }
    return returner;
  }
  static dir1TU(
    curve1: Curve,
    curve2: Curve,
    t: Number,
    u: Number,
  ): Number[][][]{
    // Top down return structure: (x,y), (p0, p1, p2, p3), (t,u)
    let curve1Weights = [(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t**2, t**3]
    let curve2Weights = [(1-u)**3, 3*(1-u)**2*u, 3*(1-u)*u**2, u**3]
    let curve1dir = curve1.value(curve1.coeff1Dir, t)
    let curve2dir = curve2.value(curve2.coeff2Dir, t)
    let dirMat = [
      [-curve1dir.x, curve2dir.x]
      [-curve1dir.y, curve2dir.y]
    ]
    let revDir = InvertMatrix(dirMat)
   
  }
  static dir1Force(
    curve1: Curve,
    curve2: Curve,
    t: Number,
    u: Number,
  ){
    let tc = curve1.coeff()
    tc = [tc.t0, tc.t1, tc.t2, tc.t3]
    let uc = curve2.coeff()
    uc = [uc.t0, uc.t1, uc.t2, uc.t3]
    let tsd0 = Array(4).fill(Array(4).fill(0)).map((o, j) => o.map((p,i) => (i+j == 0) ? 0 : (j-i) / (i+j) * t ** (i+j)))
    let tsd1 = Array(4).fill(Array(4).fill(0)).map((o, j) => o.map((p,i) => (j-i) * t ** (i+j - 1) * tc[i].x * tc[j].y)).flat().reduce((a,b) => a+b)
    
    let usd0 = Array(4).fill(Array(4).fill(0)).map((o, j) => o.map((p,i) => (i+j == 0) ? 0 : (j-i) / (i+j) * u ** (i+j)))
    let usd1 = Array(4).fill(Array(4).fill(0)).map((o, j) => o.map((p,i) => (j-i) * u ** (i+j - 1) * uc[i].x * uc[j].y)).flat().reduce((a,b) => a+b)
    let c1dir = curve1.value(curve1.coeff1Dir(), t)
    let c2dir = curve2.value(curve2.coeff1Dir(), t)
    let curve1Weights = [(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t**2, t**3]
    let curve2Weights = [(1-u)**3, 3*(1-u)**2*u, 3*(1-u)*u**2, u**3]
    let dirMat = [
      [-c1dir.x, c2dir.x],
      [-c1dir.y, c2dir.y]
    ]
    let revDir = InvertMatrix(dirMat)
    let xtcrut = tsd0.map((o, i) => o.map((p, index) => -tc[index].y * p).reduce((a,b) => a+b) + dirMat.map((p, index) => [tsd1, usd1][index] * p[0] *  curve1Weights[i] ).reduce((a,b) => a+b))
    let ytcrut = tsd0.map((o, i) => o.map((p, index) => tc[index].x * p).reduce((a,b) => a+b) + dirMat.map((p, index) => [tsd1, usd1][index] * p[1] *   curve1Weights[i] ).reduce((a,b) => a+b))
    let xucrut = tsd0.map((o, i) => o.map((p, index) => -uc[index].y * p).reduce((a,b) => a+b) + dirMat.map((p, index) => [tsd1, usd1][index] * p[0] * -curve1Weights[i] ).reduce((a,b) => a+b))
    let yucrut = tsd0.map((o, i) => o.map((p, index) => uc[index].x * p).reduce((a,b) => a+b) + dirMat.map((p, index) => [tsd1, usd1][index] * p[1] *  -curve1Weights[i] ).reduce((a,b) => a+b))

    return [xtcrut.concat(ytcrut), xucrut.concat(yucrut)]
  }
}

let C1 = new Curve(
  new Point(1, -1),
  new Point(0.7, -0.7),
  new Point(0.2, -0.7),
  new Point(0, -1),
);
let C2 = new Curve(
  new Point(0.2, -0.4),
  new Point(0.3, -1.4),
  new Point(0.7, -1.3),
  new Point(0.9, -0.4),
);
console.log("HI");
console.log(detector.solveCollision(C1, C2))
export default { detector };
