import { plusplusCollisionMap } from "../core/collision-map";
import { TileDef } from "../../impact/collision-map";
import { plusplusConfig } from "../core/config";
import { ig } from "../../impact/impact";
import { plusplusUtilsVector2, Vector2 } from "./utilsvector2";
import { plusplusUtils } from "./utils";
import { plusplusUtilsIntersection } from "./utilsintersection";

export type Contour = {
  vertices: Vector2[];
  verticesActual?: Vector2[];
  verticesHollow?: Vector2[];
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
  width?: number;
  height?: number;
};

type Overlap = {
  type: "NONE" | "PARTIAL" | "FULL";
  overlap?: {
    segmentA: { va: Vector2; vb: Vector2 };
    segmentB: { va: Vector2; vb: Vector2 };
  };
};

type Segment = { a: number; b: number; normal: { x: number; y: number } };

type ShapesList = {
  oneWays: Shape[];
  solids: Shape[];
  climbables: Shape[];
};

type Shape = {
  x?: number;
  y?: number;
  vertices: Vector2[];
  segments: Segment[];
  settings?: Record<string, any>;
  id?: number;
};

type ShapedTile = {
  id: number;
  ix: number;
  iy: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: Shape;
};

export class plusplusUtilsTile {
  static defaultTileVerticesDef: Record<number, Vector2[]> = {};
  static defaultTileSegmentsDef: Record<number, Segment[]> = {};
  static _collisionMap: plusplusCollisionMap = null;
  static _collisionMapTileDef: TileDef = null;

  static rebuild(collisionMap: plusplusCollisionMap): void {
    if (
      collisionMap instanceof plusplusCollisionMap &&
      collisionMap.tiledef !== plusplusUtilsTile._collisionMapTileDef
    ) {
      plusplusUtilsTile.unload();

      plusplusUtilsTile._collisionMap = collisionMap;
      plusplusUtilsTile._collisionMapTileDef =
        plusplusUtilsTile._collisionMap.tiledef || plusplusCollisionMap.defaultTileDef;

      // calculate shapes (vertices, segments, normals) from each kind of tile

      for (const tileId in plusplusUtilsTile._collisionMapTileDef) {
        plusplusUtilsTile.shapeFromTile(parseInt(tileId, 10), plusplusUtilsTile._collisionMapTileDef);
      }

      // don't forget about solid

      plusplusUtilsTile.shapeFromTile(1, plusplusUtilsTile._collisionMapTileDef);
    } else {
      plusplusUtilsTile._collisionMap = collisionMap;
    }
  }

  static unload(): void {
    plusplusUtilsTile._collisionMap = null;
    plusplusUtilsTile._collisionMapTileDef = plusplusCollisionMap.defaultTileDef;
    plusplusUtilsTile.defaultTileVerticesDef = {};
    plusplusUtilsTile.defaultTileSegmentsDef = {};
  }

  static isTileWalkable(tileId: number): boolean {
    return plusplusConfig.COLLISION.TILES_HASH_WALKABLE[tileId];
  }

  static isTileWalkableStrict(tileId: number): boolean {
    return plusplusConfig.COLLISION.TILES_HASH_WALKABLE_STRICT[tileId];
  }

  static isTileOneWay(tileId: number): boolean {
    return plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[tileId];
  }

  static isTileClimbable(tileId: number): boolean {
    return plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[tileId];
  }

  static isTileClimbableStairs(tileId: number): boolean {
    return plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_STAIRS[tileId];
  }

  static isTileClimbableOneWay(tileId: number): boolean {
    return plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_ONE_WAY[tileId];
  }

