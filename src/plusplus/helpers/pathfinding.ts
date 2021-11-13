import { ig } from "../../impact/impact";
import { Vector2 } from "./utilsvector2";
import { Bounds, plusplusUtilsIntersection } from "./utilsintersection";
import { plusplusCollisionMap } from "../core/collision-map";
import { PathfindingTileDef, plusplusPathfindingMap } from "../core/pathfinding-map";
import { plusplusConfig } from "../core/config";
import { plusplusUtilsTile } from "./utilstile";
import { plusplusUtilsMath } from "./utilsmath";
import { plusplusEntityExtended } from "../core/entity";

export class plusplusPathfinding {
  static _collisionMap: plusplusCollisionMap = null;
  static _collisionMapData: number[][] = null;
  static _pathfindingMap: plusplusPathfindingMap = null;
  static _pathfindingMapData: number[][] = null;
  static _tilesize = 1;
  static _tilesizeReciprocal = 1;
  static _positions = {
    from: {
      x: 0.1,
      y: 0.1,
    },
    target: {
      x: 0.1,
      y: 0.1,
    },
  };

  static _grid: plusplusPathNode[][] = [];
  static _open: plusplusPathNode[] = [];
  static _closed: plusplusPathNode[] = [];

  static _cleanup(): void {
    plusplusPathfinding._open.forEach((item) => {
      item.cleanup();
    });

    plusplusPathfinding._closed.forEach((item) => {
      item.cleanup();
    });
    plusplusPathfinding._open = [];
    plusplusPathfinding._closed = [];
  }

  static HEURISTIC = {
    MANHATTAN: function (dx: number, dy: number): number {
      return dx + dy;
    },
    EUCLIDEAN: function (dx: number, dy: number): number {
      return Math.sqrt(dx * dx + dy * dy);
    },
    CHEBYSHEV: function (dx: number, dy: number): number {
      return Math.max(dx, dy);
    },
  };

  static rebuild(collisionMap: plusplusCollisionMap, pathfindingMap: plusplusPathfindingMap): void {
    plusplusPathfinding.unload();

    plusplusPathfinding._collisionMap = collisionMap;
    plusplusPathfinding._pathfindingMap = pathfindingMap;

    // tilesize mismatch makes us all sad

    if (
      plusplusPathfinding._collisionMap &&
      plusplusPathfinding._pathfindingMap &&
      plusplusPathfinding._pathfindingMap.tilesize !== plusplusPathfinding._collisionMap.tilesize
    ) {
      throw new Error("Maps tilesize mismatch: pathfinding map and collision map must have the same tilesize!");
    }

    if (plusplusPathfinding._collisionMap) {
      plusplusPathfinding._collisionMapData = plusplusPathfinding._collisionMap.data;
      plusplusPathfinding._tilesize = plusplusPathfinding._collisionMap.tilesize;
      plusplusPathfinding._tilesizeReciprocal = 1 / plusplusPathfinding._collisionMap.tilesize;
    }

    if (plusplusPathfinding._pathfindingMap) {
      plusplusPathfinding._pathfindingMapData = plusplusPathfinding._pathfindingMap.data;
      plusplusPathfinding._tilesize = plusplusPathfinding._pathfindingMap.tilesize;
      plusplusPathfinding._tilesizeReciprocal = 1 / plusplusPathfinding._pathfindingMap.tilesize;
    }

    plusplusPathfinding.rebuildGrid();
  }

  static unload(): void {
    plusplusPathfinding._grid.length = 0;
    plusplusPathfinding._collisionMap =
      plusplusPathfinding._collisionMapData =
      plusplusPathfinding._pathfindingMap =
      plusplusPathfinding._pathfindingMapData =
        null;
    plusplusPathfinding._tilesize = 0;
  }

  static rebuildGrid(): void {
    let row;
    let tile;
    let gridRow;
    let node;
    let y, yl;
    let x, xl;
    let worldX, worldY;

    // create basic nodes from collision map

    if (plusplusPathfinding._collisionMap && plusplusPathfinding._collisionMapData) {
      for (y = 0, yl = plusplusPathfinding._collisionMapData.length; y < yl; y++) {
        row = plusplusPathfinding._collisionMapData[y];
        gridRow = plusplusPathfinding._grid[y];

        if (!gridRow) {
          gridRow = plusplusPathfinding._grid[y] = [];
        }

        for (x = 0, xl = row.length; x < xl; x++) {
          tile = row[x];

          // precalculate world position of node
          // and set to center of tile

          worldX = x * plusplusPathfinding._tilesize + plusplusPathfinding._tilesize * 0.5;
          worldY = y * plusplusPathfinding._tilesize + plusplusPathfinding._tilesize * 0.5;

          gridRow[x] = new plusplusPathNode(
            worldX,
            worldY,
            x,
            y,
            !!plusplusConfig.COLLISION.TILES_HASH_WALKABLE[tile],
            tile
          );
        }
      }
    }

    // add settings based on pathfinding map

    if (plusplusPathfinding._pathfindingMap && plusplusPathfinding._pathfindingMapData) {
      for (y = 0, yl = plusplusPathfinding._pathfindingMapData.length; y < yl; y++) {
        row = plusplusPathfinding._pathfindingMapData[y];
        gridRow = plusplusPathfinding._grid[y];

        if (!gridRow) {
          gridRow = plusplusPathfinding._grid[y] = [];
        }

        for (
          x = 0,
            xl =
              !plusplusPathfinding._collisionMap ||
              !plusplusPathfinding._collisionMapData[0] ||
              row.length >= plusplusPathfinding._collisionMapData[0].length
                ? row.length
                : plusplusPathfinding._collisionMapData[0].length;
          x < xl;
          x++
        ) {
          tile = row[x] || 0;
          const settings = plusplusPathfinding._pathfindingMap.tiledef[tile as keyof PathfindingTileDef];

          node = gridRow[x];

          // when pathfinding map is bigger than collision map
          // create a new node and set walkable from settings

          if (!node) {
            // precalculate world position of node
            // and set to center of tile

            worldX = x * plusplusPathfinding._tilesize + plusplusPathfinding._tilesize * 0.5;
            worldY = y * plusplusPathfinding._tilesize + plusplusPathfinding._tilesize * 0.5;

            node = gridRow[x] = new plusplusPathNode(
              worldX,
              worldY,
              x,
              y,
              settings && typeof settings.walkable !== "undefined" ? settings.walkable : true,
              tile
            );
          }

          // merge settings into node

          ig.merge(node, settings);
        }
      }
    }

    // process each node

    for (y = 0, yl = plusplusPathfinding._grid.length; y < yl; y++) {
      row = plusplusPathfinding._grid[y];

      for (x = 0, xl = row.length; x < xl; x++) {
        node = row[x];

        // set size

        node.size = plusplusPathfinding._tilesize;

        // neighbors by direction

        const nm = node.neighborMap;
        const prevRow = plusplusPathfinding._grid[y - 1];
        const nextRow = plusplusPathfinding._grid[y + 1];

        if (prevRow) {
          nm.top = prevRow[x];

          if (x > 0) {
            nm.topleft = prevRow[x - 1];
          }

          if (x < xl - 1) {
            nm.topright = prevRow[x + 1];
          }
        }

        if (x > 0) {
          nm.left = row[x - 1];
        }

        if (x < xl - 1) {
          nm.right = row[x + 1];
        }

        if (nextRow) {
          nm.bottom = nextRow[x];

          if (x > 0) {
            nm.bottomleft = nextRow[x - 1];
          }

          if (x < xl - 1) {
            nm.bottomright = nextRow[x + 1];
          }
        }

        // is node in the air?

        node.ungrounded = !nm.bottom || (nm.bottom.walkable && nm.bottom.oneWayFacing.y >= 0);

        // is node a corner?

        if (
          nm.top &&
          nm.top.walkable &&
          (nm.top.climbable || nm.top.oneWayFacing.y <= 0) &&
          nm.left &&
          nm.left.walkable &&
          (nm.left.climbable || nm.left.oneWayFacing.x <= 0) &&
          (!nm.topleft || (!nm.topleft.walkable && !nm.topleft.sloped))
        ) {
          node.corner = node.cornerMap.topleft = true;
        }

        if (
          nm.top &&
          nm.top.walkable &&
          (nm.top.climbable || nm.top.oneWayFacing.y <= 0) &&
          nm.right &&
          nm.right.walkable &&
          (nm.right.climbable || nm.right.oneWayFacing.x >= 0) &&
          (!nm.topright || (!nm.topright.walkable && !nm.topright.sloped))
        ) {
          node.corner = node.cornerMap.topright = true;
        }

        if (
          nm.bottom &&
          nm.bottom.walkable &&
          (nm.bottom.climbable || nm.bottom.oneWayFacing.y >= 0) &&
          nm.left &&
          nm.left.walkable &&
          (nm.left.climbable || nm.left.oneWayFacing.x <= 0) &&
          (!nm.bottomleft || (!nm.bottomleft.walkable && !nm.bottomleft.sloped))
        ) {
          node.corner = node.cornerMap.bottomleft = true;
        }

        if (
          nm.bottom &&
          nm.bottom.walkable &&
          (nm.bottom.climbable || nm.bottom.oneWayFacing.y >= 0) &&
          nm.right &&
          nm.right.walkable &&
          (nm.right.climbable || nm.right.oneWayFacing.x >= 0) &&
          (!nm.bottomright || (!nm.bottomright.walkable && !nm.bottomright.sloped))
        ) {
          node.corner = node.cornerMap.bottomright = true;
        }

        // is node next to sloped?

        if (nm.top && nm.top.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.top = true;
        }

        if (nm.bottom && nm.bottom.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.bottom = true;
        }

        if (nm.right && nm.right.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.right = true;
        }

        if (nm.left && nm.left.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.left = true;
        }

        if (nm.topleft && nm.topleft.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.topleft = true;
        }

        if (nm.topright && nm.topright.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.topright = true;
        }

        if (nm.bottomleft && nm.bottomleft.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.bottomleft = true;
        }

        if (nm.bottomright && nm.bottomright.sloped) {
          node.slopedNeighbor = node.slopedNeighborMap.bottomright = true;
        }

        node.slopesAlongMap.top = false;
        node.slopesAlongMap.bottom = node.walkable && !node.oneWay && nm.bottom && nm.bottom.sloped;

        if (plusplusPathfinding.getIsAlongSlope(node, -1, 0)) {
          node.slopesAlongMap.left = node.slopedAlong = true;
        }

        if (plusplusPathfinding.getIsAlongSlope(node, 1, 0)) {
          node.slopesAlongMap.right = node.slopedAlong = true;
        }

        if (plusplusPathfinding.getIsAlongSlope(node, -1, -1)) {
          node.slopesAlongMap.topleft = node.slopedAlong = true;
        }

        if (plusplusPathfinding.getIsAlongSlope(node, 1, -1)) {
          node.slopesAlongMap.topright = node.slopedAlong = true;
        }

        if (plusplusPathfinding.getIsAlongSlope(node, -1, 1)) {
          node.slopesAlongMap.bottomleft = node.slopedAlong = true;
        }

        if (plusplusPathfinding.getIsAlongSlope(node, 1, 1)) {
          node.slopesAlongMap.bottomright = node.slopedAlong = true;
        }

        // walkable neighbors

        node.directNeighbors = plusplusPathfinding.getDirectNeighbors(node);
        node.neighbors = [].concat(node.directNeighbors, plusplusPathfinding.getDiagonalNeighbors(node));
      }
    }
  }

