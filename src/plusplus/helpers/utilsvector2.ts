import { plusplusUtilsMath } from "./utilsmath";
import { plusplusConfig } from "../core/config";

interface PointsByAngle {
  x: number;
  y: number;
  index: number;
  distance: number;
  angle: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export class plusplusUtilsVector2 {
  static vector(x?: number, y?: number, v?: Vector2): Vector2 {
    v = v || { x: 0, y: 0 };

    plusplusUtilsVector2.set(v, x || 0, y || 0);

    return v;
  }

  static set(v: Vector2, x: number, y: number): Vector2 {
    v.x = x;
    v.y = y;

    return v;
  }

  static setScalar(v: Vector2, s: number): Vector2 {
    v.x = s;
    v.y = s;

    return v;
  }

  static clone(v: Vector2): Vector2 {
    return plusplusUtilsVector2.vector(v.x, v.y);
  }

  static copy(a: Vector2, b: Vector2): Vector2 {
    a.x = b.x;
    a.y = b.y;

    return a;
  }

  static zero(v: Vector2): Vector2 {
    v.x = 0;
    v.y = 0;

    return v;
  }

  static isZero(v: Vector2): boolean {
    return v.x === 0 && v.y === 0;
  }

  static isAlmostZero(v: Vector2): boolean {
    return (
      plusplusUtilsMath.almostEqual(v.x, 0, plusplusConfig.PRECISION_ZERO) &&
      plusplusUtilsMath.almostEqual(v.y, 0, plusplusConfig.PRECISION_ZERO)
    );
  }

  static equal(a: Vector2, b: Vector2): boolean {
    return a.x === b.x && a.y === b.y;
  }

  static inverse(v: Vector2): Vector2 {
    v.x = -v.x;
    v.y = -v.y;

    return v;
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    a.x += b.x;
    a.y += b.y;

    return a;
  }

  static addVectors(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
    };
  }

  static addScalar(v: Vector2, s: number): Vector2 {
    v.x += s;
    v.y += s;

    return v;
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    a.x -= b.x;
    a.y -= b.y;

    return a;
  }

