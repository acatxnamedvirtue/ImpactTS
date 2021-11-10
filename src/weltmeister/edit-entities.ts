import { MODE, wm } from "./weltmeister";
import { ig } from "../impact/impact";
import { igGame } from "../impact/game";
import { igEntity } from "../impact/entity";
import { erase } from "../impact/util";
import { entityMap } from "../jumpnrun/main";
import ClickEvent = JQuery.ClickEvent;

interface Selectable {
  size: { x: number; y: number };
  pos: { x: number; y: number };
  offset: { x: number; y: number };
}

export class wmEditEntities {
  visible = true;
  active = true;

  div: JQuery<HTMLDivElement>;
  hotkey = -1;
  ignoreLastClick = false;
  name = "entities";

  entities: igEntity[] = [];
  namedEntities: Record<string, igEntity> = {};
  selectedEntity: igEntity = null;
  menu: JQuery<HTMLDivElement> = null;
  selector: Selectable = {
    size: { x: 2, y: 2 },
    pos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  };
  wasSelectedOnScaleBorder: boolean | string = false;
  gridSize = wm.config.entityGrid;
  entityDefinitions: JQuery<HTMLDivElement> = null;

  constructor(div: JQuery<HTMLDivElement>) {
    this.div = div;
    div.on("mouseup", this.click.bind(this));
    this.div.children(".visible").on("mousedown", this.toggleVisibilityClick.bind(this));

    this.menu = $("#entityMenu");
    this.importEntityClass();
    this.entityDefinitions = $("#entityDefinitions");

    $("#entityKey").on("keydown", function (ev) {
      // event.which was eventually un-deprecated
      // https://github.com/jquery/jquery/issues/4755
      if (ev.which == 13) {
        $("#entityValue").trigger("focus");
        return false;
      }
      return true;
    });
    $("#entityValue").on("keydown", this.setEntitySetting.bind(this));
  }

  clear(): void {
    this.entities = [];
    this.selectEntity(null);
  }

  sort(): void {
    this.entities.sort(igGame.SORT.Z_INDEX);
  }

  // -------------------------------------------------------------------------
  // Loading, Saving

  fileNameToClassName(name: string): string {
    let typeName = "-" + name.replace(/^.*\/|\.js/g, "");
    typeName = typeName.replace(/-(\w)/g, function (m, a) {
      return a.toUpperCase();
    });
    return "Entity" + typeName;
  }

  importEntityClass(): void {
    for (const entity in entityMap) {
      const entityName = entity.replace(/^Entity/, "");

      const entityClass = entityMap[entity as keyof typeof entityMap];

      // Ignore entities that have the _wmIgnore flag
      if (!entityClass._wmIgnore) {
        const a = $("<div/>", {
          id: entity,
          href: "#",
          html: entityName,
          mouseup: this.newEntityClick.bind(this),
        });
        this.menu.append(a);
      }
    }
  }

  getEntityByName(name: string): igEntity {
    return this.namedEntities[name];
  }

