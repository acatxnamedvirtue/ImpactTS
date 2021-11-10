import { ig } from "../impact/impact";
import { WMConfig, wmConfig } from "./config";
import { wmModalDialog, wmModalDialogPathSelect } from "./modal-dialogs";
import { wmSelectFileDropdown } from "./select-file-dropdown";
import { wmEditEntities } from "./edit-entities";
import { wmUndo } from "./undo";
import { erase, limit } from "../impact/util";
import { wmEditMap } from "./edit-map";
import Cookies from "js-cookie";
import { igLoader } from "../impact/loader";
import { igEntity } from "../impact/entity";
import { igImage } from "../impact/image";
import { wmEventedInput } from "./evented-input";
import { igSystem } from "../impact/system";
import { igSound, igSoundManager } from "../impact/sound";
import { KEYS } from "../impact/input";
import { save } from "./api/save";
import * as fs from "fs";
import { entityMap } from "../jumpnrun/main";
import KeyDownEvent = JQuery.KeyDownEvent;
import { WMData } from "../impact/game";

type Wm = {
  config: WMConfig;
  editor: wmWeltmeister;
  entityMap: Record<string, any>;
};

// wm Namespace
export const wm: Wm = {
  config: wmConfig,
  editor: null,
  entityMap: entityMap,
};

export enum MODE {
  DRAW = 1,
  TILESELECT = 2,
  ENTITYSELECT = 4,
}

export class wmWeltmeister {
  static getMaxWidth(): number {
    return $(window).width();
  }

  static getMaxHeight(): number {
    return $(window).height() - $("#headerMenu").height();
  }

  mode: MODE = null;
  levelData: WMData = { entities: [], layer: [] };
  layers: wmEditMap[] = [];
  entities: wmEditEntities = null;
  activeLayer: wmEditMap | wmEditEntities = null;
  collisionLayer: wmEditMap = null;

  screen = { x: 0, y: 0 };
  _rscreen = { x: 0, y: 0 };
  mouseLast = { x: -1, y: -1 };

  tilesetSelectDialog: wmSelectFileDropdown = null;
  labelsStep = 32;

  collisionSolid = 1;

  loadDialog: wmModalDialogPathSelect = null;
  saveDialog: wmModalDialogPathSelect = null;
  loseChangesDialog: wmModalDialog = null;
  deleteLayerDialog: wmModalDialog = null;
  fileName = "untitled.json";
  filePath = wm.config.project.levelPath + "untitled.json";
  modified = false;
  needsDraw = true;

  undo: wmUndo = null;

