import { Point, Curve, other } from "./geo";
let uuid = crypto.randomUUID;
export class Lizard {
  static dub = (p) => {
      return p.concat(
        p
          .map((o) => ({
            index: o.index,
            offset: new Point(o.offset.x, -o.offset.y),
          }))
          .reverse(),
      );
    };
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
var spineAmount = 6;
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
    Array(spineAmount)
      .fill(0)
      .map(() => new Point(Math.random() + 100, Math.random() + 100)),
    Array(4)
      .fill(0)
      .map(() => new Point(Math.random() + 100, Math.random() + 100)),
    Lizard.dub(
    [
      { index: 5, offset: new Point(50, 4) },
      { index: 4, offset: new Point(0, 7) },
      { index: 3, offset: new Point(0, 10) },
      { index: 2, offset: new Point(-15, 20) },
      { index: 1, offset: new Point(0, 16) },
      { index: 0, offset: new Point(0, 20) },
      { index: 0, offset: new Point(-20, 10) },
    ]),
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
    // console.table(newSpine);
    return newSpine;
  },
  toBodySpace(index: number, point: Point) {
    let bodyPoint: Point = this.myCharacter.spine[index];
    let secant: Point = this.myCharacter.spine[
      index == spineAmount - 1 ? index : index + 1
    ].subtract(this.myCharacter.spine[index == 0 ? index : index - 1]);
    return other.toBSpace(point, bodyPoint, secant.normalise());
  },
  fromBodySpace(index: number, point: Point) {
    let bodyPoint: Point = this.myCharacter.spine[index];
    let secant: Point = this.myCharacter.spine[
      index == spineAmount - 1 ? index : index + 1
    ].subtract(this.myCharacter.spine[index == 0 ? index : index - 1]);
    return other.fromBSpace(point, bodyPoint, secant.normalise());
  },
  // Update arms based on states
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
        newArms[i]
          .subtract(
            this.fromBodySpace(
              this.limbDefs[i].index,
              this.limbDefs[i].baseOffset,
            ),
          )
          .length() >=
        this.limbLength * 2
      ) {
        newArms[i] = other.lockDist(
          this.fromBodySpace(
            this.limbDefs[i].index,
            this.limbDefs[i].baseOffset,
          ),
          newArms[i],
          this.limbLength * 2,
        );
      }
    }
    this.myCharacter.arms = newArms;
    return newArms;
  },
  draw(lizard: Lizard, ctx: any) {
    ctx.lineStyle(4, 0x010000, 1);
    ctx.moveTo(lizard.spine[0].x, lizard.spine[0].y);
    for (var i = 1; i < lizard.spine.length; i++) {
      ctx.lineTo(lizard.spine[i].x, lizard.spine[i].y);
    }
    // ctx.closePath();
    ctx.stroke();
    // draw limbs
    ctx.lineStyle(2, 0xff00ff, 1);
    for (var i = 0; i < 4; i++) {
      let limbDef = this.limbDefs[i];
      let base = this.fromBodySpace(limbDef.index, limbDef.baseOffset);
      let hand = lizard.arms[i];
      let joint = other.inverseKinematics(
        base,
        hand,
        limbDef.clockwise,
        this.limbLength,
      );
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(joint.x, joint.y);
      ctx.lineTo(hand.x, hand.y);
      ctx.stroke();
    }
    let bodyShapePoints = lizard.bodyShape.map((def) =>
      this.fromBodySpace(def.index, def.offset),
    );
    ctx.lineStyle(3, 0x00ff00, 1);
    ctx.moveTo(bodyShapePoints[0].x, bodyShapePoints[0].y);
    for (var i = 1; i < bodyShapePoints.length; i++) {
      ctx.lineTo(bodyShapePoints[i].x, bodyShapePoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  },
  outline(lizard: Lizard): Point[] {
    return lizard.bodyShape.map((def) =>
      this.fromBodySpace(def.index, def.offset),
    );
  }
};
export default { lizardCharacters, Lizard };
