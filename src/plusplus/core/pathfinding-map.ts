import { igMap } from "../../impact/map";
import { TileDef } from "../../impact/collision-map";
import { plusplusConfig } from "./config";

type PathfindingTileDefEntry = {
  weightPct?: number;
  walkable?: boolean;
};

export type PathfindingTileDef = {
  0: PathfindingTileDefEntry;
  1: PathfindingTileDefEntry;
  2: PathfindingTileDefEntry;
  3: PathfindingTileDefEntry;
  4: PathfindingTileDefEntry;
};

export class plusplusPathfindingMap extends igMap {
  tiledef: PathfindingTileDef = null;

  constructor(tilesize: number, data: number[][], tiledef?: PathfindingTileDef) {
    super(tilesize, data);

    this.tiledef = tiledef || plusplusConfig.PATHFINDING.TILE_DEF;
  }
}