  constructor() {
    ig.editor = this;

    ig.system.context.textBaseline = "top";
    ig.system.context.font = wm.config.labels.font;
    this.labelsStep = wm.config.labels.step;

    // Dialogs
    this.loadDialog = new wmModalDialogPathSelect("Load Level", "Load", "scripts");

    this.loadDialog.onOk = this.load.bind(this);
    this.loadDialog.setPath(wm.config.project.levelPath);
    $("#levelLoad").on("click", this.showLoadDialog.bind(this));
    $("#levelNew").on("click", this.showNewDialog.bind(this));

    this.saveDialog = new wmModalDialogPathSelect("Save Level", "Save", "scripts");
    this.saveDialog.onOk = this.save.bind(this);
    this.saveDialog.setPath(wm.config.project.levelPath);
    $("#levelSaveAs").on("click", this.saveDialog.open.bind(this.saveDialog));
    $("#levelSave").on("click", this.saveQuick.bind(this));

    this.loseChangesDialog = new wmModalDialog("Lose all changes?");

    this.deleteLayerDialog = new wmModalDialog("Delete Layer? NO UNDO!");
    this.deleteLayerDialog.onOk = this.removeLayer.bind(this);

    this.mode = MODE.DRAW;

    this.tilesetSelectDialog = new wmSelectFileDropdown("#layerTileset", "images");
    this.entities = new wmEditEntities($("#layerEntities"));

    const layers = $("#layers");

    layers.sortable({
      update: this.reorderLayers.bind(this),
    });

    layers.disableSelection();
    this.resetModified();

    // Events/Input
    if (wm.config.touchScroll) {
      // Setup wheel event
      ig.system.canvas.addEventListener("wheel", this.touchScroll.bind(this), false);

      // Unset WHEEL_* binds
      delete wm.config.binds["WHEEL_UP"];
      delete wm.config.binds["WHEEL_DOWN"];
    }

    for (const key in wm.config.binds) {
      ig.input.bind(KEYS[key as keyof typeof KEYS], wm.config.binds[key as keyof typeof wm.config.binds]);
    }
    (ig.input as wmEventedInput).keydownCallback = this.keydown.bind(this);
    (ig.input as wmEventedInput).keyupCallback = this.keyup.bind(this);
    (ig.input as wmEventedInput).mousemoveCallback = this.mousemove.bind(this);

    $(window).on("resize", this.resize.bind(this));
    $(window).on("keydown", this.uikeydown.bind(this));
    $(window).on("beforeunload", this.confirmClose.bind(this));

    $("#buttonAddLayer").on("click", this.addLayer.bind(this));
    $("#buttonRemoveLayer").on("click", this.deleteLayerDialog.open.bind(this.deleteLayerDialog));
    $("#buttonSaveLayerSettings").on("click", this.saveLayerSettings.bind(this));
    $("#reloadImages").on("click", igImage.reloadCache);
    $("#layerIsCollision").on("change", this.toggleCollisionLayer.bind(this));

    $("input#toggleSidebar").on("click", () => {
      $("div#menu").slideToggle("fast");
      $("input#toggleSidebar").toggleClass("active");
    });

    // Always unfocus current input field when clicking the canvas
    $("#canvas").on("mousedown", () => {
      $("input:focus").trigger("blur");
    });

    this.undo = new wmUndo(wm.config.undoLevels);

    if (wm.config.loadLastLevel) {
      const path = Cookies.get("wmLastLevel");
      if (path) {
        this.load(null, path);
      }
    }

    ig.setAnimation(this.drawIfNeeded.bind(this));
  }

  uikeydown(event: KeyDownEvent): void {
    if (event.target.type == "text") {
      return;
    }

    // event.which was eventually un-deprecated
    // https://github.com/jquery/jquery/issues/4755
    const key = String.fromCharCode(event.which);
    if (key.match(/^\d$/)) {
      const index = parseInt(key);
      const name = $("#layers div.layer:nth-child(" + index + ") span.name").text();

      const layer = name == "entities" ? this.entities : this.getLayerWithName(name);

      if (layer) {
        if (event.shiftKey) {
          layer.toggleVisibility();
        } else {
          this.setActiveLayer(layer.name);
        }
      }
    }
  }

  showLoadDialog(): void {
    if (this.modified) {
      this.loseChangesDialog.onOk = this.loadDialog.open.bind(this.loadDialog);
      this.loseChangesDialog.open();
    } else {
      this.loadDialog.open();
    }
  }

  showNewDialog(): void {
    if (this.modified) {
      this.loseChangesDialog.onOk = this.loadNew.bind(this);
      this.loseChangesDialog.open();
    } else {
      this.loadNew();
    }
  }

  setModified(): void {
    if (!this.modified) {
      this.modified = true;
      this.setWindowTitle();
    }
  }

  resetModified(): void {
    this.modified = false;
    this.setWindowTitle();
  }

  setWindowTitle(): void {
    document.title = this.fileName + (this.modified ? " * " : " - ") + "Weltmeister";
    $("span.headerTitle").text(this.fileName);
    $("span.unsavedTitle").text(this.modified ? "*" : "");
  }

  confirmClose(event: BeforeUnloadEvent): string {
    let rv = "";
    if (this.modified && wm.config.askBeforeClose) {
      rv = "There are some unsaved changes. Leave anyway?";
    }
    event.returnValue = rv;
    return rv;
  }