  getSaveData(): Record<string, any>[] {
    const ents = [];
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      const type = ent._wmClassName;
      const data: Record<string, any> = { type: type, x: ent.pos.x, y: ent.pos.y };

      let hasSettings = false;
      for (const p in ent._wmSettings) {
        hasSettings = true;
      }
      if (hasSettings) {
        data.settings = ent._wmSettings;
      }

      ents.push(data);
    }
    return ents;
  }

  // -------------------------------------------------------------------------
  // Selecting

  selectEntityAt(x: number, y: number): igEntity {
    this.selector.pos = { x: x, y: y };

    // Find all possible selections
    const possibleSelections = [];
    for (let i = 0; i < this.entities.length; i++) {
      if (this.entities[i].touches(this.selector)) {
        possibleSelections.push(this.entities[i]);
      }
    }

    // Nothing found? Early out.
    if (!possibleSelections.length) {
      this.selectEntity(null);
      return null;
    }

    // Find the 'next' selection
    const selectedIndex = possibleSelections.indexOf(this.selectedEntity);
    const nextSelection = (selectedIndex + 1) % possibleSelections.length;
    const ent = possibleSelections[nextSelection];

    // Select it!
    this.selector.offset = {
      x: x - ent.pos.x + ent.offset.x,
      y: y - ent.pos.y + ent.offset.y,
    };
    this.selectEntity(ent);
    this.wasSelectedOnScaleBorder = this.isOnScaleBorder(ent, this.selector);
    return ent;
  }

  selectEntity(entity: igEntity): void {
    const entitySettings = $("#entitySettings");
    const entityKey = $("#entityKey");
    const entityVal = $("#entityValue");
    if (entity && entity != this.selectedEntity) {
      this.selectedEntity = entity;
      entitySettings.fadeOut(
        100,
        function () {
          this.loadEntitySettings();
          $("#entitySettings").fadeIn(100);
        }.bind(this)
      );
    } else if (!entity) {
      entitySettings.fadeOut(100);
      entityKey.trigger("blur");
      entityVal.trigger("blur");
    }

    this.selectedEntity = entity;
    entityKey.val("");
    entityVal.val("");
  }

  // -------------------------------------------------------------------------
  // Creating, Deleting, Moving

  deleteSelectedEntity(): boolean {
    if (!this.selectedEntity) {
      return false;
    }

    ig.editor.undo.commitEntityDelete(this.selectedEntity);

    this.removeEntity(this.selectedEntity);
    this.selectEntity(null);
    return true;
  }

  removeEntity(ent: igEntity): void {
    if (ent.name) {
      delete this.namedEntities[ent.name];
    }
    erase(this.entities, ent);
  }

  cloneSelectedEntity(): boolean {
    if (!this.selectedEntity) {
      return false;
    }

    const className = this.selectedEntity._wmClassName;
    const EntityClass = wm.entityMap[className];
    const settings = ig.copy(this.selectedEntity._wmSettings);
    if (settings.name) {
      settings.name = settings.name + "_clone";
    }
    const x = this.selectedEntity.pos.x + this.gridSize;
    const y = this.selectedEntity.pos.y;
    const newEntity = this.spawnEntity(EntityClass, x, y, settings, className);
    newEntity._wmSettings = settings;
    this.selectEntity(newEntity);

    ig.editor.undo.commitEntityCreate(newEntity);

    return true;
  }

  dragOnSelectedEntity(x: number, y: number): boolean {
    if (!this.selectedEntity) {
      return false;
    }

    // scale or move?
    if (this.selectedEntity._wmScalable && this.wasSelectedOnScaleBorder) {
      this.scaleSelectedEntity(x, y);
    } else {
      this.moveSelectedEntity(x, y);
    }

    ig.editor.undo.pushEntityEdit(this.selectedEntity);
    return true;
  }

  moveSelectedEntity(x: number, y: number): void {
    x = Math.round((x - this.selector.offset.x) / this.gridSize) * this.gridSize + this.selectedEntity.offset.x;
    y = Math.round((y - this.selector.offset.y) / this.gridSize) * this.gridSize + this.selectedEntity.offset.y;

    // new position?
    if (this.selectedEntity.pos.x != x || this.selectedEntity.pos.y != y) {
      $("#entityDefinitionPosX").text(x);
      $("#entityDefinitionPosY").text(y);

      this.selectedEntity.pos.x = x;
      this.selectedEntity.pos.y = y;
    }
  }

  scaleSelectedEntity(x: number, y: number): void {
    let h;
    const scale = this.wasSelectedOnScaleBorder;

    let w = Math.round(x / this.gridSize) * this.gridSize - this.selectedEntity.pos.x;

    if (!this.selectedEntity._wmSettings.size) {
      this.selectedEntity._wmSettings.size = {};
    }

    if (scale == "n") {
      h = this.selectedEntity.pos.y - Math.round(y / this.gridSize) * this.gridSize;
      if (this.selectedEntity.size.y + h <= this.gridSize) {
        h = (this.selectedEntity.size.y - this.gridSize) * -1;
      }
      this.selectedEntity.size.y += h;
      this.selectedEntity.pos.y -= h;
    } else if (scale == "s") {
      h = Math.round(y / this.gridSize) * this.gridSize - this.selectedEntity.pos.y;
      this.selectedEntity.size.y = Math.max(this.gridSize, h);
    } else if (scale == "e") {
      w = Math.round(x / this.gridSize) * this.gridSize - this.selectedEntity.pos.x;
      this.selectedEntity.size.x = Math.max(this.gridSize, w);
    } else if (scale == "w") {
      w = this.selectedEntity.pos.x - Math.round(x / this.gridSize) * this.gridSize;
      if (this.selectedEntity.size.x + w <= this.gridSize) {
        w = (this.selectedEntity.size.x - this.gridSize) * -1;
      }
      this.selectedEntity.size.x += w;
      this.selectedEntity.pos.x -= w;
    }
    this.selectedEntity._wmSettings.size.x = this.selectedEntity.size.x;
    this.selectedEntity._wmSettings.size.y = this.selectedEntity.size.y;

    this.loadEntitySettings();
  }

  newEntityClick(ev: ClickEvent): void {
    this.hideMenu();
    const newEntity = this.spawnEntity(wm.entityMap[ev.target.id], 0, 0, {}, ev.target.id);
    this.selectEntity(newEntity);
    this.moveSelectedEntity(this.selector.pos.x, this.selector.pos.y);
    ig.editor.setModified();

    ig.editor.undo.commitEntityCreate(newEntity);
  }

  spawnEntity<E extends igEntity>(
    EntityClass: {
      new (x: number, y: number, settings: Record<string, any>): E;
    },
    x: number,
    y: number,
    settings: Record<string, any>,
    name: string
  ): igEntity {
    settings = settings || {};

    if (EntityClass) {
      const newEntity = new EntityClass(x, y, settings);
      newEntity._wmInEditor = true;
      newEntity._wmClassName = name;
      newEntity._wmSettings = {};
      for (const s in settings) {
        newEntity._wmSettings[s] = settings[s];
      }
      this.entities.push(newEntity);
      if (settings.name) {
        this.namedEntities[settings.name] = newEntity;
      }
      this.sort();
      return newEntity;
    }
    return null;
  }

  isOnScaleBorder(entity: igEntity, selector: Selectable): string | boolean {
    const border = 2;
    const w = selector.pos.x - entity.pos.x;
    const h = selector.pos.y - entity.pos.y;

    if (w < border) return "w";
    if (w > entity.size.x - border) return "e";

    if (h < border) return "n";
    if (h > entity.size.y - border) return "s";

    return false;
  }

  // -------------------------------------------------------------------------
  // Settings

  loadEntitySettings(): void {
    if (!this.selectedEntity) {
      return;
    }
    let html =
      '<div class="entityDefinition"><span class="key">x</span>:<span class="value" id="entityDefinitionPosX">' +
      this.selectedEntity.pos.x +
      "</span></div>" +
      '<div class="entityDefinition"><span class="key">y</span>:<span class="value" id="entityDefinitionPosY">' +
      this.selectedEntity.pos.y +
      "</span></div>";

    html += this.loadEntitySettingsRecursive(this.selectedEntity._wmSettings);
    this.entityDefinitions.html(html);

    const className = this.selectedEntity._wmClassName.replace(/^Entity/, "");
    $("#entityClass").text(className);

    $(".entityDefinition").on("mouseup", this.selectEntitySetting);
  }

  loadEntitySettingsRecursive(settings: any, path = ""): string {
    let html = "";
    for (const key in settings) {
      const value = settings[key];
      if (typeof value == "object") {
        html += this.loadEntitySettingsRecursive(value, path + key + ".");
      } else {
        html +=
          '<div class="entityDefinition"><span class="key">' +
          path +
          key +
          '</span>:<span class="value">' +
          value +
          "</span></div>";
      }
    }

    return html;
  }

  setEntitySetting(ev: KeyboardEvent): boolean {
    if (ev.which != 13) {
      return true;
    }
    const entityKey = $("#entityKey");
    const entityVal = $("#entityValue");
    const key = entityKey.val() as string;
    let value = entityVal.val();

    if (key == "name") {
      if (this.selectedEntity.name) {
        delete this.namedEntities[this.selectedEntity.name];
      }
      this.namedEntities[value as string] = this.selectedEntity;
    }

    if (key == "x") {
      this.selectedEntity.pos.x = Math.round(value as number);
    } else if (key == "y") {
      this.selectedEntity.pos.y = Math.round(value as number);
    } else {
      this.writeSettingAtPath(this.selectedEntity._wmSettings, key, value);
      ig.merge(this.selectedEntity, this.selectedEntity._wmSettings);
    }

    this.sort();

    ig.editor.setModified();
    ig.editor.draw();

    entityKey.val("");
    entityVal.val("");
    entityVal.trigger("blur");
    this.loadEntitySettings();

    entityKey.trigger("focus");
    return false;
  }

  writeSettingAtPath(root: any, path: string, value: any): void {
    const pathArr = path.split(".");
    let cur = root;
    for (let i = 0; i < pathArr.length; i++) {
      const n = pathArr[i];
      if (i < pathArr.length - 1 && typeof cur[n] != "object") {
        cur[n] = {};
      }

      if (i == pathArr.length - 1) {
        cur[n] = value;
      }
      cur = cur[n];
    }

    this.trimObject(root);
  }

  trimObject(obj: any): boolean {
    let isEmpty = true;
    for (const i in obj) {
      if (obj[i] === "" || (typeof obj[i] == "object" && this.trimObject(obj[i]))) {
        delete obj[i];
      }

      if (typeof obj[i] != "undefined") {
        isEmpty = false;
      }
    }

    return isEmpty;
  }

  selectEntitySetting(): void {
    const entityVal = $("#entityValue");
    $("#entityKey").val($(this).children(".key").text());
    entityVal.val($(this).children(".value").text());
    entityVal.trigger("select");
  }

  // -------------------------------------------------------------------------
  // UI

  setHotkey(hotkey: number): void {
    this.hotkey = hotkey;
    this.div.attr("title", "Select Layer (" + this.hotkey + ")");
  }

  showMenu(x: number, y: number): void {
    this.selector.pos = {
      x: Math.round((x + ig.editor.screen.x) / this.gridSize) * this.gridSize,
      y: Math.round((y + ig.editor.screen.y) / this.gridSize) * this.gridSize,
    };
    this.menu.css({
      top: y * ig.system.scale + 2,
      left: x * ig.system.scale + 2,
    });
    this.menu.show();
  }

  hideMenu(): void {
    ig.editor.mode = MODE.DRAW;
    this.menu.hide();
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
    ig.editor.setActiveLayer("entities");
  }

  mousemove(x: number, y: number): void {
    this.selector.pos = { x: x, y: y };
    const body = $("body");

    if (this.selectedEntity) {
      if (this.selectedEntity._wmScalable && this.selectedEntity.touches(this.selector)) {
        const scale = this.isOnScaleBorder(this.selectedEntity, this.selector);
        if (scale == "n" || scale == "s") {
          body.css("cursor", "ns-resize");
          return;
        } else if (scale == "e" || scale == "w") {
          body.css("cursor", "ew-resize");
          return;
        }
      }
    }

    body.css("cursor", "default");
  }

  // -------------------------------------------------------------------------
  // Drawing

  draw(): void {
    if (this.visible) {
      for (let i = 0; i < this.entities.length; i++) {
        this.drawEntity(this.entities[i]);
      }
    }
  }

  drawEntity(ent: igEntity): void {
    // entity itself
    ent.draw();

    // box
    if (ent._wmDrawBox) {
      ig.system.context.fillStyle = ent._wmBoxColor || "rgba(128, 128, 128, 0.9)";
      ig.system.context.fillRect(
        ig.system.getDrawPos(ent.pos.x - ig.game.screen.x),
        ig.system.getDrawPos(ent.pos.y - ig.game.screen.y),
        ent.size.x * ig.system.scale,
        ent.size.y * ig.system.scale
      );
    }

    if (wm.config.labels.draw) {
      // description
      const className = ent._wmClassName.replace(/^Entity/, "");
      const description = className + (ent.name ? ": " + ent.name : "");

      // text-shadow
      ig.system.context.fillStyle = "rgba(0,0,0,0.4)";
      ig.system.context.fillText(
        description,
        ig.system.getDrawPos(ent.pos.x - ig.game.screen.x),
        ig.system.getDrawPos(ent.pos.y - ig.game.screen.y + 0.5)
      );

      // text
      ig.system.context.fillStyle = wm.config.colors.primary;
      ig.system.context.fillText(
        description,
        ig.system.getDrawPos(ent.pos.x - ig.game.screen.x),
        ig.system.getDrawPos(ent.pos.y - ig.game.screen.y)
      );
    }

    // line to targets
    if (typeof ent.target == "object") {
      for (const t in ent.target) {
        this.drawLineToTarget(ent, ent.target[t]);
      }
    }
  }

  drawLineToTarget(ent: igEntity, target: string): void {
    const targetEntity = ig.editor.getEntityByName(target);
    if (!target) {
      return;
    }

    ig.system.context.strokeStyle = "#fff";
    ig.system.context.lineWidth = 1;

    ig.system.context.beginPath();
    ig.system.context.moveTo(
      ig.system.getDrawPos(ent.pos.x + ent.size.x / 2 - ig.game.screen.x),
      ig.system.getDrawPos(ent.pos.y + ent.size.y / 2 - ig.game.screen.y)
    );
    ig.system.context.lineTo(
      ig.system.getDrawPos(targetEntity.pos.x + targetEntity.size.x / 2 - ig.game.screen.x),
      ig.system.getDrawPos(targetEntity.pos.y + targetEntity.size.y / 2 - ig.game.screen.y)
    );
    ig.system.context.stroke();
    ig.system.context.closePath();
  }

  drawCursor(): void {
    if (this.selectedEntity) {
      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.highlight;
      ig.system.context.strokeRect(
        ig.system.getDrawPos(this.selectedEntity.pos.x - ig.editor.screen.x) - 0.5,
        ig.system.getDrawPos(this.selectedEntity.pos.y - ig.editor.screen.y) - 0.5,
        this.selectedEntity.size.x * ig.system.scale + 1,
        this.selectedEntity.size.y * ig.system.scale + 1
      );
    }
  }
}