  static getPathToEntity(
    entityPathing: plusplusEntityExtended,
    entityTarget: plusplusEntityExtended,
    avoidEntities?: boolean,
    searchDistance?: number,
    heuristicType?: "MANHATTAN" | "EUCLIDEAN" | "CHEBYSHEV"
  ): Vector2[] {
    const positions = plusplusPathfinding.getPositionPathfindingEntities(
      entityPathing,
      entityTarget,
      plusplusPathfinding._positions
    );

    return plusplusPathfinding.getPathTo(
      positions.from.x,
      positions.from.y,
      positions.target.x,
      positions.target.y,
      avoidEntities,
      searchDistance,
      entityPathing,
      entityTarget,
      heuristicType
    );
  }

  static getPathToPoint(
    entityPathing: plusplusEntityExtended,
    targetX: number,
    targetY: number,
    avoidEntities?: boolean,
    searchDistance?: number,
    entityTarget?: plusplusEntityExtended,
    heuristicType?: "MANHATTAN" | "EUCLIDEAN" | "CHEBYSHEV"
  ): Vector2[] {
    const from = plusplusPathfinding.getPositionPathfindingPoint(
      entityPathing,
      targetX,
      targetY,
      plusplusPathfinding._positions.from
    );

    return plusplusPathfinding.getPathTo(
      from.x,
      from.y,
      targetX,
      targetY,
      avoidEntities,
      searchDistance,
      entityPathing,
      entityTarget,
      heuristicType
    );
  }

