var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// scriptsDev/geo.tsx
var require_geo = __commonJS(() => {
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
});
export default require_geo();
