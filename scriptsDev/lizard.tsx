let uuid = crypto.randomUUID;
class Lizard {
  id: string;
  spine: Point[];
  arms: Point[];
  bodyShape: { index: number; offset: Point }[];
  spineLength = 6;
  constructor(
    id: string,
    spine: Point[],
    arms: Point[],
    bodyShape: { index: number; offset: Point }[],
  ) {
    this.id = id;
    this.spine = spine;
    this.arms = arms;
    this.bodyShape = bodyShape;
  }
}
var lizardCharacters = {
  lineLength: 50,
  myCharacter: new Lizard(
    crypto.randomUUID(),
    Array(6).map(() => new Point(Math.random(), Math.random())),
    [new Point(-5, -60), new Point(5, 60), new Point(-5, 50), new Point(5, 50)],
    [
      { index: 5, offset: new Point(0, 4) },
      { index: 4, offset: new Point(0, 7) },
      { index: 3, offset: new Point(0, 10) },
      { index: 2, offset: new Point(-15, 20) },
      { index: 1, offset: new Point(0, 16) },
      { index: 0, offset: new Point(0, 20) },
      { index: 0, offset: new Point(20, 10) },
    ],
  ),
  others: {} as Record<string, Lizard>,
  updateSpine(
    spine: Point[],
    direction: Point,
    origin: number,
    deltaT: number,
  ) {
    let newSpine = spine;
    newSpine[0] = newSpine[0].add(direction.scale(deltaT));
    // Forward pass towards head
    for (var i = 1; i < spine.length; i++) {
      newSpine[i] = geo.other.lockDist(
        newSpine[i - 1],
        newSpine[i],
        this.lineLength,
      );
    }
    // optional central pass towards origin, implement later
    // 
  },
};
