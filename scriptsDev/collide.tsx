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
        Curve.fromKSpline(
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
}
export default { detector };