  static subtractVectors(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
    };
  }

  static subtractScalar(v: Vector2, s: number): Vector2 {
    v.x -= s;
    v.y -= s;

    return v;
  }

  static multiply(a: Vector2, b: Vector2): Vector2 {
    a.x *= b.x;
    a.y *= b.y;

    return a;
  }

  static multiplyVectors(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x * b.x,
      y: a.y * b.y,
    };
  }

  static multiplyScalar(v: Vector2, s: number): Vector2 {
    v.x *= s;
    v.y *= s;

    return v;
  }

  static divide(a: Vector2, b: Vector2): Vector2 {
    a.x /= b.x;
    a.y /= b.y;

    return a;
  }

  static divideVectors(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x / b.x,
      y: a.y / b.y,
    };
  }

  static divideScalar(v: Vector2, s: number): Vector2 {
    v.x /= s;
    v.y /= s;

    return v;
  }

  static min(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x < b.x ? a.x : b.x,
      y: a.y < b.y ? a.y : b.y,
    };
  }

  static max(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x > b.x ? a.x : b.x,
      y: a.y > b.y ? a.y : b.y,
    };
  }

  static abs(v: Vector2): Vector2 {
    if (v.x < 0) {
      v.x = -v.x;
    }

    if (v.y < 0) {
      v.y = -v.y;
    }

    return v;
  }

  static lengthV(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static lengthSquared(v: Vector2): number {
    return v.x * v.x + v.y * v.y;
  }

  static normalize(v: Vector2): Vector2 {
    const length = plusplusUtilsVector2.lengthV(v);

    if (length >= Number.MIN_VALUE) {
      const invLength = 1 / length;

      v.x *= invLength;
      v.y *= invLength;
    }

    return v;
  }

  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  static cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  }

  static crossVF(v: Vector2, s: number): Vector2 {
    const x = v.x;
    v.x = s * v.y;
    v.y = -s * x;

    return v;
  }

  static crossFV(v: Vector2, s: number): Vector2 {
    const x = v.x;
    v.x = -s * v.y;
    v.y = s * x;

    return v;
  }

  static rotate(v: Vector2, angle: number, originX: number, originY: number): Vector2 {
    const s = Math.sin(angle);
    const c = Math.cos(angle);

    // translate point to origin

    const translatedX = v.x - originX;
    const translatedY = v.y - originY;

    // rotate point and undo translation

    v.x = originX + translatedX * c - translatedY * s;
    v.y = originY + translatedX * s + translatedY * c;

    return v;
  }

  static projectPoints(
    points: Vector2[],
    offsetX?: number,
    offsetY?: number,
    scaleX?: number,
    scaleY?: number,
    angle?: number,
    angleOffsetX?: number,
    angleOffsetY?: number
  ): Vector2[] {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    scaleX = scaleX || 1;
    scaleY = scaleY || 1;
    angle = angle || 0;

    const pointsProjected = [];
    let point;
    let pointRotated;

    if (angle !== 0) {
      angleOffsetX = angleOffsetX || 0;
      angleOffsetY = angleOffsetY || 0;

      for (let i = 0; i < points.length; i++) {
        point = points[i];
        pointRotated = plusplusUtilsVector2.rotate(point, angle, angleOffsetX, angleOffsetY);
        pointsProjected[i] = {
          x: pointRotated.x * scaleX + offsetX,
          y: pointRotated.y * scaleY + offsetY,
        };
      }
    } else {
      for (let i = 0; i < points.length; i++) {
        point = points[i];
        pointsProjected[i] = {
          x: point.x * scaleX + offsetX,
          y: point.y * scaleY + offsetY,
        };
      }
    }

    return pointsProjected;
  }

  static centerOfPoints(points: Vector2[]): Vector2 {
    let cx = 0;
    let cy = 0;
    let point;

    for (let i = 0; i < points.length; i++) {
      point = points[i];
      cx += point.x;
      cy += point.y;
    }

    return {
      x: cx / points.length,
      y: cy / points.length,
    };
  }

  static pointsCW(p1: Vector2, p2: Vector2, p3: Vector2): number {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  static radianBetweenPoints(a: Vector2, b: Vector2, c: Vector2): number {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const cbx = b.x - c.x;
    const cby = b.y - c.y;

    const dot = abx * cbx + aby * cby;
    const cross = abx * cby - aby * cbx;

    return Math.atan2(cross, dot);
  }

  static pointsToConvexHull(points: Vector2[]): Vector2[] {
    if (points.length < 3) return points;

    // find the point with the smallest y

    let indexMin = 0;
    let pointMin = points[indexMin];
    let point;

    for (let i = 1; i < points.length; i++) {
      point = points[i];

      if (point.y === pointMin.y) {
        if (point.x < pointMin.x) {
          indexMin = i;
          pointMin = point;
        }
      } else if (point.y < pointMin.y) {
        indexMin = i;
        pointMin = point;
      }
    }

    // sort points by angle from min

    const pointsByAngle = [];
    let pointFromMin: PointsByAngle;

    for (let i = 0; i < points.length; i++) {
      if (i === indexMin) continue;
      point = points[i];

      pointFromMin = {
        x: point.x,
        y: point.y,
        angle: 0,
        distance: 0,
        index: 0,
      };

      pointFromMin.angle = Math.atan((point.y - pointMin.y) / (point.x - pointMin.x));

      if (pointFromMin.angle < 0) pointFromMin.angle += Math.PI;

      pointFromMin.distance =
        (point.x - pointMin.x) * (point.x - pointMin.x) + (point.y - pointMin.y) * (point.y - pointMin.y);
      pointFromMin.index = i;

      pointsByAngle.push(pointFromMin);
    }

    pointsByAngle.sort(function (a: PointsByAngle, b: PointsByAngle) {
      if (a.angle < b.angle) return -1;
      else if (a.angle > b.angle) return 1;
      else {
        if (a.distance < b.distance) return -1;
        else if (a.distance > b.distance) return 1;
      }

      return 0;
    });

    // add last point and min point to beginning

    pointsByAngle.unshift(pointsByAngle[pointsByAngle.length - 1], {
      x: pointMin.x,
      y: pointMin.y,
      index: indexMin,
    });

    // search for convex hull
    // loc is location, and at end of search the final index

    let pointTemp;
    let loc = 2;

    for (let i = 3; i <= points.length; i++) {
      // find next valid point

      while (plusplusUtilsVector2.pointsCW(pointsByAngle[loc - 1], pointsByAngle[loc], pointsByAngle[i]) <= 0) {
        loc--;
      }

      loc++;

      pointTemp = pointsByAngle[i];
      pointsByAngle[i] = pointsByAngle[loc];
      pointsByAngle[loc] = pointTemp;
    }

    const pointsSorted = [];

    for (let i = 0; i <= loc; i++) {
      pointsSorted[i] = points[pointsByAngle[i].index];
    }

    return pointsSorted;
  }

  static Q_1 = 1;

  static Q_2 = 1 << 2;

  static Q_3 = 1 << 3;

  static Q_4 = 1 << 4;

  static pointQuadrant(x: number, y: number, originX: number, originY: number): number {
    let q;
    const dx = originX - x;
    const dy = originY - y;

    if (dx === 0 && dy === 0) {
      q = plusplusUtilsVector2.Q_1 | plusplusUtilsVector2.Q_2 | plusplusUtilsVector2.Q_3 | plusplusUtilsVector2.Q_4;
    } else if (dx === 0) {
      if (dy < 0) q = plusplusUtilsVector2.Q_3 | plusplusUtilsVector2.Q_4;
      else q = plusplusUtilsVector2.Q_1 | plusplusUtilsVector2.Q_2;
    } else if (dy === 0) {
      if (dx < 0) q = plusplusUtilsVector2.Q_2 | plusplusUtilsVector2.Q_4;
      else q = plusplusUtilsVector2.Q_1 | plusplusUtilsVector2.Q_3;
    } else {
      q = 1;
      if (dx < 0) q = 2;
      if (dy < 0) q += 2;
      q = 1 << q;
    }

    return q;
  }

  static directionThreshold(v: Vector2, thresholdX: number, thresholdY: number): Vector2 {
    thresholdX = thresholdX || 0;
    thresholdY = thresholdY || 0;

    // check x/y against threshold to try and zero them out
    // defer to larger threshold

    if (thresholdY < thresholdX) {
      if (v.y !== 0) {
        if (plusplusUtilsMath.almostEqual(v.x, 0, thresholdX)) {
          v.x = 0;
        }
      }

      if (v.x !== 0) {
        if (plusplusUtilsMath.almostEqual(v.y, 0, thresholdY)) {
          v.y = 0;
        }
      }
    } else {
      if (v.x !== 0) {
        if (plusplusUtilsMath.almostEqual(v.y, 0, thresholdY)) {
          v.y = 0;
        }
      }

      if (v.y !== 0) {
        if (plusplusUtilsMath.almostEqual(v.x, 0, thresholdX)) {
          v.x = 0;
        }
      }
    }

    return v;
  }

  static directionToString(v: Vector2): string {
    // get direction from x/y

    const xDir = plusplusUtilsMath.direction(v.x);
    const yDir = plusplusUtilsMath.direction(v.y);

    for (const direction in plusplusUtilsVector2.DIRECTION) {
      const dv = plusplusUtilsVector2.DIRECTION[direction as keyof typeof plusplusUtilsVector2.DIRECTION];

      if (dv.x === xDir && dv.y === yDir) {
        return direction;
      }
    }

    return "NONE";
  }

  static DIRECTION = {
    NONE: plusplusUtilsVector2.vector(),
    LEFT: plusplusUtilsVector2.vector(-1, 0),
    RIGHT: plusplusUtilsVector2.vector(1, 0),
    UP: plusplusUtilsVector2.vector(0, -1),
    DOWN: plusplusUtilsVector2.vector(0, 1),
    UPLEFT: plusplusUtilsVector2.vector(-1, -1),
    UPRIGHT: plusplusUtilsVector2.vector(1, -1),
    DOWNLEFT: plusplusUtilsVector2.vector(-1, 1),
    DOWNRIGHT: plusplusUtilsVector2.vector(1, 1),
  };
}
