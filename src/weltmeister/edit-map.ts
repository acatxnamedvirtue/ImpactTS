import { igBackgroundMap } from "../impact/background-map";
import { wmTileSelect } from "./tile-select";
import { ig } from "../impact/impact";
import { wm } from "./weltmeister";
import { toInt } from "../impact/util";
import { igImage } from "../impact/image";

export class wmEditMap extends igBackgroundMap {
  name = "";
  visible = true;
  active = true;
  linkWithCollision = false;

  div: JQuery<HTMLDivElement> = null;
  brush = [[0]];
  oldData: number[][] = null;
  hotkey = -1;
  ignoreLastClick = false;
  tileSelect: wmTileSelect = null;

  isSelecting = false;
  selectionBegin: { x: number; y: number } = null;

  constructor(name: string, tilesize: number, tileset = "", foreground: boolean) {
    super({
      tilesize,
      tilesetName: tileset,
      foreground,
      name,
      repeat: false,
      preRender: false,
      data: [[]],
      distance: 1,
      width: 0,
      height: 0,
      linkWithCollision: false,
      visible: true,
    });

    this.div = $("<div/>", {
      class: "layer layerActive",
      id: "layer_" + name,
      mouseup: this.click.bind(this),
    });
    this.setName(name);
    if (this.foreground) {
      $("#layers").prepend(this.div);
    } else {
      $("#layerEntities").after(this.div);
    }

    this.tileSelect = new wmTileSelect(this);
  }

  getSaveData(): {
    visible: boolean;
    distance: number;
    data: number[][];
    preRender: boolean;
    repeat: boolean;
    name: string;
    width: number;
    tilesize: number;
    linkWithCollision: boolean;
    foreground: boolean;
    tilesetName: string;
    height: number;
  } {
    return {
      name: this.name,
      width: this.width,
      height: this.height,
      linkWithCollision: this.linkWithCollision,
      visible: this.visible,
      tilesetName: this.tilesetName,
      repeat: this.repeat,
      preRender: this.preRender,
      distance: this.distance,
      tilesize: this.tilesize,
      foreground: this.foreground,
      data: this.data,
    };
  }

  resize(newWidth: number, newHeight: number): void {
    const newData = new Array(newHeight);
    for (let y = 0; y < newHeight; y++) {
      newData[y] = new Array(newWidth);
      for (let x = 0; x < newWidth; x++) {
        newData[y][x] = x < this.width && y < this.height ? this.data[y][x] : 0;
      }
    }
    this.data = newData;
    this.width = newWidth;
    this.height = newHeight;

    this.resetDiv();
  }

  beginEditing(): void {
    this.oldData = ig.copy(this.data);
  }

