import { igAnimation } from "./animation";
import { igBackgroundMap, igMapData } from "./background-map";
import { igCollisionMap, TraceFunction } from "./collision-map";
import { igEntity, igEntityCollides, igEntityType } from "./entity";
import { igEntityPool } from "./entity-pool";
import { ig } from "./impact";
import { erase } from "./util";
import { igDebugMapsPanel } from "./debug/maps-panel";

type SortFunction = (a: igEntity, b: igEntity) => number;

type SORT = {
  Z_INDEX: SortFunction;
  POS_X: SortFunction;
  POS_Y: SortFunction;
};

export type WMData = {
  entities: Record<string, any>[];
  layer: igMapData[];
};

export class igGame {
  static SORT: SORT = {
    Z_INDEX(a: igEntity, b: igEntity) {
      return a.zIndex - b.zIndex;
    },
    POS_X(a: igEntity, b: igEntity) {
      return a.pos.x + a.size.x - (b.pos.x + b.size.x);
    },
    POS_Y(a: igEntity, b: igEntity) {
      return a.pos.y + a.size.y - (b.pos.y + b.size.y);
    },
  };

  clearColor = "#000000";
  gravity = 0;
  screen = { x: 0, y: 0 };
  _rscreen = { x: 0, y: 0 };
  size = { x: 0, y: 0 };

  entities: igEntity[] = [];

  namedEntities: Record<string, igEntity> = {};
  collisionMap: TraceFunction = igCollisionMap.staticNoCollision;
  backgroundMaps: igBackgroundMap[] = [];
  backgroundAnims: Record<string, igAnimation[]> = {};

  autoSort = true;
  sortBy = igGame.SORT.POS_Y;

  cellSize = 64;

  _deferredKill: igEntity[] = [];
  _levelToLoad: WMData = null;
  _entityMapToLoad: Record<string, typeof igEntity> = null;
  _doSortEntities = false;

