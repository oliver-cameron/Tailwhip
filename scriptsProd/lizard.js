var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// scriptsDev/lizard.tsx
var require_lizard = __commonJS(() => {
  class Lizard {
    id;
    spine;
    arms;
    bodyShape;
    spineLength = 6;
    constructor(id, spine, arms, bodyShape) {
      this.id = id;
      this.spine = spine;
      this.arms = arms;
      this.bodyShape = bodyShape;
    }
  }
  var lizardCharacters = {
    lineLength: 50,
    myCharacter: new Lizard(crypto.randomUUID(), Array(6).map(() => new Point(Math.random(), Math.random())), [new Point(-5, -60), new Point(5, 60), new Point(-5, 50), new Point(5, 50)], [
      { index: 5, offset: new Point(0, 4) },
      { index: 4, offset: new Point(0, 7) },
      { index: 3, offset: new Point(0, 10) },
      { index: 2, offset: new Point(-15, 20) },
      { index: 1, offset: new Point(0, 16) },
      { index: 0, offset: new Point(0, 20) },
      { index: 0, offset: new Point(20, 10) }
    ]),
    others: {},
    updateSpine(spine, direction, origin, deltaT) {
      let newSpine = spine;
      newSpine[0] = newSpine[0].add(direction.scale(deltaT));
      for (var i = 1;i < spine.length; i++) {
        newSpine[i] = geo.other.lockDist(newSpine[i - 1], newSpine[i], this.lineLength);
      }
    }
  };
});
export default require_lizard();
