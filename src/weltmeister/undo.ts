import { igEntity } from "../impact/entity";
import { ig } from "../impact/impact";
import { wmEditMap } from "./edit-map";

enum WMUndo {
  MAP_DRAW = 1,
  ENTITY_EDIT = 2,
  ENTITY_CREATE = 3,
  ENTITY_DELETE = 4,
}

type Changes = {
  layer: wmEditMap;
  x: number;
  y: number;
  old: number;
  current: number;
};

type Action = {
  type: WMUndo;
  time: number;
  changes?: Changes[];
  entity?: igEntity;
  activeLayer?: string;
  old?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  current?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

export class wmUndo {
  levels: number;
  chain: Action[] = [];
  rpos = 0;
  currentAction: Action = null;

  constructor(levels = 10) {
    this.levels = levels;
  }

  clear(): void {
    this.chain = [];
    this.currentAction = null;
  }

  commit(action: Action): void {
    if (this.rpos) {
      this.chain.splice(this.chain.length - this.rpos, this.rpos);
      this.rpos = 0;
    }
    action.activeLayer = ig.editor.activeLayer ? ig.editor.activeLayer.name : "";
    this.chain.push(action);
    if (this.chain.length > this.levels) {
      this.chain.shift();
    }
  }

  undo(): void {
    const action = this.chain[this.chain.length - this.rpos - 1];
    if (!action) {
      return;
    }
    this.rpos++;

    ig.editor.setActiveLayer(action.activeLayer);

    if (action.type == WMUndo.MAP_DRAW) {
      for (let i = 0; i < action.changes.length; i++) {
        const change = action.changes[i];
        change.layer.setTile(change.x, change.y, change.old);
      }
    } else if (action.type == WMUndo.ENTITY_EDIT) {
      action.entity.pos.x = action.old.x;
      action.entity.pos.y = action.old.y;
      action.entity.size.x = action.old.w;
      action.entity.size.y = action.old.h;
      ig.editor.entities.selectEntity(action.entity);
      ig.editor.entities.loadEntitySettings();
    } else if (action.type == WMUndo.ENTITY_CREATE) {
      ig.editor.entities.removeEntity(action.entity);
      ig.editor.entities.selectEntity(null);
    } else if (action.type == WMUndo.ENTITY_DELETE) {
      ig.editor.entities.entities.push(action.entity);
      if (action.entity.name) {
        ig.editor.entities.namedEntities[action.entity.name] = action.entity;
      }
      ig.editor.entities.selectEntity(action.entity);
    }

    ig.editor.setModified();
  }

  redo(): void {
    if (!this.rpos) {
      return;
    }

    const action = this.chain[this.chain.length - this.rpos];
    if (!action) {
      return;
    }
    this.rpos--;

    ig.editor.setActiveLayer(action.activeLayer);

    if (action.type == WMUndo.MAP_DRAW) {
      for (let i = 0; i < action.changes.length; i++) {
        const change = action.changes[i];
        change.layer.setTile(change.x, change.y, change.current);
      }
    } else if (action.type == WMUndo.ENTITY_EDIT) {
      action.entity.pos.x = action.current.x;
      action.entity.pos.y = action.current.y;
      action.entity.size.x = action.current.w;
      action.entity.size.y = action.current.h;
      ig.editor.entities.selectEntity(action.entity);
      ig.editor.entities.loadEntitySettings();
    } else if (action.type == WMUndo.ENTITY_CREATE) {
      ig.editor.entities.entities.push(action.entity);
      if (action.entity.name) {
        ig.editor.entities.namedEntities[action.entity.name] = action.entity;
      }
      ig.editor.entities.selectEntity(action.entity);
    } else if (action.type == WMUndo.ENTITY_DELETE) {
      ig.editor.entities.removeEntity(action.entity);
      ig.editor.entities.selectEntity(null);
    }

    ig.editor.setModified();
  }

  // -------------------------------------------------------------------------
  // Map changes

  beginMapDraw(): void {
    this.currentAction = {
      type: WMUndo.MAP_DRAW,
      time: Date.now(),
      changes: [],
    };
  }

  pushMapDraw(layer: wmEditMap, x: number, y: number, oldTile: number, currentTile: number): void {
    if (!this.currentAction) {
      return;
    }

    this.currentAction.changes.push({
      layer: layer,
      x: x,
      y: y,
      old: oldTile,
      current: currentTile,
    });
  }

  endMapDraw(): void {
    if (!this.currentAction || !this.currentAction.changes.length) {
      return;
    }

    this.commit(this.currentAction);
    this.currentAction = null;
  }

  // -------------------------------------------------------------------------
  // Entity changes

  beginEntityEdit(entity: igEntity): void {
    this.currentAction = {
      type: WMUndo.ENTITY_EDIT,
      time: Date.now(),
      entity: entity,
      old: {
        x: entity.pos.x,
        y: entity.pos.y,
        w: entity.size.x,
        h: entity.size.y,
      },
      current: {
        x: entity.pos.x,
        y: entity.pos.y,
        w: entity.size.x,
        h: entity.size.y,
      },
    };
  }

  pushEntityEdit(entity: igEntity): void {
    if (!this.currentAction) {
      return;
    }

    this.currentAction.current = {
      x: entity.pos.x,
      y: entity.pos.y,
      w: entity.size.x,
      h: entity.size.y,
    };
  }

  endEntityEdit(): void {
    const a = this.currentAction;

    if (!a || (a.old.x == a.current.x && a.old.y == a.current.y && a.old.w == a.current.w && a.old.h == a.current.h)) {
      return;
    }

    this.commit(this.currentAction);
    this.currentAction = null;
  }

  commitEntityCreate(entity: igEntity): void {
    this.commit({
      type: WMUndo.ENTITY_CREATE,
      time: Date.now(),
      entity: entity,
    });
  }

  commitEntityDelete(entity: igEntity): void {
    this.commit({
      type: WMUndo.ENTITY_DELETE,
      time: Date.now(),
      entity: entity,
    });
  }
}
