import { Point, Curve, other } from "./geo";
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
  static getCurveBoundingBoxes(inputKString: Point[]): [Point, Point][] {
    let count = inputKString.length;
    let curves: Curve[] = [] as Curve[];
    for (var i = 0; i < count; i++) {
      curves.push(
        Curve.fromBSpline(
          inputKString[i],
          inputKString[(i + 1) % count],
          inputKString[(i + 2) % count],
          inputKString[(i + 3) % count],
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
    if(a === 0){
      if(b === 0){
        return [];
      }
      return [-c/b];
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
  ){
    // 1. Get fat line
    let curve1coeff = curve1.coeff();
    let FE1 = curve1.value(curve1coeff, i1[0]);
    let FE2 = curve1.value(curve1coeff, i1[1]);
    let vec = FE2.subtract(FE1);
    let norm = new Point(-vec.y, vec.x);
    let c1dir = curve1.coeff1Dir()
    let dirFlat = {t2: c1dir.t2.dotProduct(norm), t1: c1dir.t1.dotProduct(norm), t0: c1dir.t0.dotProduct(norm)}
    let intersections = this.quadFormula(dirFlat.t2, dirFlat.t1, dirFlat.t0)
    let dists = intersections.filter(o => o > i1[0] && o < i1[1]).map(o => curve1.value(curve1coeff, o).dotProduct(norm)).concat([FE1.dotProduct(norm), FE2.dotProduct(norm)]);
    let maxDist = Math.max(...dists);
    let minDist = Math.min(...dists);
    // 2. Get implicit line of curve2
    let curve2coeff = curve2.coeff()
    let e0 = [i2[0] * i2[0] * i2[1], i2[0] * i2[1] * i2[1]]
    let e1 = [i2[0] * i2[0], i2[1] * i2[1]].map((o) => -2 * i2[0] * i2[1] - o );
    let e2 = [i2[0] * 2 + i2[1], i2[0] + i2[1] * 2]
    let flattenedCurve = {t0: curve2coeff.t0.dotProduct(norm), t1: curve2coeff.t1.dotProduct(norm), t2: curve2coeff.t2.dotProduct(norm), t3: curve2coeff.t3.dotProduct(norm)}
    let upLine = {t0: flattenedCurve.t0 + e0[0] * flattenedCurve.t3, t1: flattenedCurve.t1 + e1[0] * flattenedCurve.t3, t2: flattenedCurve.t2 + e2[0] * flattenedCurve.t3}
    let downLine = {t0: flattenedCurve.t0 + e0[1] * flattenedCurve.t3, t1: flattenedCurve.t1 + e1[1] * flattenedCurve.t3, t2: flattenedCurve.t2 + e2[1] * flattenedCurve.t3}
    // 3. Get intersection of implicit line with fat line
    let upIntersect1: {t: number, ingress: boolean}[] = this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - maxDist).map(o => ({t: o, ingress: upLine.t1 + 2 * upLine.t2 * o < 0}));
    let downIntersect1: {t: number, ingress: boolean}[] = this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - maxDist).map(o => ({t: o, ingress: downLine.t1 + 2 * downLine.t2 * o < 0}));
    let upIntersect2: {t: number, ingress: boolean}[] = this.quadFormula(upLine.t2, upLine.t1, upLine.t0 - minDist).map(o => ({t: o, ingress: upLine.t1 + 2 * upLine.t2 * o > 0}));
    let downIntersect2: {t: number, ingress: boolean}[] = this.quadFormula(downLine.t2, downLine.t1, downLine.t0 - minDist).map(o => ({t: o, ingress: downLine.t1 + 2 * downLine.t2 * o > 0}));
    let upCandidates: {t: number, ingress: boolean}[] = upIntersect1.concat(upIntersect2).filter(o => o.t > i2[0] && o.t < i2[1])
    let downCandidates: {t: number, ingress: boolean}[] = downIntersect1.concat(downIntersect2).filter(o => o.t > i2[0] && o.t < i2[1])
    let upStart = upLine.t0 + upLine.t1 * i2[0] + upLine.t2 * i2[0] ** 2
    let downStart = downLine.t0 + downLine.t1 * i2[0] + downLine.t2 * i2[0] ** 2
    let countStart = ((upStart > minDist && upStart < maxDist) ? 0 : 1) + ((downStart > minDist && downStart < maxDist) ? 0 : 1)
    let candidates = upCandidates.concat(downCandidates).sort((a, b) => a.t - b.t);
    let endPoints: number[] = []
    if(countStart < 2){
      endPoints.push(i2[0]);
    }
    console.log(countStart)
    console.log(candidates)  
    var count = countStart;
    for(var i = 0; i < candidates.length; i++){
      if(candidates[i].ingress){
        count--;
        if(count == 1){
          endPoints.push(candidates[i].t);
        }
      } else {
        count++;
        if(count == 2){
          endPoints.push(candidates[i].t);
        }
      }
    }
    if(count < 2){
      endPoints.push(i2[1]);
    }
    var result: [number, number][] = [];
    for(var i = 0; i < endPoints.length; i+= 2){
      result.push([endPoints[i], endPoints[i+1]]);
    }
    if(result.length == 1){
      if(result[0][1] - result[0][0] > 0.8 * (i2[1] - i2[0])){
        let mp = (result[0][0] + result[0][1]) / 2;
        return [[result[0][0], mp],[mp, result[0][1]]];
      }
    }
    return result;
  }
}
export default { detector };