  getOldTile(x: number, y: number): number {
    const tx = Math.floor(x / this.tilesize);
    const ty = Math.floor(y / this.tilesize);
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      return this.oldData[ty][tx];
    } else {
      return 0;
    }
  }

  override setTileset(tileset: igImage | string): void {
    if (this.name == "collision") {
      this.setCollisionTileset();
    } else {
      super.setTileset(tileset);
    }
  }

  setCollisionTileset(): void {
    const path = wm.config.collisionTiles.path;
    const scale = this.tilesize / wm.config.collisionTiles.tilesize;
    this.tiles = new igAutoResizedImage(path, scale);
  }

  // -------------------------------------------------------------------------
  // UI

  setHotkey(hotkey: number): void {
    this.hotkey = hotkey;
    this.setName(this.name);
  }

  setName(name: string): void {
    this.name = name.replace(/[^0-9a-zA-Z]/g, "_");
    this.resetDiv();
  }

  resetDiv(): void {
    const visClass = this.visible ? " checkedVis" : "";
    this.div.html(
      '<span class="visible' +
        visClass +
        '" title="Toggle Visibility (Shift+' +
        this.hotkey +
        ')"></span>' +
        '<span class="name">' +
        this.name +
        "</span>" +
        '<span class="size"> (' +
        this.width +
        "x" +
        this.height +
        ")</span>"
    );
    this.div.attr("title", "Select Layer (" + this.hotkey + ")");
    this.div.children(".visible").bind("mousedown", this.toggleVisibilityClick.bind(this));
  }

  setActive(active: boolean): void {
    this.active = active;
    if (active) {
      this.div.addClass("layerActive");
    } else {
      this.div.removeClass("layerActive");
    }
  }

  toggleVisibility(): void {
    this.visible = !this.visible;
    this.resetDiv();
    if (this.visible) {
      this.div.children(".visible").addClass("checkedVis");
    } else {
      this.div.children(".visible").removeClass("checkedVis");
    }
    ig.game.draw();
  }

  toggleVisibilityClick(): void {
    if (!this.active) {
      this.ignoreLastClick = true;
    }
    this.toggleVisibility();
  }

  click(): void {
    if (this.ignoreLastClick) {
      this.ignoreLastClick = false;
      return;
    }
    ig.editor.setActiveLayer(this.name);
  }

  destroy(): void {
    this.div.remove();
  }

  // -------------------------------------------------------------------------
  // Selecting

  beginSelecting(x: number, y: number): void {
    this.isSelecting = true;
    this.selectionBegin = { x: x, y: y };
  }

  endSelecting(x: number, y: number): number[][] {
    const r = this.getSelectionRect(x, y);

    const brush = [];
    for (let ty = r.y; ty < r.y + r.h; ty++) {
      const row = [];
      for (let tx = r.x; tx < r.x + r.w; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
          row.push(0);
        } else {
          row.push(this.data[ty][tx]);
        }
      }
      brush.push(row);
    }
    this.isSelecting = false;
    this.selectionBegin = null;
    return brush;
  }

  getSelectionRect(x: number, y: number): { w: number; x: number; h: number; y: number } {
    const sx = this.selectionBegin ? this.selectionBegin.x : x,
      sy = this.selectionBegin ? this.selectionBegin.y : y;

    const txb = Math.floor((sx + this.scroll.x) / this.tilesize),
      tyb = Math.floor((sy + this.scroll.y) / this.tilesize),
      txe = Math.floor((x + this.scroll.x) / this.tilesize),
      tye = Math.floor((y + this.scroll.y) / this.tilesize);

    return {
      x: Math.min(txb, txe),
      y: Math.min(tyb, tye),
      w: Math.abs(txb - txe) + 1,
      h: Math.abs(tyb - tye) + 1,
    };
  }

  // -------------------------------------------------------------------------
  // Drawing

  draw(): void {
    // For performance reasons, repeated background maps are not drawn
    // when zoomed out
    if (this.visible && !(wm.config.view.zoom < 1 && this.repeat)) {
      this.drawTiled();
    }

    // Grid
    if (this.active && wm.config.view.grid) {
      let x = -ig.system.getDrawPos(this.scroll.x % this.tilesize) - 0.5;
      let y = -ig.system.getDrawPos(this.scroll.y % this.tilesize) - 0.5;
      const step = this.tilesize * ig.system.scale;

      ig.system.context.beginPath();
      for (x; x < ig.system.realWidth; x += step) {
        ig.system.context.moveTo(x, 0);
        ig.system.context.lineTo(x, ig.system.realHeight);
      }
      for (y; y < ig.system.realHeight; y += step) {
        ig.system.context.moveTo(0, y);
        ig.system.context.lineTo(ig.system.realWidth, y);
      }
      ig.system.context.strokeStyle = wm.config.colors.secondary;
      ig.system.context.stroke();
      ig.system.context.closePath();

      // Not calling beginPath() again has some weird performance issues
      // in Firefox 5. closePath has no effect. So to make it happy:
      ig.system.context.beginPath();
    }

    // Bounds
    if (this.active) {
      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.primary;
      ig.system.context.strokeRect(
        -ig.system.getDrawPos(this.scroll.x) - 0.5,
        -ig.system.getDrawPos(this.scroll.y) - 0.5,
        this.width * this.tilesize * ig.system.scale + 1,
        this.height * this.tilesize * ig.system.scale + 1
      );
    }
  }

  getCursorOffset(): { x: number; y: number } {
    const w = this.brush[0].length;
    const h = this.brush.length;

    //return {x:0, y:0};
    return {
      x: toInt(w / 2 - 0.5) * this.tilesize,
      y: toInt(h / 2 - 0.5) * this.tilesize,
    };
  }

  drawCursor(x: number, y: number): void {
    if (this.isSelecting) {
      const r = this.getSelectionRect(x, y);

      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.selection;
      ig.system.context.strokeRect(
        (r.x * this.tilesize - this.scroll.x) * ig.system.scale - 0.5,
        (r.y * this.tilesize - this.scroll.y) * ig.system.scale - 0.5,
        r.w * this.tilesize * ig.system.scale + 1,
        r.h * this.tilesize * ig.system.scale + 1
      );
    } else {
      const w = this.brush[0].length;
      const h = this.brush.length;

      const co = this.getCursorOffset();

      const cx = Math.floor((x + this.scroll.x) / this.tilesize) * this.tilesize - this.scroll.x - co.x;
      const cy = Math.floor((y + this.scroll.y) / this.tilesize) * this.tilesize - this.scroll.y - co.y;

      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.primary;
      ig.system.context.strokeRect(
        ig.system.getDrawPos(cx) - 0.5,
        ig.system.getDrawPos(cy) - 0.5,
        w * this.tilesize * ig.system.scale + 1,
        h * this.tilesize * ig.system.scale + 1
      );

      ig.system.context.globalAlpha = 0.5;
      for (let ty = 0; ty < h; ty++) {
        for (let tx = 0; tx < w; tx++) {
          const t = this.brush[ty][tx];
          if (t) {
            const px = cx + tx * this.tilesize;
            const py = cy + ty * this.tilesize;
            this.tiles.drawTile(px, py, t - 1, this.tilesize);
          }
        }
      }
      ig.system.context.globalAlpha = 1;
    }
  }
}

export class igAutoResizedImage extends igImage {
  internalScale = 1;

  constructor(path: string, internalScale: number) {
    super(path);
    this.internalScale = internalScale;
  }

  override onload(): void {
    this.width = Math.ceil(this.data.width * this.internalScale);
    this.height = Math.ceil(this.data.height * this.internalScale);

    if (this.internalScale != 1) {
      const scaled = ig.$new("canvas") as HTMLCanvasElement;
      scaled.width = this.width;
      scaled.height = this.height;
      const scaledCtx = scaled.getContext("2d");

      scaledCtx.drawImage(this.data, 0, 0, this.data.width, this.data.height, 0, 0, this.width, this.height);
      this.data = scaled;
    }

    this.loaded = true;
    if (ig.system.scale != 1) {
      this.wmResize(ig.system.scale);
    }

    if (this.loadCallback) {
      this.loadCallback(this.path, true);
    }
  }
}
