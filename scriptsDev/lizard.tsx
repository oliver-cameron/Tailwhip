import { Point, Curve, other } from "./geo";
let uuid = crypto.randomUUID;
export class Lizard {
  id: string;
  spine: Point[];
  vel: { oldPoints: Point[]; velocitySpine: Point[] };
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
    this.vel = {
      oldPoints: spine,
      velocitySpine: Array(spine.length).fill(Point.zero),
    };
  }
}
export type armMotions = "walk" | "return";
export var lizardCharacters = {
  lineLength: 50,
  limbLength: 40,
  limbDefs: [
    // left arm
    {
      index: 1,
      baseOffset: new Point(0, -15),
      handOffset: new Point(-5, -60),
      clockwise: false,
    },
    // right arm
    {
      index: 1,
      baseOffset: new Point(0, 15),
      handOffset: new Point(5, 60),
      clockwise: true,
    },
    // left leg
    {
      index: 3,
      baseOffset: new Point(0, -5),
      handOffset: new Point(-5, -50),
      clockwise: true,
    },
    // right leg
    {
      index: 3,
      baseOffset: new Point(0, 5),
      handOffset: new Point(5, 50),
      clockwise: false,
    },
  ] as {
    index: number;
    handOffset: Point;
    baseOffset: Point;
    clockwise: boolean;
    // Point map is where the point is in bspace
    pointMap: Point;
  }[],
  myCharacter: new Lizard(
    crypto.randomUUID(),
    Array(6)
      .fill(0)
      .map(() => new Point(Math.random() + 100, Math.random() + 100)),
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
    lizard: Lizard,
    direction: Point,
    origin: number,
    deltaT: any,
  ): Point[] {
    let newSpine = lizard.spine;
    newSpine[0] = newSpine[0].add(
      direction.scale(deltaT.deltaTime) ?? Point.zero,
    );
    // Apply velocity
    for (var i = 1; i < newSpine.length; i++) {
      newSpine[i] = newSpine[i].add(
        lizard.vel.velocitySpine[i].scale(deltaT.deltaTime).scale(0.9),
      );
    }
    // Apply springs
    for (var i = 2; i < newSpine.length; i++) {
      newSpine[i] = other.spring(
        newSpine[i - 2],
        newSpine[i - 1],
        newSpine[i],
        0.5,
        0.1,
        deltaT.deltaTime,
      );
    }
    // Forward pass towards head
    for (var i = 1; i < newSpine.length; i++) {
      newSpine[i] = other.lockDist(
        newSpine[i - 1],
        newSpine[i],
        this.lineLength,
      );
    }
    // optional central pass towards origin, implement later
    // get new velocities
    for (var i = 0; i < newSpine.length; i++) {
      lizard.vel.velocitySpine[i] = newSpine[i]
        .subtract(lizard.spine[i])
        .scale(1 / deltaT.deltaTime);
    }
    this.myCharacter.spine = newSpine;
    console.table(newSpine);
    return newSpine;
  },
  updateArms(
    lizard: Lizard,
    states: armMotions[],
  ): [Point, Point, Point, Point] {
    let newArms: [Point, Point, Point, Point] = lizard.arms as [
      Point,
      Point,
      Point,
      Point,
    ];
    for (var i = 0; i < 4; i++) {
      // enforce arm length
      if (
        newArms[i].subtract(this.limbDefs[i].baseOffset).length() >=
        this.limbLength * 2
      ) {
        newArms[i] = other.lockDist(
          this.limbDefs[i].baseOffset,
          newArms[i],
          this.limbLength * 2,
        );
      }
    }
    return newArms;
  },
  draw(lizard: Lizard, ctx: any) {
    ctx.lineStyle(4, 0x010000, 1);
    ctx.moveTo(lizard.spine[0].x, lizard.spine[0].y);
    for (var i = 1; i < lizard.spine.length; i++) {
      ctx.lineTo(lizard.spine[i].x, lizard.spine[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  },
};
export default { lizardCharacters, Lizard };