  static getPathTo(
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    avoidEntities?: boolean,
    searchDistance?: number,
    entityPathing?: plusplusEntityExtended,
    entityTarget?: plusplusEntityExtended,
    heuristicType?: "MANHATTAN" | "EUCLIDEAN" | "CHEBYSHEV"
  ): Vector2[] {
    // init path

    let path;

    if (entityPathing && entityPathing.path) {
      path = entityPathing.path;
      path.length = 0;
    } else {
      path = [];
    }

    // check for empty grid

    const grid = plusplusPathfinding._grid;

    if (grid.length === 0) {
      return path;
    }

    // get the map information

    const gridFromX = Math.floor(fromX * plusplusPathfinding._tilesizeReciprocal);
    const gridFromY = Math.floor(fromY * plusplusPathfinding._tilesizeReciprocal);
    const gridDestinationX = Math.floor(targetX * plusplusPathfinding._tilesizeReciprocal);
    const gridDestinationY = Math.floor(targetY * plusplusPathfinding._tilesizeReciprocal);
    const startNode = grid[gridFromY] && grid[gridFromY][gridFromX];
    const destinationNode = grid[gridDestinationY] && grid[gridDestinationY][gridDestinationX];

    // start or destination nodes must be within map and start cannot be the destination

    if (!startNode || !destinationNode || startNode === destinationNode) {
      return path;
    }

    const open = plusplusPathfinding._open;
    const closed = plusplusPathfinding._closed;
    const heuristic = plusplusPathfinding.HEURISTIC[heuristicType || "MANHATTAN"];
    const abs = Math.abs;
    const SQRT2 = Math.SQRT2;
    let neighbors;
    let neighbor;
    let openNode;
    let i, il;
    let j, jl;

    // when pathing entity present

    const tilesize = plusplusPathfinding._tilesize;
    const entityPathingSize = tilesize;
    let needsAvoidEntityCheck;
    let diagonalDouble;
    let nodeHasCollidingEntities;
    let neighborMap;
    let diagonalUnsafe;
    let topleft;
    let topright;
    let bottomleft;
    let bottomright;
    let diagonalStartIndex;

    if (entityPathing) {
      entityPathingSize = Math.max(entityPathing.size.x, entityPathing.size.y);
      diagonalDouble =
        plusplusConfig.PATHFINDING.ALLOW_DIAGONAL && plusplusConfig.PATHFINDING.DIAGONAL_REQUIRES_BOTH_DIRECT;

      // avoiding other entities

      if (avoidEntities) {
        needsAvoidEntityCheck = true;
        nodeHasCollidingEntities = plusplusPathfinding.nodeHasCollidingEntities;
      }
    }

    // when target entity present

    let needsDistCheck;

    if (entityTarget && searchDistance > 0) {
      needsDistCheck = true;
      searchDistance *= plusplusPathfinding._tilesizeReciprocal;
      searchDistance *= searchDistance;
    } else {
      needsDistCheck = false;
    }

    // add start as first open node

    open.push(startNode);

    // until the destination is found work off the open nodes

    while (open.length > 0) {
      // get best open node

      let currentNode = open.pop();
      const gridCurrentX = currentNode.gridX;
      const gridCurrentY = currentNode.gridY;

      // add the current node to the closed list

      closed.push(currentNode);
      currentNode.closed = true;

      // we're at the destination
      // go up the path chain to recreate the path

      if (currentNode === destinationNode) {
        while (currentNode) {
          path.push(currentNode);
          currentNode = currentNode.prevNode;
        }

        plusplusPathfinding._cleanup();

        return path;
      }

      // get neighbors of the current node

      neighbors = currentNode.neighbors;
      il = neighbors.length;

      // setup for diagonal

      if (diagonalDouble) {
        // when pathing entity size is bigger than tilesize
        // to avoid getting entity caught on corners
        // it should probably only be allowed to walk on straight tiles
        // unless node is surrounded by walkable neighbors

        if (entityPathingSize > tilesize && il < 8 && !currentNode.slopedNeighbor) {
          neighbors = currentNode.directNeighbors;
          il = neighbors.length;
          diagonalStartIndex = -1;
          diagonalUnsafe = false;
        }
        // otherwise prep for diagonal fix when avoiding entities on straight
        else {
          neighborMap = currentNode.neighborMap;
          topleft = topright = bottomleft = bottomright = diagonalUnsafe = false;
          diagonalStartIndex = (il * 0.5) | (0 + 1);
        }
      }

      for (i = 0; i < il; i++) {
        neighbor = neighbors[i];

        // neighbor already tried

        if (neighbor.closed) {
          continue;
        }

        const gridX = neighbor.gridX;
        const gridY = neighbor.gridY;

        if (neighbor !== destinationNode) {
          // don't search outside range

          if (needsDistCheck) {
            const deltaX = gridX - gridDestinationX;
            const deltaY = gridY - gridDestinationY;

            if (deltaX * deltaX + deltaY * deltaY > searchDistance) {
              continue;
            }
          }

          // avoid colliding entities

          if (needsAvoidEntityCheck) {
            // diagonal may be unsafe to walk when direct has colliding entity

            if (
              diagonalUnsafe &&
              ((topleft && neighbor === neighborMap.topleft) ||
                (topright && neighbor === neighborMap.topright) ||
                (bottomleft && neighbor === neighborMap.bottomleft) ||
                (bottomright && neighbor === neighborMap.bottomright))
            ) {
              continue;
            } else if (nodeHasCollidingEntities(neighbor, currentNode, entityPathing, entityTarget)) {
              // when diagonal movement requires walkable on both direct nodes
              // then a direct node with a colliding entity automatically rules out the diagonal
              // direct neighbors are always in the first half of neighbor list

              if (diagonalDouble && i < diagonalStartIndex) {
                if (neighbor === neighborMap.top) {
                  diagonalUnsafe = topleft = topright = true;
                }

                if (neighbor === neighborMap.bottom) {
                  diagonalUnsafe = bottomleft = bottomright = true;
                }

                if (neighbor === neighborMap.left) {
                  diagonalUnsafe = topleft = bottomleft = true;
                }

                if (neighbor === neighborMap.right) {
                  diagonalUnsafe = topright = bottomright = true;
                }
              }

              continue;
            }
          }
        }

        // get the distance between current node and the neighbor to find the next g value

        const dg = gridX - gridCurrentX === 0 || gridY - gridCurrentY === 0 ? 1 : SQRT2;
        const ng = currentNode.g + dg;

        // add the weighted distance between current node and the neighbor

        let nw;

        if (plusplusConfig.PATHFINDING.WEIGHTED) {
          nw = currentNode.w + dg + neighbor.weight + plusplusConfig.PATHFINDING.WEIGHT * neighbor.weightPct;
        } else {
          nw = ng;
        }

        // check if the neighbor has not been inspected yet, or
        // can be reached with smaller cost from the current node

        if (!neighbor.opened || nw < neighbor.w) {
          neighbor.g = ng;
          neighbor.w = nw;
          neighbor.h = neighbor.h || heuristic(abs(gridX - gridDestinationX), abs(gridY - gridDestinationY));
          neighbor.f = neighbor.w + neighbor.h;
          neighbor.prevNode = currentNode;

          if (!neighbor.opened) {
            neighbor.opened = true;

            // insert sort neighbor into the open list
            // where index 0 = highest value

            for (j = open.length; j > 0; j--) {
              openNode = open[j - 1];

              if (neighbor.f <= openNode.f) {
                break;
              } else {
                openNode.openIndex = j;
                open[j] = openNode;
              }
            }

            neighbor.openIndex = j;
            open[j] = neighbor;
          } else {
            // neighbor can be reached with smaller cost
            // we need to shift it up, towards the end of the list

            let shifted;

            for (j = neighbor.openIndex, jl = open.length - 1; j < jl; j++) {
              openNode = open[j + 1];

              if (openNode.f <= neighbor.f) {
                shifted = true;
                break;
              } else {
                openNode.openIndex = j;
                open[j] = openNode;
              }
            }

            if (!shifted) {
              j = open.length;
            }

            neighbor.openIndex = j;
            open[j] = neighbor;
          }
        }
      }
    }

    plusplusPathfinding._cleanup();

    return path;
  }

  static getPathAwayFromEntity(
    entityPathing: plusplusEntityExtended,
    entityTarget: plusplusEntityExtended,
    avoidEntities?: boolean,
    searchDistance?: number,
    heuristicType?: "MANHATTAN" | "EUCLIDEAN" | "CHEBYSHEV"
  ): Vector2[] {
    return plusplusPathfinding.getPathAwayFrom(
      entityPathing.pos.x + entityPathing.size.x * 0.5,
      entityPathing.pos.y + entityPathing.size.y * 0.5,
      entityTarget.pos.x + entityTarget.size.x * 0.5,
      entityTarget.pos.y + entityTarget.size.y * 0.5,
      avoidEntities,
      searchDistance,
      entityPathing,
      heuristicType
    );
  }

  static getPathAwayFromPoint(
    entityPathing: plusplusEntityExtended,
    awayFromX: number,
    awayFromY: number,
    avoidEntities?: boolean,
    searchDistance?: number,
    heuristicType?: "MANHATTAN" | "EUCLIDEAN" | "CHEBYSHEV"
  ): Vector2[] {
    return plusplusPathfinding.getPathAwayFrom(
      entityPathing.pos.x + entityPathing.size.x * 0.5,
      entityPathing.pos.y + entityPathing.size.y * 0.5,
      awayFromX,
      awayFromY,
      avoidEntities,
      searchDistance,
      entityPathing,
      heuristicType
    );
  }