  static shapesFromCollisionMap(map: plusplusCollisionMap, options?: Record<string, any>): ShapesList {
    const shapes = {
      oneWays: [] as Shape[],
      solids: [] as Shape[],
      climbables: [] as Shape[],
    };

    if (map instanceof plusplusCollisionMap) {
      if (options) {
        options = ig.copy(options);
      } else {
        options = {};
      }

      const newData: ShapedTile[][] = [[]];

      // extract each tile shape from map

      const tilesize = map.tilesize;
      const width = map.width;
      const height = map.height;
      const solids = [];
      const climbables = [];
      const oneWays = [];

      for (let iy = 0; iy < height; iy++) {
        for (let ix = 0; ix < width; ix++) {
          const shape = plusplusUtilsTile.shapeFromTile(map.data[iy][ix], map.tiledef);

          const tile = {
            id: map.data[iy][ix],
            ix: ix,
            iy: iy,
            x: ix * tilesize,
            y: iy * tilesize,
            width: tilesize,
            height: tilesize,
            shape: shape,
          };

          // not empty

          if (shape.vertices.length > 0) {
            // copy, absolutely position, and scale vertices

            const scaledVertices = [];
            const vertices = shape.vertices;
            const segments = shape.segments;

            for (let i = 0; i < segments.length; i++) {
              const segment = segments[i];

              const va = vertices[segment.a];
              scaledVertices[segment.a] = {
                x: tile.x + va.x * tilesize,
                y: tile.y + va.y * tilesize,
              };
            }

            shape.vertices = scaledVertices;

            // add to list by type

            if (plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[tile.id]) {
              if (!options.ignoreClimbables) {
                climbables.push(tile);
              }
            } else if (plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[tile.id]) {
              if (!options.ignoreOneWays) {
                oneWays.push(tile);
              }
            } else if (!options.ignoreSolids) {
              solids.push(tile);
            }
          }

          // store in copied data so other tiles can compare

          newData[iy][ix] = tile;
        }
      }

      // store original options
      // we'll need to reset it with each shape type

      const rectangles = options.rectangles;

      // solid tiles to shapes

      shapes.solids = shapes.solids.concat(plusplusUtilsTile.shapedTilesToShapes(solids, newData, options));

      // generally climabables and one ways should be grouped by tile

      if (typeof options.groupByTileId === "undefined") {
        options.groupByTileId = true;
      }

      // climbable tiles to shapes

      options.rectangles = typeof rectangles !== "undefined" ? rectangles : !options.contourClimbables;
      shapes.climbables = shapes.climbables.concat(plusplusUtilsTile.shapedTilesToShapes(climbables, newData, options));

      // adjust climbable shapes by id

      for (let i = 0; i < shapes.climbables.length; i++) {
        const shape = shapes.climbables[i];

        if (plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_ONE_WAY[shape.id]) {
          shape.settings.oneWay = true;
        } else {
          shape.settings.sensor = true;
        }

        if (plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_STAIRS[shape.id]) {
          shape.settings.climbableStairs = true;
        }
      }

      // one-way tiles to shapes

      options.rectangles = typeof rectangles !== "undefined" ? rectangles : !options.contourOneWays;
      shapes.oneWays = shapes.oneWays.concat(plusplusUtilsTile.shapedTilesToShapes(oneWays, newData, options));

      // adjust one-way shapes by id

      for (let i = 0; i < shapes.oneWays.length; i++) {
        const shape = shapes.oneWays[i];

        // one-way

        if (plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[shape.id]) {
          shape.settings.oneWay = true;

          // set one way facing (default up)

          if (shape.id === plusplusConfig.COLLISION.TILE_ONE_WAY_DOWN) {
            shape.settings.oneWayFacing = {
              x: 0,
              y: 1,
            };
          } else if (shape.id === plusplusConfig.COLLISION.TILE_ONE_WAY_RIGHT) {
            shape.settings.oneWayFacing = {
              x: 1,
              y: 0,
            };
          } else if (shape.id === plusplusConfig.COLLISION.TILE_ONE_WAY_LEFT) {
            shape.settings.oneWayFacing = {
              x: -1,
              y: 0,
            };
          }
        }
      }
    }

    return shapes;
  }