  resize(): void {
    ig.system.resize(
      Math.floor(wmWeltmeister.getMaxWidth() / wm.config.view.zoom),
      Math.floor(wmWeltmeister.getMaxHeight() / wm.config.view.zoom),
      wm.config.view.zoom
    );
    ig.system.context.textBaseline = "top";
    ig.system.context.font = wm.config.labels.font;
    this.draw();
  }

  scroll(x: number, y: number): void {
    this.screen.x -= x;
    this.screen.y -= y;

    this._rscreen.x = Math.round(this.screen.x * ig.system.scale) / ig.system.scale;
    this._rscreen.y = Math.round(this.screen.y * ig.system.scale) / ig.system.scale;
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].setScreenPos(this.screen.x, this.screen.y);
    }
  }

  drag(): void {
    const dx = ig.input.mouse.x - this.mouseLast.x,
      dy = ig.input.mouse.y - this.mouseLast.y;
    this.scroll(dx, dy);
  }

  touchScroll(event: WheelEvent): boolean {
    event.preventDefault();

    this.scroll(-event.deltaX / ig.system.scale, -event.deltaY / ig.system.scale);
    this.draw();
    return false;
  }

  zoom(delta: number): void {
    let z = wm.config.view.zoom;
    const mx = ig.input.mouse.x * z,
      my = ig.input.mouse.y * z;

    if (z <= 1) {
      if (delta < 0) {
        z /= 2;
      } else {
        z *= 2;
      }
    } else {
      z += delta;
    }

    wm.config.view.zoom = limit(z, wm.config.view.zoomMin, wm.config.view.zoomMax);
    wm.config.labels.step = Math.round(this.labelsStep / wm.config.view.zoom);
    $("#zoomIndicator")
      .text(wm.config.view.zoom + "x")
      .stop(true, true)
      .show()
      .delay(300)
      .fadeOut(0);

    // Adjust mouse pos and screen coordinates
    ig.input.mouse.x = mx / wm.config.view.zoom;
    ig.input.mouse.y = my / wm.config.view.zoom;
    this.drag();

    for (const i in igImage.cache) {
      igImage.cache[i].wmResize(wm.config.view.zoom);
    }

    this.resize();
  }

  // -------------------------------------------------------------------------
  // Loading

  loadNew(): void {
    Cookies.set("wmLastLevel", null);
    while (this.layers.length) {
      this.layers[0].destroy();
      this.layers.splice(0, 1);
    }
    this.screen = { x: 0, y: 0 };
    this.entities.clear();
    this.fileName = "untitled.json";
    this.filePath = wm.config.project.levelPath + "untitled.json";
    this.levelData = { entities: [], layer: [] };
    this.saveDialog.setPath(this.filePath);
    this.resetModified();
    this.draw();
  }

  load(dialog: wmModalDialog, path: string): void {
    const file = fs.readFileSync(path, "utf-8");
    const fileJSON: WMData = JSON.parse(file);
    this.filePath = path;
    this.saveDialog.setPath(path);
    this.fileName = path.replace(/^.*\//, "");
    this.loadResponse(fileJSON);
  }

  loadResponse(data: WMData): void {
    Cookies.set("wmLastLevel", this.filePath);

    this.levelData = data;

    while (this.layers.length) {
      this.layers[0].destroy();
      this.layers.splice(0, 1);
    }
    this.screen = { x: 0, y: 0 };
    this.entities.clear();

    for (let i = 0; i < data.entities.length; i++) {
      const ent = data.entities[i];
      const EntityClass = wm.entityMap[ent.type];
      this.entities.spawnEntity(EntityClass, ent.x, ent.y, ent.settings, ent.type);
    }

    for (let i = 0; i < data.layer.length; i++) {
      const ld = data.layer[i];
      const newLayer = new wmEditMap(ld.name, ld.tilesize, ld.tilesetName, !!ld.foreground);
      newLayer.resize(ld.width, ld.height);
      newLayer.linkWithCollision = ld.linkWithCollision;
      newLayer.repeat = ld.repeat;
      newLayer.preRender = !!ld.preRender;
      newLayer.distance = ld.distance;
      newLayer.visible = !ld.visible;
      newLayer.data = ld.data;
      newLayer.toggleVisibility();
      this.layers.push(newLayer);

      if (ld.name == "collision") {
        this.collisionLayer = newLayer;
      }

      this.setActiveLayer(ld.name);
    }

    this.setActiveLayer("entities");

    this.reorderLayers();
    $("#layers").sortable("refresh");

    this.resetModified();
    this.undo.clear();
    this.draw();
  }

  // -------------------------------------------------------------------------
  // Saving

  saveQuick(): void {
    if (this.fileName == "untitled.json") {
      this.saveDialog.open();
    } else {
      this.save(null, this.filePath);
    }
  }

  save(dialog: wmModalDialog, path: string): void {
    if (!path.match(/\.json$/)) {
      path += ".json";
    }

    this.filePath = path;
    this.fileName = path.replace(/^.*\//, "");
    const data = this.levelData;
    data.entities = this.entities.getSaveData();
    data.layer = [];

    const resources = [];
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      data.layer.push(layer.getSaveData());
      if (layer.name != "collision") {
        resources.push(layer.tiles.path);
      }
    }

    const dataString = JSON.stringify(data);

    const saveSuccess = save(path, dataString);

    this.saveResponse(saveSuccess);
  }

  saveResponse(success: boolean): void {
    if (success) {
      this.resetModified();
      Cookies.set("wmLastLevel", this.filePath);
    }
  }

  // -------------------------------------------------------------------------
  // Layers

  addLayer(): void {
    const name = "new_layer_" + this.layers.length;
    const newLayer = new wmEditMap(name, wm.config.layerDefaults.tilesize, "", false);
    newLayer.resize(wm.config.layerDefaults.width, wm.config.layerDefaults.height);
    newLayer.setScreenPos(this.screen.x, this.screen.y);
    this.layers.push(newLayer);
    this.setActiveLayer(name);
    this.updateLayerSettings();

    this.reorderLayers();

    $("#layers").sortable("refresh");
  }

  removeLayer(): boolean {
    const activeLayer = this.activeLayer as wmEditMap;
    const name = activeLayer.name;
    if (name == "entities") {
      return false;
    }
    activeLayer.destroy();
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name == name) {
        this.layers.splice(i, 1);
        this.reorderLayers();
        $("#layers").sortable("refresh");
        this.setActiveLayer("entities");
        return true;
      }
    }
    return false;
  }

  getLayerWithName(name: string): wmEditMap {
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name == name) {
        return this.layers[i];
      }
    }
    return null;
  }

  reorderLayers(): void {
    const newLayers: wmEditMap[] = [];
    let isForegroundLayer = true;
    $("#layers div.layer span.name").each(
      function (newIndex: number, span: HTMLSpanElement) {
        const name = $(span).text();

        const layer = name == "entities" ? this.entities : this.getLayerWithName(name);

        if (layer) {
          layer.setHotkey(newIndex + 1);
          if (layer.name == "entities") {
            // All layers after the entity layer are not foreground
            // layers
            isForegroundLayer = false;
          } else {
            layer.foreground = isForegroundLayer;
            newLayers.unshift(layer);
          }
        }
      }.bind(this)
    );
    this.layers = newLayers;
    this.setModified();
    this.draw();
  }

  updateLayerSettings(): void {
    const activeLayer = this.activeLayer as wmEditMap;
    $("#layerName").val(activeLayer.name);
    $("#layerTileset").val(activeLayer.tilesetName);
    $("#layerTilesize").val(activeLayer.tilesize);
    $("#layerWidth").val(activeLayer.width);
    $("#layerHeight").val(activeLayer.height);
    $("#layerPreRender").prop("checked", activeLayer.preRender);
    $("#layerRepeat").prop("checked", activeLayer.repeat);
    $("#layerLinkWithCollision").prop("checked", activeLayer.linkWithCollision);
    $("#layerDistance").val(activeLayer.distance);
  }

  saveLayerSettings(): void {
    const activeLayer = this.activeLayer as wmEditMap;
    const isCollision = $("#layerIsCollision").prop("checked");

    let newName = $("#layerName").val() as string;
    const newWidth = Math.floor($("#layerWidth").val() as number);
    const newHeight = Math.floor($("#layerHeight").val() as number);

    if (newWidth != activeLayer.width || newHeight != activeLayer.height) {
      activeLayer.resize(newWidth, newHeight);
    }
    activeLayer.tilesize = Math.floor($("#layerTilesize").val() as number);

    if (isCollision) {
      newName = "collision";
      activeLayer.linkWithCollision = false;
      activeLayer.distance = 1;
      activeLayer.repeat = false;
      activeLayer.setCollisionTileset();
    } else {
      const newTilesetName = $("#layerTileset").val() as string;
      if (newTilesetName != activeLayer.tilesetName) {
        activeLayer.setTileset(newTilesetName);
      }
      activeLayer.linkWithCollision = $("#layerLinkWithCollision").prop("checked");
      activeLayer.distance = parseFloat($("#layerDistance").val() as string);
      activeLayer.repeat = $("#layerRepeat").prop("checked");
      activeLayer.preRender = $("#layerPreRender").prop("checked");
    }

    if (newName == "collision") {
      // is collision layer
      this.collisionLayer = this.activeLayer as wmEditMap;
    } else if (this.activeLayer.name == "collision") {
      // was collision layer, but is no more
      this.collisionLayer = null;
    }

    activeLayer.setName(newName);
    this.setModified();
    this.draw();
  }

  setActiveLayer(name: string): void {
    const previousLayer = this.activeLayer;
    this.activeLayer = name == "entities" ? this.entities : this.getLayerWithName(name);
    if (previousLayer == this.activeLayer) {
      return; // nothing to do here
    }

    if (previousLayer) {
      previousLayer.setActive(false);
    }
    this.activeLayer.setActive(true);
    this.mode = MODE.DRAW;

    $("#layerIsCollision").prop("checked", name == "collision");

    if (name == "entities") {
      $("#layerSettings").fadeOut(100);
    } else {
      this.entities.selectEntity(null);
      this.toggleCollisionLayer();
      $("#layerSettings").fadeOut(100, this.updateLayerSettings.bind(this)).fadeIn(100);
    }
    this.draw();
  }

  toggleCollisionLayer(): void {
    const isCollision = $("#layerIsCollision").prop("checked");
    $("#layerLinkWithCollision,#layerDistance,#layerPreRender,#layerRepeat,#layerName,#layerTileset").attr(
      "disabled",
      isCollision
    );
  }

  // -------------------------------------------------------------------------
  // Update

  mousemove(): void {
    if (!this.activeLayer) {
      return;
    }

    if (this.mode == MODE.DRAW) {
      // scroll map
      if (ig.input.state("drag")) {
        this.drag();
      } else if (ig.input.state("draw")) {
        // move/scale entity
        if (this.activeLayer == this.entities) {
          const x = ig.input.mouse.x + this.screen.x;
          const y = ig.input.mouse.y + this.screen.y;
          this.entities.dragOnSelectedEntity(x, y);
          this.setModified();
        }

        // draw on map
        else if (!(this.activeLayer as wmEditMap).isSelecting) {
          this.setTileOnCurrentLayer();
        }
      } else if (this.activeLayer == this.entities) {
        const x = ig.input.mouse.x + this.screen.x;
        const y = ig.input.mouse.y + this.screen.y;
        this.entities.mousemove(x, y);
      }
    }

    this.mouseLast = { x: ig.input.mouse.x, y: ig.input.mouse.y };
    this.draw();
  }

  keydown(action: string): void {
    if (!this.activeLayer) {
      return;
    }

    if (action == "draw") {
      if (this.mode == MODE.DRAW) {
        // select entity
        if (this.activeLayer == this.entities) {
          const x = ig.input.mouse.x + this.screen.x;
          const y = ig.input.mouse.y + this.screen.y;
          const entity = this.entities.selectEntityAt(x, y);
          if (entity) {
            this.undo.beginEntityEdit(entity);
          }
        } else {
          const activeLayer = this.activeLayer as wmEditMap;
          if (ig.input.state("select")) {
            activeLayer.beginSelecting(ig.input.mouse.x, ig.input.mouse.y);
          } else {
            this.undo.beginMapDraw();
            activeLayer.beginEditing();
            if (activeLayer.linkWithCollision && this.collisionLayer && this.collisionLayer != this.activeLayer) {
              this.collisionLayer.beginEditing();
            }
            this.setTileOnCurrentLayer();
          }
        }
      } else if (this.mode == MODE.TILESELECT && ig.input.state("select")) {
        (this.activeLayer as wmEditMap).tileSelect.beginSelecting(ig.input.mouse.x, ig.input.mouse.y);
      }
    }

    this.draw();
  }

  keyup(action: string): void {
    if (!this.activeLayer) {
      return;
    }

    if (action == "delete") {
      this.entities.deleteSelectedEntity();
      this.setModified();
    } else if (action == "clone") {
      this.entities.cloneSelectedEntity();
      this.setModified();
    } else if (action == "grid") {
      wm.config.view.grid = !wm.config.view.grid;
    } else if (action == "menu") {
      if (this.mode != MODE.TILESELECT && this.mode != MODE.ENTITYSELECT) {
        if (this.activeLayer == this.entities) {
          this.mode = MODE.ENTITYSELECT;
          this.entities.showMenu(ig.input.mouse.x, ig.input.mouse.y);
        } else {
          this.mode = MODE.TILESELECT;
          (this.activeLayer as wmEditMap).tileSelect.setPosition(ig.input.mouse.x, ig.input.mouse.y);
        }
      } else {
        this.mode = MODE.DRAW;
        this.entities.hideMenu();
      }
    } else if (action === "zoomin") {
      this.zoom(1);
    } else if (action === "zoomout") {
      this.zoom(-1);
    }

    if (action == "draw") {
      const activeLayer = this.activeLayer as wmEditMap;
      // select tile
      if (this.mode == MODE.TILESELECT) {
        activeLayer.brush = activeLayer.tileSelect.endSelecting(ig.input.mouse.x, ig.input.mouse.y);
        this.mode = MODE.DRAW;
      } else if (this.activeLayer == this.entities) {
        this.undo.endEntityEdit();
      } else {
        if (activeLayer.isSelecting) {
          activeLayer.brush = activeLayer.endSelecting(ig.input.mouse.x, ig.input.mouse.y);
        } else {
          this.undo.endMapDraw();
        }
      }
    }

    if (action == "undo") {
      this.undo.undo();
    }

    if (action == "redo") {
      this.undo.redo();
    }

    this.draw();
    this.mouseLast = { x: ig.input.mouse.x, y: ig.input.mouse.y };
  }

  setTileOnCurrentLayer(): void {
    const activeLayer = this.activeLayer as wmEditMap;
    if (!activeLayer || !activeLayer.scroll) {
      return;
    }

    const co = activeLayer.getCursorOffset();
    const x = ig.input.mouse.x + activeLayer.scroll.x - co.x;
    const y = ig.input.mouse.y + activeLayer.scroll.y - co.y;

    const brush = activeLayer.brush;
    for (let by = 0; by < brush.length; by++) {
      const brushRow = brush[by];
      for (let bx = 0; bx < brushRow.length; bx++) {
        const mapx = x + bx * activeLayer.tilesize;
        const mapy = y + by * activeLayer.tilesize;

        const newTile = brushRow[bx];
        const oldTile = activeLayer.getOldTile(mapx, mapy);

        activeLayer.setTile(mapx, mapy, newTile);
        this.undo.pushMapDraw(activeLayer, mapx, mapy, oldTile, newTile);

        if (activeLayer.linkWithCollision && this.collisionLayer && this.collisionLayer != activeLayer) {
          const collisionLayerTile = newTile > 0 ? this.collisionSolid : 0;

          const oldCollisionTile = this.collisionLayer.getOldTile(mapx, mapy);
          this.collisionLayer.setTile(mapx, mapy, collisionLayerTile);
          this.undo.pushMapDraw(this.collisionLayer, mapx, mapy, oldCollisionTile, collisionLayerTile);
        }
      }
    }

    this.setModified();
  }

  // -------------------------------------------------------------------------
  // Drawing

  draw(): void {
    // The actual drawing loop is scheduled via ig.setAnimation() already.
    // We just set a flag to indicate that a redraw is needed.
    this.needsDraw = true;
  }

  drawIfNeeded(): void {
    // Only draw if flag is set
    if (!this.needsDraw) {
      return;
    }
    this.needsDraw = false;

    ig.system.clear(wm.config.colors.clear);

    let entitiesDrawn = false;
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];

      // This layer is a foreground layer? -> Draw entities first!
      if (!entitiesDrawn && layer.foreground) {
        entitiesDrawn = true;
        this.entities.draw();
      }
      layer.draw();
    }

    if (!entitiesDrawn) {
      this.entities.draw();
    }

    if (this.activeLayer) {
      if (this.mode == MODE.TILESELECT) {
        const activeLayer = this.activeLayer as wmEditMap;
        activeLayer.tileSelect.draw();
        activeLayer.tileSelect.drawCursor(ig.input.mouse.x, ig.input.mouse.y);
      }

      if (this.mode == MODE.DRAW) {
        this.activeLayer.drawCursor(ig.input.mouse.x, ig.input.mouse.y);
      }
    }

    if (wm.config.labels.draw) {
      this.drawLabels(wm.config.labels.step);
    }
  }

  drawLabels(step: number): void {
    ig.system.context.fillStyle = wm.config.colors.primary;
    let xlabel = this.screen.x - (this.screen.x % step) - step;
    for (let tx = Math.floor(-this.screen.x % step); tx < ig.system.width; tx += step) {
      xlabel += step;
      ig.system.context.fillText(xlabel.toString(10), tx * ig.system.scale, 0);
    }

    let ylabel = this.screen.y - (this.screen.y % step) - step;
    for (let ty = Math.floor(-this.screen.y % step); ty < ig.system.height; ty += step) {
      ylabel += step;
      ig.system.context.fillText(ylabel.toString(10), 0, ty * ig.system.scale);
    }
  }

  getEntityByName(name: string): igEntity {
    return this.entities.getEntityByName(name);
  }
}

// Create a custom loader, to skip sound files and the run loop creation
export class wmLoader extends igLoader {
  override end(): void {
    if (this.done) {
      return;
    }

    clearInterval(this._intervalId);
    this.done = true;
    ig.system.clear(wm.config.colors.clear);
    ig.game = new this.gameClass();
  }

  override loadResource(res: igImage | igSound): void {
    if (res instanceof igSound) {
      erase(this._unloaded, res.path);
    } else {
      super.loadResource(res);
    }
  }
}

export function main(): void {
  ig.system = new igSystem(
    "#canvas",
    1,
    Math.floor(wmWeltmeister.getMaxWidth() / wm.config.view.zoom),
    Math.floor(wmWeltmeister.getMaxHeight() / wm.config.view.zoom),
    wm.config.view.zoom,
    false
  );

  ig.input = new wmEventedInput();
  ig.soundManager = new igSoundManager();
  ig.ready = true;

  const loader = new wmLoader(wmWeltmeister, ig.resources);

  loader.load();
}