  static getPathAwayFrom(
    fromX: number,
    fromY: number,
    awayFromX: number,
    awayFromY: number,
    avoidEntities?: boolean,
    searchDistance?: number,
    entityPathing?: plusplusEntityExtended,
    heuristicType?: "MANHATTAN" | "EUCLIDEAN" | "CHEBYSHEV"
  ): Vector2[] {
    // init path

    let path;

    if (entityPathing && entityPathing.path) {
      path = entityPathing.path;
      path.length = 0;
    } else {
      path = [];
    }

    // check for empty grid

    const grid = plusplusPathfinding._grid;

    if (grid.length === 0) {
      return path;
    }

    // get the map information

    const gridFromX = Math.floor(fromX * plusplusPathfinding._tilesizeReciprocal);
    const gridFromY = Math.floor(fromY * plusplusPathfinding._tilesizeReciprocal);
    const gridAwayFromX = Math.floor(awayFromX * plusplusPathfinding._tilesizeReciprocal);
    const gridAwayFromY = Math.floor(awayFromY * plusplusPathfinding._tilesizeReciprocal);
    const startNode = grid[gridFromY] && grid[gridFromY][gridFromX];
    const awayFromNode = grid[gridAwayFromY] && grid[gridAwayFromY][gridAwayFromX];

    // start or away from node is invalid

    if (!startNode || !awayFromNode) {
      return path;
    }

    const open = plusplusPathfinding._open;
    const closed = plusplusPathfinding._closed;
    const heuristic = plusplusPathfinding.HEURISTIC[heuristicType || "MANHATTAN"];
    const abs = Math.abs;
    const SQRT2 = Math.SQRT2;
    let neighbors;
    let neighbor;
    let openNode;
    let i, il;
    let j, jl;

    // when pathing entity present

    const tilesize = plusplusPathfinding._tilesize;
    const entityPathingSize = tilesize;
    let needsAvoidEntityCheck;
    let diagonalDouble;
    let nodeHasCollidingEntities;
    let neighborMap;
    let diagonalUnsafe;
    let topleft;
    let topright;
    let bottomleft;
    let bottomright;
    let diagonalStartIndex;

    if (entityPathing) {
      entityPathingSize = Math.max(entityPathing.size.x, entityPathing.size.y);
      diagonalDouble =
        plusplusConfig.PATHFINDING.ALLOW_DIAGONAL && plusplusConfig.PATHFINDING.DIAGONAL_REQUIRES_BOTH_DIRECT;

      // avoiding other entities

      if (avoidEntities) {
        needsAvoidEntityCheck = true;
        nodeHasCollidingEntities = plusplusPathfinding.nodeHasCollidingEntities;
      }
    }

    // setup search distance

    if (searchDistance > 0) {
      searchDistance *= plusplusPathfinding._tilesizeReciprocal;
    } else {
      searchDistance = plusplusConfig.PATHFINDING.AWAY_FROM_DISTANCE * plusplusPathfinding._tilesizeReciprocal;
    }

    searchDistance *= searchDistance;

    // add start as first open node

    open.push(startNode);

    let bestCost = Infinity;
    let bestDistance = -Infinity;
    let bestFleeNode;
    let gridDeltaX = gridFromX - gridAwayFromX;
    let gridDeltaY = gridFromY - gridAwayFromY;
    const gridDistanceAwayStart = gridDeltaX * gridDeltaX + gridDeltaY * gridDeltaY;
    let fleeNode;

    // until the destination is found work off the open nodes

    while (open.length > 0) {
      // get best open node

      const currentNode = open.pop();
      const gridCurrentX = currentNode.gridX;
      const gridCurrentY = currentNode.gridY;

      // add the current node to the closed list

      closed.push(currentNode);
      currentNode.closed = true;

      // check current distance against best
      // and store the best so we can use it
      // in case we've tried as many paths as allowed

      gridDeltaX = gridCurrentX - gridAwayFromX;
      gridDeltaY = gridCurrentY - gridAwayFromY;
      const gridDistanceAway = gridDeltaX * gridDeltaX + gridDeltaY * gridDeltaY - gridDistanceAwayStart;

      if (
        gridDistanceAway > 0 &&
        currentNode.g > 1 &&
        gridDistanceAway > bestDistance &&
        currentNode.w * 0.5 < bestCost
      ) {
        bestFleeNode = currentNode;
        bestCost = currentNode.w;
        bestDistance = gridDistanceAway;
      }

      if (closed.length >= plusplusConfig.PATHFINDING.AWAY_FROM_MAX_NODES) {
        fleeNode = bestFleeNode;
      }

      // we're as far away as we need to be
      // go up the path chain to recreate the path

      if (fleeNode) {
        while (fleeNode) {
          path.push(fleeNode);
          fleeNode = fleeNode.prevNode;
        }

        plusplusPathfinding._cleanup();

        return path;
      }

      // get neighbors of the current node

      neighbors = currentNode.neighbors;
      il = neighbors.length;

      // setup for diagonal

      if (diagonalDouble) {
        // when pathing entity size is bigger than tilesize
        // to avoid getting entity caught on corners
        // it should probably only be allowed to walk on straight tiles
        // unless node is surrounded by walkable neighbors

        if (entityPathingSize > tilesize && !currentNode.slopedNeighbor && il < 8) {
          neighbors = currentNode.directNeighbors;
          il = neighbors.length;
          diagonalStartIndex = -1;
          diagonalUnsafe = false;
        }
        // otherwise prep for diagonal fix when avoiding entities on straight
        else {
          neighborMap = currentNode.neighborMap;
          topleft = topright = bottomleft = bottomright = diagonalUnsafe = false;
          diagonalStartIndex = (il * 0.5) | (0 + 1);
        }
      }

      for (i = 0; i < il; i++) {
        neighbor = neighbors[i];

        // neighbor already tried

        if (neighbor.closed) {
          continue;
        }

        // avoid colliding entities

        if (needsAvoidEntityCheck) {
          // diagonal may be unsafe to walk when direct has colliding entity

          if (
            diagonalUnsafe &&
            ((topleft && neighbor === neighborMap.topleft) ||
              (topright && neighbor === neighborMap.topright) ||
              (bottomleft && neighbor === neighborMap.bottomleft) ||
              (bottomright && neighbor === neighborMap.bottomright))
          ) {
            continue;
          } else if (nodeHasCollidingEntities(neighbor, currentNode, entityPathing)) {
            // when diagonal movement requires walkable on both direct nodes
            // then a direct node with a colliding entity automatically rules out the diagonal
            // direct neighbors are always in the first half of neighbor list

            if (diagonalDouble && i < diagonalStartIndex) {
              if (neighbor === neighborMap.top) {
                diagonalUnsafe = topleft = topright = true;
              }

              if (neighbor === neighborMap.bottom) {
                diagonalUnsafe = bottomleft = bottomright = true;
              }

              if (neighbor === neighborMap.left) {
                diagonalUnsafe = topleft = bottomleft = true;
              }

              if (neighbor === neighborMap.right) {
                diagonalUnsafe = topright = bottomright = true;
              }
            }

            continue;
          }
        }

        const gridX = neighbor.gridX;
        const gridY = neighbor.gridY;

        // get the distance between current node and the neighbor to find the next g value

        const dx = gridX - gridCurrentX;
        const dy = gridY - gridCurrentY;
        const dg = dx === 0 || dy === 0 ? 1 : SQRT2;
        const ng = currentNode.g + dg;

        // add the weighted distance between current node and the neighbor

        let dw;

        if (plusplusConfig.PATHFINDING.WEIGHTED) {
          dw = dg + neighbor.weight + plusplusConfig.PATHFINDING.WEIGHT * neighbor.weightPct;
        } else {
          dw = dg;
        }

        // add weight if this would take us closer to away from position

        if ((gridDeltaX > 0 && gridDeltaX + dx < gridDeltaX) || (gridDeltaX < 0 && gridDeltaX + dx > gridDeltaX)) {
          dw += plusplusConfig.PATHFINDING.WEIGHT_AWAY_FROM;
        }

        if ((gridDeltaY > 0 && gridDeltaY + dy < gridDeltaY) || (gridDeltaY < 0 && gridDeltaY + dy > gridDeltaY)) {
          dw += plusplusConfig.PATHFINDING.WEIGHT_AWAY_FROM;
        }

        const nw = currentNode.w + dw;

        // check if the neighbor has not been inspected yet, or
        // can be reached with smaller cost from the current node

        if (!neighbor.opened || nw < neighbor.w) {
          neighbor.g = ng;
          neighbor.w = nw;
          neighbor.h = neighbor.h || heuristic(abs(gridX - gridAwayFromX), abs(gridY - gridAwayFromY));
          neighbor.f = neighbor.w + neighbor.h;
          neighbor.prevNode = currentNode;

          if (!neighbor.opened) {
            neighbor.opened = true;

            // insert sort neighbor into the open list
            // where index 0 = highest value

            for (j = open.length; j > 0; j--) {
              openNode = open[j - 1];

              if (neighbor.f <= openNode.f) {
                break;
              } else {
                openNode.openIndex = j;
                open[j] = openNode;
              }
            }

            neighbor.openIndex = j;
            open[j] = neighbor;
          } else {
            // neighbor can be reached with smaller cost
            // we need to shift it up, towards the end of the list

            let shifted;

            for (j = neighbor.openIndex, jl = open.length - 1; j < jl; j++) {
              openNode = open[j + 1];

              if (openNode.f <= neighbor.f) {
                shifted = true;
                break;
              } else {
                openNode.openIndex = j;
                open[j] = openNode;
              }
            }

            if (!shifted) {
              j = open.length;
            }

            neighbor.openIndex = j;
            open[j] = neighbor;
          }
        }
      }
    }

    plusplusPathfinding._cleanup();

    return path;
  }