  loadLevel(data: WMData, entityMap: Record<string, any>): void {
    igEntityPool.drainAllPools();

    this.screen = { x: 0, y: 0 };

    // Entities
    this.entities = [];
    this.namedEntities = {};
    for (let i = 0; i < data.entities.length; i++) {
      const ent = data.entities[i];
      const EntityClass = entityMap[ent.type];
      this.spawnEntity(EntityClass, ent.x, ent.y, ent.settings);
    }
    this.sortEntities();

    // Map Layer
    this.collisionMap = igCollisionMap.staticNoCollision;
    this.backgroundMaps = [];
    for (let i = 0; i < data.layer.length; i++) {
      const ld = data.layer[i];
      if (ld.name == "collision") {
        this.collisionMap = new igCollisionMap(ld.tilesize, ld.data);
      } else {
        const newMap = new igBackgroundMap(ld);
        newMap.anims = this.backgroundAnims[ld.tilesetName] || {};
        this.backgroundMaps.push(newMap);
      }
    }

    // Call post-init ready function on all entities
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].ready();
    }

    if (ig.system.debug) {
      (ig.debug.panels.maps as igDebugMapsPanel).load(this);
    }
  }

  loadLevelDeferred(data: WMData, entityMap: Record<string, typeof igEntity>): void {
    this._levelToLoad = data;
    this._entityMapToLoad = entityMap;
  }

  getMapByName(name: string) {
    if (name == "collision") {
      return this.collisionMap;
    }

    for (let i = 0; i < this.backgroundMaps.length; i++) {
      if (this.backgroundMaps[i].name == name) {
        return this.backgroundMaps[i];
      }
    }

    return null;
  }

  getEntityByName(name: string): igEntity {
    return this.namedEntities[name];
  }

  getEntitiesByType(entityClass: any): igEntity[] {
    const a: igEntity[] = [];
    this.entities.forEach((ent) => {
      if (ent instanceof entityClass && !ent._killed) {
        a.push(ent);
      }
    });
    return a;
  }

  spawnEntity<E extends igEntity>(
    EntityClass: {
      new (x: number, y: number, settings: Record<string, any>): E;
    },
    x: number,
    y: number,
    settings: Record<string, any>
  ): E {
    const ent = new EntityClass(x, y, settings || {});
    this.entities.push(ent);
    if (ent.name) {
      this.namedEntities[ent.name] = ent;
    }
    return ent;
  }

  sortEntities(): void {
    this.entities.sort(this.sortBy);
  }

  sortEntitiesDeferred(): void {
    this._doSortEntities = true;
  }

  removeEntity(ent: igEntity): void {
    // Remove this entity from the named entities
    if (ent.name) {
      delete this.namedEntities[ent.name];
    }

    // We can not remove the entity from the entities[] array in the midst
    // of an update cycle, so remember all killed entities and remove
    // them later.
    // Also make sure this entity doesn't collide anymore and won't get
    // updated or checked
    ent._killed = true;
    ent.type = igEntityType.NONE;
    ent.checkAgainst = igEntityType.NONE;
    ent.collides = igEntityCollides.NEVER;
    this._deferredKill.push(ent);
  }

  run(): void {
    this.update();
    this.draw();
  }

  update(): void {
    if (ig.system.debug) {
      ig.graph.beginClock("update");
    }

    // load new level?
    if (this._levelToLoad) {
      this.loadLevel(this._levelToLoad, this._entityMapToLoad);
      this._levelToLoad = null;
      this._entityMapToLoad = null;
    }

    // update entities
    this.updateEntities();
    this.checkEntities();

    // remove all killed entities
    this._deferredKill.forEach((entity) => {
      entity.erase();
      erase(this.entities, entity);
    });
    this._deferredKill = [];

    // sort entities?
    if (this._doSortEntities || this.autoSort) {
      this.sortEntities();
      this._doSortEntities = false;
    }

    // update background animations
    for (const tileset in this.backgroundAnims) {
      const anims = this.backgroundAnims[tileset];
      anims.forEach((anim) => anim.update());
    }

    if (ig.system.debug) {
      ig.graph.endClock("update");
    }
  }

  updateEntities(): void {
    this.entities.forEach((ent) => {
      if (!ent._killed) {
        ent.update();
      }
    });
  }

  draw(): void {
    if (ig.system.debug) {
      ig.graph.beginClock("draw");
    }

    if (this.clearColor) {
      ig.system.clear(this.clearColor);
    }

    // This is a bit of a circle jerk. Entities reference game._rscreen
    // instead of game.screen when drawing themselves in order to be
    // "synchronized" to the rounded(?) screen position
    this._rscreen.x = ig.system.getDrawPos(this.screen.x) / ig.system.scale;
    this._rscreen.y = ig.system.getDrawPos(this.screen.y) / ig.system.scale;

    let mapIndex;
    for (mapIndex = 0; mapIndex < this.backgroundMaps.length; mapIndex++) {
      const map = this.backgroundMaps[mapIndex];
      if (map.foreground) {
        // All foreground layers are drawn after the entities
        break;
      }
      map.setScreenPos(this.screen.x, this.screen.y);
      map.draw();
    }

    this.drawEntities();

    for (mapIndex; mapIndex < this.backgroundMaps.length; mapIndex++) {
      const map = this.backgroundMaps[mapIndex];
      map.setScreenPos(this.screen.x, this.screen.y);
      map.draw();
    }

    if (ig.system.debug) {
      ig.graph.endClock("draw");
    }
  }

  drawEntities(): void {
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].draw();
    }
  }

  checkEntities(): void {
    if (ig.system.debug) {
      ig.graph.beginClock("checks");
    }
    // Insert all entities into a spatial hash and check them against any
    // other entity that already resides in the same cell. Entities that are
    // bigger than a single cell, are inserted into each one they intersect
    // with.

    // A list of entities, which the current one was already checked with,
    // is maintained for each entity.
    const hash: Record<number, Record<number, igEntity[]>> = {};
    this.entities.forEach((entity) => {
      // Skip entities that don't check, don't get checked and don't collide
      if (
        entity.type == igEntityType.NONE &&
        entity.checkAgainst == igEntityType.NONE &&
        entity.collides == igEntityCollides.NEVER
      ) {
        return;
      }

      const checked: Record<number, boolean> = {};
      const xmin = Math.floor(entity.pos.x / this.cellSize);
      const ymin = Math.floor(entity.pos.y / this.cellSize);
      const xmax = Math.floor((entity.pos.x + entity.size.x) / this.cellSize) + 1;
      const ymax = Math.floor((entity.pos.y + entity.size.y) / this.cellSize) + 1;

      for (let x = xmin; x < xmax; x++) {
        for (let y = ymin; y < ymax; y++) {
          // Current cell is empty - create it and insert!
          if (!hash[x]) {
            hash[x] = {};
            hash[x][y] = [entity];
          } else if (!hash[x][y]) {
            hash[x][y] = [entity];
          }

          // Check against each entity in this cell, then insert
          else {
            const cell = hash[x][y];
            cell.forEach((otherEntity) => {
              // Intersects and wasn't already checkd?
              if (entity.touches(otherEntity) && !checked[otherEntity.id]) {
                checked[otherEntity.id] = true;
                igEntity.checkPair(entity, otherEntity);
              }
            });
            cell.push(entity);
          }
        } // end for y size
      } // end for x size
    }); // end for entities

    if (ig.system.debug) {
      ig.graph.endClock("checks");
    }
  }
}
