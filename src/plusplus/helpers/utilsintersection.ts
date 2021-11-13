import { plusplusUtilsVector2, Vector2 } from "./utilsvector2";
import { plusplusUtilsMath } from "./utilsmath";
import { ig } from "../../impact/impact";
import { plusplusEntityExtended } from "../core/entity";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export class plusplusUtilsIntersection {
  static bounds(x: number, y: number, width: number, height: number, bounds?: Bounds): Bounds {
    bounds = bounds || { minX: 0, minY: 0, maxX: 0, maxY: 0, height: 0, width: 0 };
    bounds.minX = x;
    bounds.minY = y;
    bounds.maxX = x + width;
    bounds.maxY = y + height;
    bounds.width = width;
    bounds.height = height;

    return bounds;
  }

  static boundsMinMax(minX: number, minY: number, maxX: number, maxY: number, bounds?: Bounds): Bounds {
    bounds = bounds || { minX: 0, minY: 0, maxX: 0, maxY: 0, height: 0, width: 0 };
    bounds.minX = minX;
    bounds.minY = minY;
    bounds.maxX = maxX;
    bounds.maxY = maxY;
    bounds.width = maxX - minX;
    bounds.height = maxY - minY;

    return bounds;
  }

  static boundsOfPoints(points: Vector2[], bounds?: Bounds): Bounds {
    let point = points[0];
    let minX = point.x;
    let minY = point.y;
    let maxX = point.x;
    let maxY = point.y;

    for (let i = 1, il = points.length; i < il; i++) {
      point = points[i];

      if (point.x < minX) minX = point.x;
      else if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      else if (point.y > maxY) maxY = point.y;
    }

    bounds = bounds || { minX: 0, minY: 0, maxX: 0, maxY: 0, height: 0, width: 0 };
    bounds.minX = minX;
    bounds.minY = minY;
    bounds.maxX = maxX;
    bounds.maxY = maxY;
    bounds.width = maxX - minX;
    bounds.height = maxY - minY;

    return bounds;
  }

  static boundsClone(boundsSource: Bounds, offsetX?: number, offsetY?: number, bounds?: Bounds): Bounds {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    const minX = boundsSource.minX + offsetX;
    const minY = boundsSource.minY + offsetY;
    const maxX = boundsSource.maxX + offsetX;
    const maxY = boundsSource.maxY + offsetY;

    bounds = bounds || { minX: 0, minY: 0, maxX: 0, maxY: 0, height: 0, width: 0 };
    bounds.minX = minX;
    bounds.minY = minY;
    bounds.maxX = maxX;
    bounds.maxY = maxY;
    bounds.width = maxX - minX;
    bounds.height = maxY - minY;

    return bounds;
  }

  static boundsCopy(
    boundsA: Bounds,
    boundsB: Bounds,
    offsetX: number,
    offsetY: number,
    scaleX: number,
    scaleY: number
  ): Bounds {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    scaleX = scaleX || 1;
    scaleY = scaleY || 1;

    boundsA.minX = boundsB.minX * scaleX + offsetX;
    boundsA.maxX = boundsB.maxX * scaleX + offsetX;
    boundsA.minY = boundsB.minY * scaleY + offsetY;
    boundsA.maxY = boundsB.maxY * scaleY + offsetY;
    boundsA.width = boundsA.maxX - boundsA.minX;
    boundsA.height = boundsA.maxY - boundsA.minY;

    return boundsA;
  }

  static boundsCopyX(boundsA: Bounds, boundsB: Bounds, offsetX?: number, scaleX?: number): Bounds {
    offsetX = offsetX || 0;
    scaleX = scaleX || 1;

    boundsA.minX = boundsB.minX * scaleX + offsetX;
    boundsA.maxX = boundsB.maxX * scaleX + offsetX;
    boundsA.width = boundsA.maxX - boundsA.minX;

    return boundsA;
  }

  static boundsCopyY(boundsA: Bounds, boundsB: Bounds, offsetY?: number, scaleY?: number): Bounds {
    offsetY = offsetY || 0;
    scaleY = scaleY || 1;

    boundsA.minY = boundsB.minY * scaleY + offsetY;
    boundsA.maxY = boundsB.maxY * scaleY + offsetY;
    boundsA.height = boundsA.maxY - boundsA.minY;

    return boundsA;
  }

  static boundsCopyRotated(boundsA: Bounds, boundsB: Bounds, angle: number): Bounds {
    // ensure angle is between PI and -PI

    angle = angle % plusplusUtilsMath.TWOPI;

    if (angle > Math.PI) {
      angle -= plusplusUtilsMath.TWOPI;
    } else if (angle < -Math.PI) {
      angle += plusplusUtilsMath.TWOPI;
    }

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const width = boundsB.width;
    const height = boundsB.height;

    const hcos = height * cos;
    const wcos = width * cos;
    const hsin = height * sin;
    const wsin = width * sin;

    const minX = boundsB.minX;
    const minY = boundsB.minY;
    const cX = minX + boundsB.width * 0.5;
    const cY = minY + boundsB.height * 0.5;
    const dminX = minX - cX;
    const dminY = minY - cY;
    const x = cX + dminX * cos - dminY * sin;
    const y = cY + dminX * sin + dminY * cos;

    if (angle > 0) {
      if (angle < plusplusUtilsMath.HALFPI) {
        boundsA.minY = y;
        boundsA.maxY = y + hcos + wsin;
        boundsA.minX = x - hsin;
        boundsA.maxX = x + wcos;
      } else {
        boundsA.minY = y + hcos;
        boundsA.maxY = y + wsin;
        boundsA.minX = x - hsin + wcos;
        boundsA.maxX = x;
      }
    } else {
      if (angle < -plusplusUtilsMath.HALFPI) {
        boundsA.minY = y + wsin;
        boundsA.maxY = y + hcos;
        boundsA.minX = x;
        boundsA.maxX = x + wcos - hsin;
      } else {
        boundsA.minY = y + wsin + hcos;
        boundsA.maxY = y;
        boundsA.minX = x + wcos;
        boundsA.maxX = x - hsin;
      }
    }

    boundsA.width = boundsA.maxX - boundsA.minX;
    boundsA.height = boundsA.maxY - boundsA.minY;

    return boundsA;
  }

  static AABBContains(
    aminX: number,
    aminY: number,
    amaxX: number,
    amaxY: number,
    bminX: number,
    bminY: number,
    bmaxX: number,
    bmaxY: number
  ): boolean {
    return aminX >= bminX && amaxX <= bmaxX && aminY >= bminY && amaxY <= bmaxY;
  }

  static AABBIntersect(
    aminX: number,
    aminY: number,
    amaxX: number,
    amaxY: number,
    bminX: number,
    bminY: number,
    bmaxX: number,
    bmaxY: number
  ): boolean {
    return !(amaxX < bminX || aminX > bmaxX || amaxY < bminY || aminY > bmaxY);
  }

  static boundsIntersect(boundsA: Bounds, boundsB: Bounds): boolean {
    return !(
      boundsA.maxX < boundsB.minX ||
      boundsA.minX > boundsB.maxX ||
      boundsA.maxY < boundsB.minY ||
      boundsA.minY > boundsB.maxY
    );
  }

  static boundsAABBIntersect(bounds: Bounds, minX: number, minY: number, maxX: number, maxY: number): boolean {
    return !(bounds.maxX < minX || bounds.minX > maxX || bounds.maxY < minY || bounds.minY > maxY);
  }

  static pointInAABB(x: number, y: number, minX: number, minY: number, maxX: number, maxY: number): boolean {
    return !(x < minX || x > maxX || y < minY || y > maxY);
  }

  static pointInBounds(x: number, y: number, bounds: Bounds): boolean {
    return !(x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY);
  }

  static pointInCircle(x: number, y: number, cx: number, cy: number, radius: number): boolean {
    const dx = cx - x;
    const dy = cy - y;
    const squareDistance = dx * dx + dy * dy;
    const squareRadius = radius * radius;

    return squareDistance < squareRadius;
  }

  static pointInPolygon(x: number, y: number, vertices: Vector2[]): boolean {
    let oddNodes = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; i++) {
      const va = vertices[j];
      const vb = vertices[i];

      // point is a vertex in polygon

      if ((va.x === x && va.y === y) || (vb.x === x && vb.y === y)) {
        oddNodes = true;
        break;
      }
      // raycast edges
      // odd number of crosses = inside polygon
      else if (((vb.y < y && va.y >= y) || (va.y < y && vb.y >= y)) && (vb.x <= x || va.x <= x)) {
        if (vb.x + ((y - vb.y) / (va.y - vb.y)) * (va.x - vb.x) < x) {
          oddNodes = !oddNodes;
        }
      }

      j = i;
    }

    return oddNodes;
  }

  static entitiesInAABB(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    targetable: boolean,
    layerName?: string,
    unsorted?: boolean
  ): plusplusEntityExtended[] {
    let intersected: plusplusEntityExtended[] = [];

    if (!layerName) {
      for (let i = 0; i < ig.game.layers.length; i++) {
        const layer = ig.game.layers[i];

        if (layer.name && layer.numEntities && (!targetable || layer.itemsTargetable.length)) {
          intersected = intersected.concat(
            plusplusUtilsIntersection.entitiesInAABB(minX, minY, maxX, maxY, targetable, layer.name, true)
          );
        }
      }
    } else {
      const layer = ig.game.layersMap[layerName];
      const entities = targetable ? layer.itemsTargetable : layer.items;

      // find if touch intersects bounding box of each entity

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        let intersects;

        // fixed element bounds should not be relative to world space
        // so we need to offset it by screen

        if (entity.fixed) {
          const screenX = ig.game.screen.x;
          const screenY = ig.game.screen.y;

          intersects = plusplusUtilsIntersection.AABBIntersect(
            entity.pos.x + screenX,
            entity.pos.y + screenY,
            entity.pos.x + entity.size.x * entity.scaleMod + screenX,
            entity.pos.y + entity.size.y * entity.scaleMod + screenY,
            minX,
            minY,
            maxX,
            maxY
          );
        } else {
          intersects = plusplusUtilsIntersection.AABBIntersect(
            entity.pos.x,
            entity.pos.y,
            entity.pos.x + entity.size.x * entity.scaleMod,
            entity.pos.y + entity.size.y * entity.scaleMod,
            minX,
            minY,
            maxX,
            maxY
          );
        }

        if (intersects) {
          intersected.push(entity);
        }
      }
    }

    // sort by distance from center of aabb

    if (intersected.length > 1 && !unsorted) {
      plusplusUtilsIntersection.sortByDistance(minX + (maxX - minX) * 0.5, minY + (maxY - minY) * 0.5, intersected);
    }

    return intersected;
  }

  static getIsAABBInScreen(x: number, y: number, width: number, height: number): boolean {
    const adjustedX = x - ig.game.screen.x;
    const adjustedY = y - ig.game.screen.y;

    return plusplusUtilsIntersection.AABBIntersect(
      adjustedX,
      adjustedY,
      adjustedX + width,
      adjustedY + height,
      0,
      0,
      ig.system.width,
      ig.system.height
    );
  }

  static sortByDistance(x: number, y: number, entities: plusplusEntityExtended[]): plusplusEntityExtended[] {
    const pos = plusplusUtilsVector2.set(plusplusUtilsIntersection._utilVec2Sort, x, y);

    entities.sort(function (a, b) {
      const aDistance = a.distanceSquaredEdgeTo(pos);
      const bDistance = b.distanceSquaredEdgeTo(pos);

      return aDistance - bDistance || a.distanceSquaredTo(pos) - b.distanceSquaredTo(pos);
    });

    return entities;
  }

  static _utilVec2Sort = {
    x: 0.1,
    y: 0.1,
  };
}