  static getNeighbors(node: plusplusPathNode): plusplusPathNode[] {
    const neighbors = [];
    const gridX = node.gridX;
    const gridY = node.gridY;
    const grid = plusplusPathfinding._grid;
    let neighbor;

    const row = grid[gridY];
    const prevRow = grid[gridY - 1];
    const nextRow = grid[gridY + 1];

    // direct neighbors

    neighbor = prevRow && prevRow[gridX];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, 0, -1, node)) {
      neighbors.push(neighbor);
    }

    neighbor = row && row[gridX + 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, 1, 0, node)) {
      neighbors.push(neighbor);
    }

    neighbor = nextRow && nextRow[gridX];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, 0, 1, node)) {
      neighbors.push(neighbor);
    }

    neighbor = row && row[gridX - 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, -1, 0, node)) {
      neighbors.push(neighbor);
    }

    // diagonal neighbors

    neighbor = prevRow && prevRow[gridX - 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, -1, -1, node)) {
      neighbors.push(neighbor);
    }

    neighbor = prevRow && prevRow[gridX + 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, 1, -1, node)) {
      neighbors.push(neighbor);
    }

    neighbor = nextRow && nextRow[gridX + 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, 1, 1, node)) {
      neighbors.push(neighbor);
    }

    neighbor = nextRow && nextRow[gridX - 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, -1, 1, node)) {
      neighbors.push(neighbor);
    }

    return neighbors;
  }

  static getDirectNeighbors(node: plusplusPathNode): plusplusPathNode[] {
    const neighbors = [];
    const gridX = node.gridX;
    const gridY = node.gridY;
    const grid = plusplusPathfinding._grid;
    let neighbor;

    const row = grid[gridY];
    const prevRow = grid[gridY - 1];
    const nextRow = grid[gridY + 1];

    neighbor = prevRow && prevRow[gridX];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.left) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, 0, -1, node)
    ) {
      neighbors.push(neighbor);
    }

    neighbor = row && row[gridX + 1];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.right) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, 1, 0, node)
    ) {
      neighbors.push(neighbor);
    }

    neighbor = nextRow && nextRow[gridX];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.bottom) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, 0, 1, node)
    ) {
      neighbors.push(neighbor);
    }

    neighbor = row && row[gridX - 1];
    if (neighbor && neighbor.walkable && plusplusPathfinding.isDirectionWalkable(neighbor, -1, 0, node)) {
      neighbors.push(neighbor);
    }

    return neighbors;
  }

  static getDiagonalNeighbors(node: plusplusPathNode): plusplusPathNode[] {
    const neighbors = [];
    const gridX = node.gridX;
    const gridY = node.gridY;
    const grid = plusplusPathfinding._grid;
    let neighbor;

    const prevRow = grid[gridY - 1];
    const nextRow = grid[gridY + 1];

    neighbor = prevRow && prevRow[gridX - 1];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.topleft) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, -1, -1, node)
    ) {
      neighbors.push(neighbor);
    }

    neighbor = prevRow && prevRow[gridX + 1];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.topright) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, 1, -1, node)
    ) {
      neighbors.push(neighbor);
    }

    neighbor = nextRow && nextRow[gridX + 1];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.bottomright) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, 1, 1, node)
    ) {
      neighbors.push(neighbor);
    }

    neighbor = nextRow && nextRow[gridX - 1];
    if (
      neighbor &&
      (neighbor.walkable || node.slopesAlongMap.bottomleft) &&
      plusplusPathfinding.isDirectionWalkable(neighbor, -1, 1, node)
    ) {
      neighbors.push(neighbor);
    }

    return neighbors;
  }

  static nodeHasCollidingEntities(
    node: plusplusPathNode,
    nodeFrom: plusplusPathNode,
    entityPathing: plusplusEntityExtended,
    entityTarget?: plusplusEntityExtended
  ): boolean {
    // check pathing entity's layer's spatial hash

    const layer = ig.game.layersMap[entityPathing.layerName];

    if (layer && layer.spatialHash) {
      const hash = layer.spatialHash;
      const cellSize = layer.spatialHashCellSize;
      const x = node.x;
      const y = node.y;
      const cellX = (x / cellSize) | 0;
      const cellY = (y / cellSize) | 0;

      // see if there is a cell in the spatial hash at this location

      const column = hash[cellX];

      if (column) {
        const cell = column[cellY];

        if (cell && cell.length > 0) {
          const halfWidth = entityPathing.size.x * 0.45;
          const halfHeight = entityPathing.size.y * 0.45;
          const minX = x - halfWidth;
          const minY = y - halfHeight;
          const maxX = x + halfWidth;
          const maxY = y + halfHeight;
          const dirX = node.gridX - nodeFrom.gridX;
          const dirY = node.gridY - nodeFrom.gridY;

          for (let i = 0; i < cell.length; i++) {
            const entity = cell[i];

            // this location is probably not walkable, provided that the entity in the cell:
            // is not the entity that is pathing or the entity that is the target
            // is not the same group as the entity that is pathing
            // is not hidden or killed
            // does collide and the pathing entity intersects the entity's bounds

            if (
              entity !== entityPathing &&
              !(entity.group & entityPathing.group) &&
              (!entityTarget || entity !== entityTarget) &&
              !entity.hidden &&
              !entity._killed &&
              (entity.collides !== plusplusEntityExtended.COLLIDES.NEVER ||
                (entity.type & plusplusEntityExtended.TYPE.DANGEROUS && entity.checkAgainst & entityPathing.type)) &&
              plusplusUtilsIntersection.AABBIntersect(
                minX,
                minY,
                maxX,
                maxY,
                entity.pos.x,
                entity.pos.y,
                entity.pos.x + entity.size.x,
                entity.pos.y + entity.size.y
              )
            ) {
              // not one way

              if (
                !entity.oneWay ||
                // no one way climbable will ever block a climbing or flying entity
                (!(
                  entity.climbable &&
                  (entityPathing.canClimb || entityPathing.gravityFactor === 0 || ig.game.gravity === 0)
                ) &&
                  // offset and one way opposite on x or y
                  ((dirY < 0 && entity.oneWayFacing.y > 0) ||
                    (dirY > 0 && entity.oneWayFacing.y < 0) ||
                    (dirX < 0 && entity.oneWayFacing.x > 0) ||
                    (dirX > 0 && entity.oneWayFacing.x < 0)))
              ) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  static getGridNode(gridX: number, gridY: number): plusplusPathNode {
    return plusplusPathfinding._grid[gridY] && plusplusPathfinding._grid[gridY][gridX];
  }

  static getNode(x: number, y: number, gridOffsetX?: number, gridOffsetY?: number): plusplusPathNode {
    const gridX = Math.floor(x * plusplusPathfinding._tilesizeReciprocal) + (gridOffsetX || 0);
    const gridY = Math.floor(y * plusplusPathfinding._tilesizeReciprocal) + (gridOffsetY || 0);

    return plusplusPathfinding.getGridNode(gridX, gridY);
  }

  static getGridWalkableNode(
    x: number,
    y: number,
    gridOffsetX?: number,
    gridOffsetY?: number,
    avoidEntities?: boolean,
    entityPathing?: plusplusEntityExtended
  ): plusplusPathNode {
    const gridX = x + (gridOffsetX || 0);
    const gridY = y + (gridOffsetY || 0);
    const node = plusplusPathfinding._grid[gridY] && plusplusPathfinding._grid[gridY][gridX];
    const nodeFrom = plusplusPathfinding._grid[y] && plusplusPathfinding._grid[y][x];

    if (
      node &&
      node.walkable &&
      ((!gridOffsetX && !gridOffsetY) ||
        plusplusPathfinding.isDirectionWalkable(node, gridOffsetX, gridOffsetY, nodeFrom))
    ) {
      if (avoidEntities && entityPathing) {
        if (!nodeFrom || !plusplusPathfinding.nodeHasCollidingEntities(node, nodeFrom, entityPathing)) {
          return node;
        }
      } else {
        return node;
      }
    }
  }

  static getWalkableNode(
    x: number,
    y: number,
    gridOffsetX?: number,
    gridOffsetY?: number,
    avoidEntities?: boolean,
    entityPathing?: plusplusEntityExtended
  ): plusplusPathNode {
    return plusplusPathfinding.getGridWalkableNode(
      Math.floor(x * plusplusPathfinding._tilesizeReciprocal),
      Math.floor(y * plusplusPathfinding._tilesizeReciprocal),
      gridOffsetX,
      gridOffsetY,
      avoidEntities,
      entityPathing
    );
  }

  static getWalkableNodeChain(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    numNodes?: number,
    avoidEntities?: boolean,
    entityPathing?: plusplusEntityExtended,
    nodes?: plusplusPathNode[]
  ): plusplusPathNode[] {
    // setup parameters

    const gridX = Math.floor(x * plusplusPathfinding._tilesizeReciprocal);
    const gridY = Math.floor(y * plusplusPathfinding._tilesizeReciprocal);

    numNodes = numNodes || 2;

    if (nodes) {
      nodes.length = 0;
    } else {
      nodes = [];
    }

    // find chain

    for (let i = 1; i <= numNodes; i++) {
      const node = plusplusPathfinding.getGridWalkableNode(
        gridX + dirX * i,
        gridY + dirY * i,
        dirX,
        dirY,
        avoidEntities,
        entityPathing
      );

      if (!node) {
        break;
      }

      nodes.push(node);
    }

    return nodes;
  }

  static isGridWalkable(
    x: number,
    y: number,
    gridOffsetX?: number,
    gridOffsetY?: number,
    avoidEntities?: boolean,
    entityPathing?: plusplusEntityExtended
  ): boolean {
    const gridX = x + (gridOffsetX || 0);
    const gridY = y + (gridOffsetY || 0);
    const node = plusplusPathfinding._grid[gridY] && plusplusPathfinding._grid[gridY][gridX];
    const nodeFrom = plusplusPathfinding._grid[y] && plusplusPathfinding._grid[y][x];

    if (
      node &&
      node.walkable &&
      ((!gridOffsetX && !gridOffsetY) ||
        plusplusPathfinding.isDirectionWalkable(node, gridOffsetX, gridOffsetY, nodeFrom))
    ) {
      if (avoidEntities && entityPathing) {
        if (nodeFrom && !plusplusPathfinding.nodeHasCollidingEntities(node, nodeFrom, entityPathing)) {
          return true;
        }
      } else {
        return true;
      }
    }

    return false;
  }

  static isWalkable(
    x: number,
    y: number,
    gridOffsetX: number,
    gridOffsetY: number,
    avoidEntities: boolean,
    entityPathing: plusplusEntityExtended
  ): boolean {
    return plusplusPathfinding.isGridWalkable(
      Math.floor(x * plusplusPathfinding._tilesizeReciprocal),
      Math.floor(y * plusplusPathfinding._tilesizeReciprocal),
      gridOffsetX,
      gridOffsetY,
      avoidEntities,
      entityPathing
    );
  }

  static isDirectionWalkable(node: plusplusPathNode, dirX: number, dirY: number, nodeFrom: plusplusPathNode): boolean {
    if (dirX !== 0 && dirY !== 0 && nodeFrom) {
      if (!plusplusConfig.PATHFINDING.ALLOW_DIAGONAL) {
        return false;
      }

      const nm = nodeFrom.neighborMap;

      if (plusplusConfig.PATHFINDING.DIAGONAL_REQUIRES_BOTH_DIRECT) {
        if (dirX > 0) {
          if (!nm.right || (!nm.right.walkable && !nm.right.sloped)) {
            return false;
          }

          if (dirY > 0) {
            if (!nm.bottom || (!nm.bottom.walkable && !nm.bottom.sloped)) {
              return false;
            }
          } else if (!nm.top || (!nm.top.walkable && !nm.top.sloped)) {
            return false;
          }
        } else {
          if (!nm.left || (!nm.left.walkable && !nm.left.sloped)) {
            return false;
          }

          if (dirY > 0) {
            if (!nm.bottom || (!nm.bottom.walkable && !nm.bottom.sloped)) {
              return false;
            }
          } else if (!nm.top || (!nm.top.walkable && !nm.top.sloped)) {
            return false;
          }
        }
      } else {
        if (dirX > 0) {
          if (dirY > 0) {
            if (
              (!nm.right || (!nm.right.walkable && !nm.right.sloped)) &&
              (!nm.bottom || (!nm.bottom.walkable && !nm.bottom.sloped))
            ) {
              return false;
            }
          } else if (
            (!nm.right || (!nm.right.walkable && !nm.right.sloped)) &&
            (!nm.top || (!nm.top.walkable && !nm.top.sloped))
          ) {
            return false;
          }
        } else {
          if (dirY > 0) {
            if (
              (!nm.left || (!nm.left.walkable && !nm.left.sloped)) &&
              (!nm.bottom || (!nm.bottom.walkable && !nm.bottom.sloped))
            ) {
              return false;
            }
          } else if (
            (!nm.left || (!nm.left.walkable && !nm.left.sloped)) &&
            (!nm.top || (!nm.top.walkable && !nm.top.sloped))
          ) {
            return false;
          }
        }
      }
    }

    return !(
      node.oneWay &&
      !node.climbable &&
      ((dirY < 0 && node.oneWayFacing.y > 0) ||
        (dirY > 0 && node.oneWayFacing.y < 0) ||
        (dirX < 0 && node.oneWayFacing.x > 0) ||
        (dirX > 0 && node.oneWayFacing.x < 0))
    );
  }

  static isGridPointInGrid(gridX: number, gridY: number): boolean {
    return plusplusPathfinding._grid[gridY] && plusplusPathfinding._grid[gridY][gridX] instanceof Node;
  }

  static isPointInGrid(x: number, y: number, gridOffsetX?: number, gridOffsetY?: number): boolean {
    const gridX = Math.floor(x * plusplusPathfinding._tilesizeReciprocal) + (gridOffsetX || 0);
    const gridY = Math.floor(y * plusplusPathfinding._tilesizeReciprocal) + (gridOffsetY || 0);

    return plusplusPathfinding._grid[gridY] && plusplusPathfinding._grid[gridY][gridX] instanceof Node;
  }

  static getPositionPathfindingEntities(
    entityPathing: plusplusEntityExtended,
    entityTarget: plusplusEntityExtended,
    positions?: { from: Vector2; target: Vector2 }
  ): { from: Vector2; target: Vector2 } {
    if (!positions) {
      positions = {
        from: {
          x: 0.1,
          y: 0.1,
        },
        target: {
          x: 0.1,
          y: 0.1,
        },
      };
    }

    const pWidth = entityPathing.size.x;
    const pHeight = entityPathing.size.y;
    const pMinX = entityPathing.pos.x;
    const pMaxX = pMinX + pWidth;
    const pMinY = entityPathing.pos.y;
    const pMaxY = pMinY + pHeight;
    const pCenterX = pMinX + pWidth * 0.5;
    const pCenterY = pMinY + pHeight * 0.5;

    const tWidth = entityTarget.size.x;
    const tHeight = entityTarget.size.y;
    const tMinX = entityTarget.pos.x;
    const tMaxX = tMinX + tWidth;
    const tMinY = entityTarget.pos.y;
    const tMaxY = tMinY + tHeight;
    const tCenterX = tMinX + tWidth * 0.5;
    const tCenterY = tMinY + tHeight * 0.5;

    const tilesizeQuarter = plusplusPathfinding._tilesize * 0.25;

    if (pCenterX > tCenterX) {
      positions.from.x = pMinX + tilesizeQuarter;
      positions.target.x = tMaxX - tilesizeQuarter;
    } else if (pCenterX < tCenterX) {
      positions.from.x = pMaxX - tilesizeQuarter;
      positions.target.x = tMinX + tilesizeQuarter;
    } else {
      positions.from.x = pMinX + pWidth * 0.5;
      positions.target.x = tMinX + tWidth * 0.5;
    }

    if (pCenterY > tCenterY) {
      positions.from.y = entityPathing.hasGravity ? pMaxY - tilesizeQuarter : pMinY + tilesizeQuarter;
      positions.target.y = tMaxY - tilesizeQuarter;
    } else if (pCenterY < tCenterY) {
      positions.from.y = pMaxY - tilesizeQuarter;
      positions.target.y = entityTarget.hasGravity ? tMaxY - tilesizeQuarter : tMinY + tilesizeQuarter;
    } else {
      positions.from.y = entityPathing.hasGravity ? pMaxY - tilesizeQuarter : pMinY + pHeight * 0.5;
      positions.target.y = entityTarget.hasGravity ? tMaxY - tilesizeQuarter : tMinY + tHeight * 0.5;
    }

    return positions;
  }

  static getPositionPathfindingPoint(
    entityPathing: plusplusEntityExtended,
    targetX: number,
    targetY: number,
    position: Vector2
  ): Vector2 {
    if (!position) {
      position = { x: 0, y: 0 };
    }

    position.x = entityPathing.pos.x + entityPathing.size.x * 0.5;
    position.y = entityPathing.pos.y + entityPathing.size.y * 0.5;

    if (position.x > targetX) {
      position.x = entityPathing.pos.x + plusplusPathfinding._tilesize * 0.25;
    } else if (position.x < targetX) {
      position.x = entityPathing.pos.x + entityPathing.size.x - plusplusPathfinding._tilesize * 0.25;
    }

    if (entityPathing.hasGravity || position.y < targetY) {
      position.y = entityPathing.pos.y + entityPathing.size.y - plusplusPathfinding._tilesize * 0.25;
    } else if (position.y > targetY) {
      position.y = entityPathing.pos.y + plusplusPathfinding._tilesize * 0.25;
    }

    return position;
  }

  static getBoundsPathfollowing(
    x: number,
    y: number,
    width: number,
    height: number,
    target: plusplusPathNode,
    zeroGrav?: boolean,
    bounds?: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      width: number;
      height: number;
      ignoreCornerX: boolean;
      ignoreCornerY: boolean;
    }
  ): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    ignoreCornerX: boolean;
    ignoreCornerY: boolean;
  } {
    if (!bounds) {
      bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, ignoreCornerX: false, ignoreCornerY: false };
    }

    const tileWidth = Math.min(plusplusPathfinding._tilesize * 0.5, width * 0.5);
    const tileHeight = Math.min(plusplusPathfinding._tilesize * 0.5, height * 0.5);

    // corners need bounds based on corner

    if (target.corner) {
      if (target.cornerMap.bottomleft) {
        bounds.minX = x;
        bounds.maxX = bounds.minX + tileWidth;
        bounds.maxY = y + height;
        bounds.minY = bounds.maxY - tileHeight;
      } else if (target.cornerMap.bottomright) {
        bounds.maxX = x + width;
        bounds.minX = bounds.maxX - tileWidth;
        bounds.maxY = y + height;
        bounds.minY = bounds.maxY - tileHeight;
      } else if (target.cornerMap.topleft) {
        bounds.minX = x;
        bounds.maxX = bounds.minX + tileWidth;
        bounds.minY = y;
        bounds.maxY = bounds.minY + tileHeight;
      } else if (target.cornerMap.topright) {
        bounds.maxX = x + width;
        bounds.minX = bounds.maxX - tileWidth;
        bounds.minY = y;
        bounds.maxY = bounds.minY + tileHeight;
      }
    }
    // modify bounds away from node based on node size
    else {
      // usually it is best to force bounds to corner
      // and then be a little more flexible

      if (bounds.ignoreCornerX) {
        bounds.minX = x + width * 0.5 - tileWidth * 0.5;
        bounds.maxX = bounds.minX + tileWidth;
      } else {
        bounds.minX = x + width * 0.5;
        bounds.maxX = bounds.minX;
      }

      bounds.maxY = y + height;
      bounds.minY = bounds.maxY - tileHeight;

      if (target.x > bounds.maxX) {
        bounds.minX = x;
        bounds.maxX = bounds.minX + tileWidth;
      } else if (target.x < bounds.minX) {
        bounds.maxX = x + width;
        bounds.minX = bounds.maxX - tileWidth;
      }

      if (!bounds.ignoreCornerX && target.x >= bounds.minX - 1 && target.x <= bounds.maxX + 1) {
        bounds.ignoreCornerX = true;
      }

      if (zeroGrav) {
        if (bounds.ignoreCornerY) {
          bounds.minY = y + height * 0.5 - tileHeight * 0.5;
          bounds.maxY = bounds.minY + tileHeight;
        } else {
          bounds.minY = y + height * 0.5;
          bounds.maxY = bounds.minY;
        }

        if (target.y > bounds.maxY) {
          bounds.minY = y;
          bounds.maxY = bounds.minY + tileHeight;
        } else if (target.y < bounds.minY) {
          bounds.maxY = y + height;
          bounds.minY = bounds.maxY - tileHeight;
        }

        if (!bounds.ignoreCornerY && target.y >= bounds.minY - 1 && target.y <= bounds.maxY + 1) {
          bounds.ignoreCornerY = true;
        }
      }
    }

    bounds.width = tileWidth;
    bounds.height = tileHeight;

    return bounds;
  }

  static getEntityNeighborPositionX(x: number, width: number, dirX: number): number {
    if (dirX !== 0) {
      if (dirX < 0) {
        return x - plusplusPathfinding._tilesize;
      } else {
        return x + width + plusplusPathfinding._tilesize;
      }
    } else {
      return x + width * 0.5;
    }
  }

  static getEntityNeighborPositionY(y: number, height: number, dirY: number, zeroGrav: boolean): number {
    if (dirY !== 0) {
      if (dirY < 0) {
        return y - plusplusPathfinding._tilesize;
      } else {
        return y + height + plusplusPathfinding._tilesize;
      }
    } else if (zeroGrav) {
      return y + height * 0.5;
    } else {
      return y + height - plusplusPathfinding._tilesize * 0.25;
    }
  }

  static getEntityOnSmoothSlope(entity: plusplusEntityExtended, dirX: number, dirY: number): boolean {
    const tilesizeQuarter = plusplusPathfinding._tilesize * 0.25;
    let node;

    if (dirX < 0) {
      node = plusplusPathfinding.getNode(entity.pos.x + tilesizeQuarter, entity.pos.y + entity.size.y - tilesizeQuarter);
    } else {
      node = plusplusPathfinding.getNode(
        entity.pos.x + entity.size.x - tilesizeQuarter,
        entity.pos.y + entity.size.y - tilesizeQuarter
      );
    }

    if (node) {
      if (plusplusConfig.PATHFINDING.STRICT_SLOPE_CHECK) {
        let neighborName;

        if (dirX < 0) {
          neighborName = "left";
        } else {
          neighborName = "right";
        }

        return (
          node.slopesAlongMap[neighborName as keyof NeighborMap] ||
          (dirY && node.slopesAlongMap[((dirY < 0 ? "top" : "bottom") + neighborName) as keyof NeighborMap]) ||
          (!dirY &&
            (node.slopesAlongMap[("top" + neighborName) as keyof NeighborMap] ||
              node.slopesAlongMap[("bottom" + neighborName) as keyof NeighborMap]))
        );
      } else {
        return node.slopedAlong;
      }
    }

    return false;
  }

  static getSlopeDirectionY(entity: plusplusEntityExtended, dirX: number): number {
    const tilesizeQuarter = plusplusPathfinding._tilesize * 0.25;
    let node;

    if (dirX < 0) {
      node = plusplusPathfinding.getNode(entity.pos.x + tilesizeQuarter, entity.pos.y + entity.size.y - tilesizeQuarter);
    } else {
      node = plusplusPathfinding.getNode(
        entity.pos.x + entity.size.x - tilesizeQuarter,
        entity.pos.y + entity.size.y - tilesizeQuarter
      );
    }

    if (node && node.sloped && node.slopeNormal) {
      return plusplusUtilsMath.direction(-node.slopeNormal.x * (dirX < 0 ? 1 : -1));
    }

    return 0;
  }

  static getIsAlongSlope(node: plusplusPathNode, dirX: number, dirY: number): boolean {
    let neighborName;
    let tileDefIndexA;
    let tileDefIndexB;

    if (dirX < 0) {
      neighborName = "left";
      tileDefIndexA = 1;
      tileDefIndexB = 3;
    } else {
      neighborName = "right";
      tileDefIndexA = 3;
      tileDefIndexB = 1;
    }

    let nodeNeighbor;
    let loc;
    let mod;

    if (typeof dirY !== "undefined") {
      if (dirY !== 0) {
        if (dirY < 0) {
          nodeNeighbor = node.neighborMap[("top" + neighborName) as keyof NeighborMap];
          loc = 0;
          mod = 1;
        } else {
          nodeNeighbor = node.neighborMap[("bottom" + neighborName) as keyof NeighborMap];
          loc = 0;
          mod = -1;
        }
      } else {
        nodeNeighbor = node.neighborMap[neighborName as keyof NeighborMap];
        loc = 1;
        mod = 0;
      }
    } else if (node.sloped) {
      nodeNeighbor = node.neighborMap[("top" + neighborName) as keyof NeighborMap];
      loc = 0;
      mod = 1;
    } else {
      nodeNeighbor = node.neighborMap[neighborName as keyof NeighborMap];
      loc = 1;
      mod = 0;
    }

    if (nodeNeighbor && nodeNeighbor.sloped) {
      const dtd = (ig.game.collisionMap && ig.game.collisionMap.tiledef) || plusplusCollisionMap.defaultTileDef;
      const tileDef = dtd[node.tile];
      const tileDefNeighbor = dtd[nodeNeighbor.tile];

      if (
        !tileDefNeighbor ||
        (!tileDef && tileDefNeighbor[tileDefIndexB] === loc) ||
        (tileDef && tileDef[tileDefIndexA] + mod === tileDefNeighbor[tileDefIndexB])
      ) {
        return true;
      }
    }

    return false;
  }
}

type SlopesAlongMap = {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  topleft?: boolean;
  topright?: boolean;
  bottomleft?: boolean;
  bottomright?: boolean;
};

type SlopedNeighborMap = SlopesAlongMap;

type NeighborMap = {
  top?: plusplusPathNode;
  bottom?: plusplusPathNode;
  left?: plusplusPathNode;
  right?: plusplusPathNode;
  topleft?: plusplusPathNode;
  topright?: plusplusPathNode;
  bottomleft?: plusplusPathNode;
  bottomright?: plusplusPathNode;
};

type CornerMap = {
  topleft?: boolean;
  topright?: boolean;
  bottomleft?: boolean;
  bottomright?: boolean;
};

export class plusplusPathNode {
  x = 0;
  y = 0;
  gridX = 0;
  gridY = 0;
  size = 0;
  walkable = true;
  ungrounded = true;
  insideLevel = true;
  tile = 0;
  sloped = false;
  slopeNormal: Vector2 = {
    x: 0,
    y: 0,
  };
  slopedAlong = false;
  slopesAlongMap: SlopesAlongMap = {};
  slopedNeighbor = false;
  slopedNeighborMap: SlopedNeighborMap = {};
  climbable = false;
  oneWay = false;
  oneWayFacing: Vector2 = {
    x: 0,
    y: 0,
  };
  weightPct = 1;
  weight = 0;
  neighbors: plusplusPathNode[] = null;
  directNeighbors: plusplusPathNode[] = null;
  neighborMap: NeighborMap = {};
  corner = false;
  cornerMap: CornerMap = {};

  // internal properties, do not modify
  closed = false;
  opened = false;
  openIndex = 0;
  prevNode: plusplusPathNode = null;
  g = 0;
  w = 0;
  h = 0;
  f = 0;

  constructor(x: number, y: number, gridX: number, gridY: number, walkable?: boolean, tile?: number) {
    this.x = x || 0;
    this.y = y || 0;

    this.gridX = gridX || 0;
    this.gridY = gridY || 0;

    this.walkable = typeof walkable !== "undefined" ? walkable : true;

    this.tile = tile || 0;
    this.climbable = !!plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[this.tile];
    this.oneWay = !!plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[this.tile];
    this.sloped = !!plusplusConfig.COLLISION.TILES_HASH_SLOPED[this.tile];

    if (this.sloped) {
      const segmentsDef = plusplusUtilsTile.defaultTileSegmentsDef[this.tile];

      if (segmentsDef) {
        // first segment with a normal where both x and y are not 0 is our slope

        for (let i = 0; i < segmentsDef.length; i++) {
          const normal = segmentsDef[i].normal;

          if (normal.x && normal.y) {
            this.slopeNormal = normal;
            break;
          }
        }
      }
    }

    if (this.oneWay) {
      if (
        this.tile === plusplusConfig.COLLISION.TILE_ONE_WAY_UP ||
        this.tile === plusplusConfig.COLLISION.TILE_CLIMBABLE_WITH_TOP ||
        this.tile === plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS_WITH_TOP
      ) {
        this.oneWayFacing.y = -1;
      } else if (this.tile === plusplusConfig.COLLISION.TILE_ONE_WAY_DOWN) {
        this.oneWayFacing.y = 1;
      }

      if (this.tile === plusplusConfig.COLLISION.TILE_ONE_WAY_LEFT) {
        this.oneWayFacing.x = -1;
      } else if (this.tile === plusplusConfig.COLLISION.TILE_ONE_WAY_RIGHT) {
        this.oneWayFacing.x = 1;
      }
    }

    if (this.walkable) {
      if (ig.game.shapesLevel.length) {
        this.insideLevel = false;

        for (let i = 0; i < ig.game.shapesLevel.length; i++) {
          const shape = ig.game.shapesLevel[i];

          if (
            plusplusUtilsIntersection.pointInAABB(
              x,
              y,
              shape.x,
              shape.y,
              shape.x + shape.size.x,
              shape.y + shape.size.y
            ) &&
            plusplusUtilsIntersection.pointInPolygon(
              x - (shape.x + shape.size.x * 0.5),
              y - (shape.y + shape.size.y * 0.5),
              shape.vertices
            )
          ) {
            this.insideLevel = true;
            break;
          }
        }
      }
    } else {
      this.insideLevel = false;
    }
  }

  cleanup(): void {
    this.g = this.h = this.f = this.w = this.openIndex = 0;
    this.prevNode = null;
    this.closed = this.opened = false;
  }
}