  static shapedTilesToShapes(tiles: ShapedTile[], data: ShapedTile[][], options?: Record<string, any>): Shape[] {
    options = options || {};

    let shapes: Shape[] = [];
    let vertices: Vector2[] = [];
    let contours: Contour[] = [];

    // create tile groups from tiles

    if (options.groupByTileId) {
      // lets avoid infinite recursion!

      delete options.groupByTileId;

      // group by id

      const ids = [];
      const groups: Record<string, any> = {};

      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        if (groups[tile.id]) {
          groups[tile.id].push(tile);
        } else {
          ids.push(tile.id);
          groups[tile.id] = [tile];
        }
      }

      // create shapes for each group

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const group = groups[id];
        options.id = id;

        shapes = shapes.concat(plusplusUtilsTile.shapedTilesToShapes(group, data, options));
      }
    } else {
      // rectangle shapes that may or may not be concave

      if (options.rectangles) {
        // step horizontal connected tiles
        // add line if matches last, else create new rectangle

        const tilePool = tiles.slice(0);
        const rectangles = [];
        let line, length, stepped, rectangle;

        while (tilePool.length > 0) {
          // get first horizontal line of tiles

          line = plusplusUtilsTile.findShapedTileLine(tilePool);
          plusplusUtils.arrayCautiousRemoveMulti(tilePool, line);

          length = line.length;
          rectangle = line;
          stepped = true;

          // find as many matching length rows as possible

          while (stepped) {
            stepped = false;

            const tileLast = line[0];
            const tileFrom = data[tileLast.iy][tileLast.ix + 1];

            if (tileFrom) {
              // get tile at start of next row and make sure it is part of tile pool

              const index = plusplusUtils.indexOfValue(tilePool, tileFrom);

              if (index !== -1) {
                line = plusplusUtilsTile.findShapedTileLine(tilePool, false, index, length);

                if (line.length === length) {
                  plusplusUtils.arrayCautiousRemoveMulti(tilePool, line);

                  rectangle = rectangle.concat(line);

                  stepped = true;
                }
              }
            }
          }

          if (rectangle.length > 0) {
            rectangles.push(rectangle);
          }
        }

        for (let j = 0; j < rectangles.length; j++) {
          rectangle = rectangles[j];

          // keep non-duplicate edge vertices

          vertices = [];

          for (let i = 0; i < rectangle.length; i++) {
            vertices = vertices.concat(plusplusUtilsTile.getNonDuplicateSegmentVertices(rectangle[i], data, rectangle));
          }

          // vertices to contours

          contours = contours.concat(plusplusUtilsTile.verticesToContours(vertices, options));
        }
      }
      // general shapes that may or may not be concave
      else {
        // keep non-duplicate edge vertices

        for (let i = 0; i < tiles.length; i++) {
          vertices = vertices.concat(plusplusUtilsTile.getNonDuplicateSegmentVertices(tiles[i], data, tiles));
        }

        // vertices to contours

        contours = plusplusUtilsTile.verticesToContours(vertices, options);
      }

      // contours to shapes

      for (let i = 0; i < contours.length; i++) {
        const contour = contours[i];

        shapes.push({
          id: options.id,
          x: contour.minX,
          y: contour.minY,
          vertices: [],
          segments: [],
          settings: {
            size: {
              x: contour.width,
              y: contour.height,
            },
            vertices: contour.vertices,
          },
        });
      }
    }

    return shapes;
  }

  static findShapedTileLine(
    tiles: ShapedTile[],
    horizontal?: boolean,
    indexFrom?: number,
    length?: number
  ): ShapedTile[] {
    indexFrom = indexFrom || 0;
    length = length || 0;

    let tileFrom = tiles[indexFrom];
    const line = [];
    let stepped = true;

    while (stepped) {
      stepped = false;

      // add tile to line

      line.push(tileFrom);

      if (line.length === length) {
        break;
      }

      // step to next in line

      const tileNext = horizontal
        ? plusplusUtilsTile.stepShapedTileHorizontally(tiles, tileFrom)
        : plusplusUtilsTile.stepShapedTileVertically(tiles, tileFrom);

      if (tileFrom !== tileNext) {
        stepped = true;
        tileFrom = tileNext;
      }
    }

    return line;
  }

  static stepShapedTileHorizontally(tiles: ShapedTile[], tileFrom: ShapedTile): ShapedTile {
    for (let i = 0; i < tiles.length; i++) {
      const tileNext = tiles[i];

      if (tileFrom.iy === tileNext.iy && tileFrom.ix + 1 === tileNext.ix) {
        return tileNext;
      }
    }

    return tileFrom;
  }

  static stepShapedTileVertically(tiles: ShapedTile[], tileFrom: ShapedTile): ShapedTile {
    for (let i = 0, il = tiles.length; i < il; i++) {
      const tileNext = tiles[i];

      if (tileFrom.ix === tileNext.ix && tileFrom.iy + 1 === tileNext.iy) {
        return tileNext;
      }
    }

    return tileFrom;
  }

  static verticesToContours(vertices: Vector2[], options: Record<string, any>): Contour[] {
    const contours = [];

    if (vertices.length > 1) {
      options = options || {};

      // find each contour within vertices

      const vertexPool = vertices.slice(0);
      let contour: Contour = {
        vertices: [] as Vector2[],
        minX: Number.MAX_VALUE,
        minY: Number.MAX_VALUE,
        maxX: -Number.MAX_VALUE,
        maxY: -Number.MAX_VALUE,
        width: 0,
        height: 0,
      };
      let contourVertices = contour.vertices;
      let vb = vertexPool.pop();
      let va = vertexPool.pop();
      let pva;
      let pvb;

      // length > -2 because we need 1 extra loop for final segment/contour

      while (vertexPool.length > -2) {
        let stepped = false;
        let i;
        // if we haven't looped around, try to step to next

        const sva = contourVertices[0];

        if (contourVertices.length <= 2 || vb.x !== sva.x || vb.y !== sva.y) {
          for (i = 0; i < vertexPool.length; i += 2) {
            pva = vertexPool[i];
            pvb = vertexPool[i + 1];

            if (vb.x === pva.x && vb.y === pva.y) {
              stepped = true;
              break;
            }
          }
        }

        // only add the second vector of each pair

        contourVertices.push(vb);

        // update contour min/max

        if (vb.x < contour.minX) contour.minX = vb.x;
        if (vb.x > contour.maxX) contour.maxX = vb.x;
        if (vb.y < contour.minY) contour.minY = vb.y;
        if (vb.y > contour.maxY) contour.maxY = vb.y;

        if (stepped === true) {
          vertexPool.splice(i, 2);
          va = pva;
          vb = pvb;
        } else {
          if (contour.vertices.length >= 3) {
            contours.push(contour);
          }

          if (vertexPool.length > 0) {
            contour = {
              vertices: [] as Vector2[],
              minX: Number.MAX_VALUE,
              minY: Number.MAX_VALUE,
              maxX: -Number.MAX_VALUE,
              maxY: -Number.MAX_VALUE,
              width: 0,
              height: 0,
            };

            contourVertices = contour.vertices;

            vb = vertexPool.pop();
            va = vertexPool.pop();
          } else {
            break;
          }
        }
      }

      // set contour size

      for (let i = 0; i < contours.length; i++) {
        contour = contours[i];
        contour.width = contour.maxX - contour.minX;
        contour.height = contour.maxY - contour.minY;
      }

      // sort contours by largest up

      contours.sort(function (a, b) {
        return b.width * b.width + b.height * b.height - (a.width * a.width + a.height * a.height);
      });

      // test each contour to find containing contours
      // if shape's AABB is fully contained by another shape, make chain ordered from smallest to largest

      const contourPool = contours.slice(0);
      const containerChains = [];
      let containerChain = [];
      let containingContour, contained;

      contour = contourPool.pop();

      while (contourPool.length > -1) {
        contained = false;

        if (contour) {
          // search contours instead of contour pool so we can find all containers

          for (let i = contours.length - 1; i > -1; i--) {
            containingContour = contours[i];

            if (
              contour !== containingContour &&
              plusplusUtilsIntersection.AABBContains(
                contour.minX,
                contour.minY,
                contour.maxX,
                contour.maxY,
                containingContour.minX,
                containingContour.minY,
                containingContour.maxX,
                containingContour.maxY
              )
            ) {
              contained = true;
              break;
            }
          }

          containerChain.push(contour);
        }

        if (contained) {
          plusplusUtils.arrayCautiousRemove(contourPool, containingContour);
          contour = containingContour;
        } else {
          if (containerChain.length > 1) {
            containerChains.push(containerChain);
          }

          if (contourPool.length > 0) {
            containerChain = [];

            contour = contourPool.pop();
          } else {
            break;
          }
        }
      }

      // check each container chain

      const contoursReversed: Contour[] = [];
      let contoursRemoved: Contour[] = [];

      for (let i = 0; i < containerChains.length; i++) {
        containerChain = containerChains[i];
        const outerBoundary = containerChain[containerChain.length - 1];
        const innerBoundary = containerChain[containerChain.length - 2];

        // reverse vertices of every other contour to avoid creating ccw contours
        // this happens because converting tiles to vertices cannot control the direction of the segments

        // even length chain, start with first
        let j;
        if (containerChain.length % 2 === 0) {
          j = 0;
        }
        // odd length chain, start with second
        else {
          j = 1;
        }

        for (; j < containerChain.length; j += 2) {
          contour = containerChain[j];

          if (plusplusUtils.indexOfValue(contoursReversed, contour) === -1) {
            contour.vertices.reverse();
            contoursReversed.push(contour);
          }
        }

        // discard outer boundary contour
        // generally, we know that the tiles have edges on both sides
        // so there should always be a container at the end of the chain that wraps the outside
        // we don't need these edges/vertices as it is unlikely the player will ever walk outside the map

        if (!options.retainBoundaryOuter && plusplusUtils.indexOfValue(contoursRemoved, outerBoundary) === -1) {
          contoursRemoved.push(outerBoundary);
          plusplusUtils.arrayCautiousRemove(contours, outerBoundary);
        }

        // discard inner boundary contour

        if (options.discardBoundaryInner && plusplusUtils.indexOfValue(contoursRemoved, innerBoundary) === -1) {
          contoursRemoved.push(innerBoundary);
          plusplusUtils.arrayCautiousRemove(contours, innerBoundary);
        }

        // discard anything beyond inner boundary contour

        if (options.discardEdgesInner && containerChain.length > 2) {
          const otherContours = containerChain.slice(0, containerChain.length - 2);
          contoursRemoved = contoursRemoved.concat(otherContours);
          plusplusUtils.arrayCautiousRemoveMulti(contours, otherContours);
        }
      }

      // finalize contours

      for (let i = 0; i < contours.length; i++) {
        contour = contours[i];
        contourVertices = contour.vertices;

        // optimization (default): find and remove all intermediary collinear vertices

        if (!options.discardCollinear) {
          let sva = contourVertices[0];
          let j = contourVertices.length - 1;
          for (; j > 0; j--) {
            va = contourVertices[j];
            vb = contourVertices[j - 1];

            if (plusplusUtilsVector2.pointsCW(sva, va, vb) === 0) {
              contourVertices.splice(j, 1);
            } else {
              sva = va;
            }

            va = vb;
          }

          // do one extra collinear check with first vertex as target for removal

          if (
            plusplusUtilsVector2.pointsCW(
              contourVertices[j + 1],
              contourVertices[j],
              contourVertices[contourVertices.length - 1]
            ) === 0
          ) {
            contourVertices.splice(0, 1);
          }
        }

        // if vertices should be in reverse order

        if (options.reverse) {
          contourVertices.reverse();
        }

        // make vertices relative

        const minX = contour.minX;
        const minY = contour.minY;
        const width = contour.width;
        const height = contour.height;

        for (let j = 0; j < contourVertices.length; j++) {
          va = contourVertices[j];
          va.x -= minX + width * 0.5;
          va.y -= minY + height * 0.5;
        }
      }
    }

    return contours;
  }

  static shapeFromTile(tileId: number, tileDefs: TileDef): Shape {
    const vertices = plusplusUtilsTile.verticesFromTile(tileId, tileDefs);
    let segments;

    if (vertices) {
      // get or compute segments from tile

      if (plusplusUtilsTile.defaultTileSegmentsDef[tileId]) {
        segments = plusplusUtilsTile.defaultTileSegmentsDef[tileId];
      } else {
        plusplusUtilsTile.defaultTileSegmentsDef[tileId] = segments = [];

        for (let i = 0; i < vertices.length; i++) {
          const va = vertices[i];
          const indexB = i === vertices.length - 1 ? 0 : i + 1;
          const vb = vertices[indexB];

          // store segment with pre-computed normal for later use
          // normal should be facing out and normalized between 0 and 1

          const dx = vb.x - va.x;
          const dy = vb.y - va.y;
          const l = Math.sqrt(dx * dx + dy * dy);
          let nx;
          let ny;

          if (l > 0) {
            nx = dy / l;
            ny = -dx / l;
          } else {
            nx = ny = 0;
          }

          segments.push({
            a: i,
            b: indexB,
            normal: {
              x: nx,
              y: ny,
            },
          });
        }
      }
    }

    return {
      vertices: vertices,
      segments: segments || [],
    };
  }

  static verticesFromTile(tileId: number, tileDefs?: TileDef): Vector2[] {
    if (!tileDefs) {
      tileDefs = plusplusUtilsTile._collisionMapTileDef;
    }

    let vertices: Vector2[];

    // get or compute shape from tile

    if (plusplusUtilsTile.defaultTileVerticesDef[tileId]) {
      vertices = plusplusUtilsTile.defaultTileVerticesDef[tileId];
    } else {
      // solid square (1) or climbable

      if (tileId === 1 || plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[tileId]) {
        vertices = [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
          {
            x: 0,
            y: 1,
          },
        ];
      }
      // solid sloped
      else {
        vertices = [];

        // find vertices

        const def = tileDefs[tileId];

        if (def) {
          const va = (vertices[0] = {
            x: def[0],
            y: def[1],
          });
          const vb = (vertices[1] = {
            x: def[2],
            y: def[3],
          });
          const ax = va.x;
          const ay = va.y;
          const bx = vb.x;
          const by = vb.y;
          const fx = bx - ax;
          const fy = by - ay;

          // we have two points and the slope's facing direction
          // find remaining points

          // corner

          const vc = (vertices[2] = {
            x: fy < 0 ? 1 : 0,
            y: fx > 0 ? 1 : 0,
          });
          const cx = vc.x;
          const cy = vc.y;

          let dax, day, dbx, dby;

          // check if 5 sided

          let fiveSided = false;

          if (Math.abs(fx) < 1 && Math.abs(fy) < 1) {
            const quadrantA = plusplusUtilsVector2.pointQuadrant(ax, ay, 0.5, 0.5);
            const quadrantB = plusplusUtilsVector2.pointQuadrant(bx, by, 0.5, 0.5);
            const quadrantC = plusplusUtilsVector2.pointQuadrant(cx, cy, 0.5, 0.5);

            if (!(quadrantA & quadrantC) && !(quadrantB & quadrantC)) {
              fiveSided = true;
            }
          }

          if (fiveSided === true) {
            // generate vertices in both directions from corner

            if (cx !== cy) {
              dax = cx;
              dby = cy;

              if (cx == 1) {
                day = 1;
                dbx = 0;
              } else {
                day = 0;
                dbx = 1;
              }
            } else {
              day = cy;
              dbx = cx;

              if (cx == 1) {
                dax = 0;
                dby = 0;
              } else {
                dax = 1;
                dby = 1;
              }
            }

            vertices[3] = {
              x: dax,
              y: day,
            };
            vertices[4] = {
              x: dbx,
              y: dby,
            };
          } else {
            // check from corner to connected points
            // generate d vertices in both directions for testing against a and b

            if (cx !== cy) {
              dax = cx;
              dby = cy;

              if (cx == 1) {
                day = Math.max(ay, by);
                dbx = Math.min(ax, bx);
              } else {
                day = Math.min(ay, by);
                dbx = Math.max(ax, bx);
              }
            } else {
              day = cy;
              dbx = cx;

              if (cx == 1) {
                dax = Math.min(ax, bx);
                dby = Math.min(ay, by);
              } else {
                dax = Math.max(ax, bx);
                dby = Math.max(ay, by);
              }
            }

            // da is duplicate of a

            if ((dax === ax && day === ay) || (dax === bx && day === by)) {
              // db is not duplicate of b

              if (!((dbx === ax && dby === ay) || (dbx === bx && dby === by))) {
                vertices[3] = {
                  x: dbx,
                  y: dby,
                };
              }
            } else {
              vertices[3] = {
                x: dax,
                y: day,
              };
            }
          }

          vertices = plusplusUtilsVector2.pointsToConvexHull(vertices);
        }
      }

      // store so we don't compute again

      plusplusUtilsTile.defaultTileVerticesDef[tileId] = vertices;
    }

    return vertices;
  }

  static getNonDuplicateSegmentVertices(
    tile: ShapedTile,
    tileData: ShapedTile[][],
    tilesAllowed: ShapedTile[]
  ): Vector2[] {
    const shape = tile.shape;
    const vertices = shape.vertices;
    const segments = shape.segments;
    const nonDuplicates = [];

    // add segment vertices in clockwise order while checking for duplicates

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const va = vertices[segment.a];
      const vb = vertices[segment.b];
      const normal = segment.normal;
      let overlap: Overlap = {
        type: "NONE",
      };

      // if normal is axis aligned to x/y
      // compare segment to touching tiles from normal direction

      if ((normal.x === 0 && normal.y !== 0) || (normal.x !== 0 && normal.y === 0)) {
        const touchingTiles = plusplusUtilsTile.getTouchingTilesByDirection(tile, normal, tileData, tilesAllowed);

        // check each touching for overlap

        for (let j = 0; j < touchingTiles.length; j++) {
          const touchingTile = touchingTiles[j];

          if (touchingTile.shape.vertices.length > 0) {
            overlap = plusplusUtilsTile.getSegmentOverlapWithTile(va, vb, normal, touchingTile);

            if (overlap) break;
          }
        }
      }

      // no overlap at all

      if (overlap.type === "NONE") {
        nonDuplicates.push(va, vb);
      }
      // partial overlap found, use returned non-overlapping segment
      else if (overlap.type === "PARTIAL") {
        nonDuplicates.push(overlap.overlap.segmentA.va, overlap.overlap.segmentA.vb);
      }
    }

    return nonDuplicates;
  }

  static getTouchingTilesByDirection(
    tile: ShapedTile,
    direction: Vector2,
    tileData: ShapedTile[][],
    tilesAllowed: ShapedTile[]
  ): ShapedTile[] {
    const ix = tile.ix;
    const iy = tile.iy;
    const nx = direction.x;
    const ny = direction.y;
    const touchingTiles = [];
    let touchingTile;
    let row;

    if (nx !== 0) {
      row = tileData[iy];

      if (nx > 0) {
        if (ix < row.length - 1) {
          touchingTile = row[ix + 1];

          if (!tilesAllowed || plusplusUtils.indexOfValue(tilesAllowed, touchingTile) !== -1) {
            touchingTiles.push(touchingTile);
          }
        }
      } else {
        if (ix > 0) {
          touchingTile = row[ix - 1];

          if (!tilesAllowed || plusplusUtils.indexOfValue(tilesAllowed, touchingTile) !== -1) {
            touchingTiles.push(touchingTile);
          }
        }
      }
    }

    if (ny !== 0) {
      if (ny > 0) {
        if (iy < tileData.length - 1) {
          touchingTile = tileData[iy + 1][ix];

          if (!tilesAllowed || plusplusUtils.indexOfValue(tilesAllowed, touchingTile) !== -1) {
            touchingTiles.push(touchingTile);
          }
        }
      } else {
        if (iy > 0) {
          touchingTile = tileData[iy - 1][ix];

          if (!tilesAllowed || plusplusUtils.indexOfValue(tilesAllowed, touchingTile) !== -1) {
            touchingTiles.push(touchingTile);
          }
        }
      }
    }

    return touchingTiles;
  }

  static getSegmentOverlapWithTile(vaA: Vector2, vbA: Vector2, normalCompare: Vector2, tile: ShapedTile): Overlap {
    const overlap: Overlap = { type: "NONE" };
    const shape = tile.shape;
    const vertices = shape.vertices;
    const segments = shape.segments;
    let segmentPotential, segment;

    // find overlapping segment, assuming no more than 1 overlap can occur in a tile

    for (let i = 0; i < segments.length; i++) {
      segmentPotential = segments[i];
      const normal = segmentPotential.normal;

      // for any overlap to occur, normals must be pointing in opposite directions

      if (normalCompare.x === -normal.x && normalCompare.y === -normal.y) {
        segment = segmentPotential;
        break;
      }
    }

    if (segment) {
      const vaB = vertices[segment.a];
      const vbB = vertices[segment.b];
      const xaA = vaA.x;
      const yaA = vaA.y;
      const xbA = vbA.x;
      const ybA = vbA.y;
      const xaB = vaB.x;
      const yaB = vaB.y;
      const xbB = vbB.x;
      const ybB = vbB.y;
      const xlA = xbA - xaA;
      const ylA = ybA - yaA;
      const lenA = Math.sqrt(xlA * xlA + ylA * ylA);
      const xnA = xlA / lenA;
      const ynA = ylA / lenA;
      const xlB = xaB - xbB;
      const ylB = yaB - ybB;
      const lenB = Math.sqrt(xlB * xlB + ylB * ylB);
      const xnB = xlB / lenB;
      const ynB = ylB / lenB;
      const cross = xnA * ynB - ynA * xnB;

      // if cross product = 0, lines are parallel
      // no need to check for collinearity

      if (cross === 0) {
        let saebMin, saebMax, easbMin, easbMax;
        let minCompare, maxCompare, property, normal;

        // horizontal lines

        if (xnA !== 0) {
          saebMin = Math.min(xaA, xbB);
          saebMax = Math.max(xaA, xbB);
          easbMin = Math.min(xbA, xaB);
          easbMax = Math.max(xbA, xaB);
          normal = xnA;
          minCompare = xaA;
          maxCompare = xbA;
          property = "x";
        }
        // vertical lines
        else {
          saebMin = Math.min(yaA, ybB);
          saebMax = Math.max(yaA, ybB);
          easbMin = Math.min(ybA, yaB);
          easbMax = Math.max(ybA, yaB);
          normal = ynA;
          minCompare = yaA;
          maxCompare = ybA;
          property = "y";
        }

        // fully overlapping

        if (saebMin === saebMax && easbMin === easbMax) {
          overlap.type = "FULL";
          delete overlap.overlap;
        }
        // partial or no overlap
        else {
          const overlappingBy = normal < 0 ? saebMin - easbMax : easbMin - saebMax;

          // find edges outside partial overlap

          if (overlappingBy > 0) {
            // duplicate will be new edges instead of boolean

            overlap.overlap = {
              segmentA: {
                va: {
                  x: vaA.x,
                  y: vaA.y,
                },
                vb: {
                  x: vbA.x,
                  y: vbA.y,
                },
              },
              segmentB: {
                va: {
                  x: vaB.x,
                  y: vaB.y,
                },
                vb: {
                  x: vbB.x,
                  y: vbB.y,
                },
              },
            };
            const SEGMENT_A = 1;
            const SEGMENT_B = 2;

            let min, max;
            let wipeout = true;

            if (normal < 0) {
              min = saebMin === saebMax ? 0 : saebMin === minCompare ? SEGMENT_B : SEGMENT_A;
              max = easbMin === easbMax ? 0 : easbMax === maxCompare ? SEGMENT_B : SEGMENT_A;

              if (min === SEGMENT_A) {
                overlap.overlap.segmentA.vb[property as keyof Vector2] += overlappingBy;
                wipeout = false;
              } else if (min === SEGMENT_B) {
                overlap.overlap.segmentB.va[property as keyof Vector2] += overlappingBy;
              }
              if (max === SEGMENT_A) {
                overlap.overlap.segmentA.va[property as keyof Vector2] -= overlappingBy;
                wipeout = false;
              } else if (max === SEGMENT_B) {
                overlap.overlap.segmentB.vb[property as keyof Vector2] -= overlappingBy;
              }

              // other edge may be bigger and fully overlapping this one

              if (wipeout === true) {
                overlap.type = "FULL";
                delete overlap.overlap;
              }
            } else {
              min = saebMin === saebMax ? 0 : saebMin === minCompare ? SEGMENT_A : SEGMENT_B;
              max = easbMin === easbMax ? 0 : easbMax === maxCompare ? SEGMENT_A : SEGMENT_B;

              if (min === SEGMENT_A) {
                overlap.overlap.segmentA.vb[property as keyof Vector2] -= overlappingBy;
                wipeout = false;
              } else if (min === SEGMENT_B) {
                overlap.overlap.segmentB.va[property as keyof Vector2] -= overlappingBy;
              }
              if (max === SEGMENT_A) {
                overlap.overlap.segmentA.va[property as keyof Vector2] += overlappingBy;
                wipeout = false;
              } else if (max === SEGMENT_B) {
                overlap.overlap.segmentB.vb[property as keyof Vector2] += overlappingBy;
              }

              // other edge may be bigger and fully overlapping this one

              if (wipeout === true) {
                overlap.type = "FULL";
                delete overlap.overlap;
              }
            }
          }
        }
      }
    }

    return overlap;
  }
}
