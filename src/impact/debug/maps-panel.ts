import { igDebugOption, igDebugPanel } from "./menu";
import { ig } from "../impact";
import { igGame } from "../game";
import { igMap } from "../map";
import { igBackgroundMap } from "../background-map";

export class igDebugMapsPanel extends igDebugPanel {
  maps: igMap[] = [];
  mapScreens: HTMLDivElement[] = [];

  constructor(name: string, label: string) {
    super(name, label);
  }

  load(game?: igGame): void {
    this.options = [];
    this.panels = [];

    if (!game || !game.backgroundMaps.length) {
      this.container.innerHTML = "<em>No Maps Loaded</em>";
      return;
    }

    this.maps = game.backgroundMaps;
    this.mapScreens = [];
    this.container.innerHTML = "";

    for (let m = 0; m < this.maps.length; m++) {
      const map = this.maps[m];

      if (!(map instanceof igBackgroundMap)) {
        continue;
      }

      const subPanel = new igDebugPanel(m.toString(10), "Layer " + m);

      const head = ig.$new("strong");
      head.textContent = m + ": " + map.tiles.path;
      subPanel.container.appendChild(head);

      subPanel.addOption(new igDebugOption("Enabled", map, "enabled"));
      subPanel.addOption(new igDebugOption("Pre Rendered", map, "preRender"));
      subPanel.addOption(new igDebugOption("Show Chunks", map, "debugChunks"));

      const generateMiniMapInterval: NodeJS.Timer = setInterval(() =>
        this.generateMiniMap(subPanel, map, m, game, generateMiniMapInterval)
      );
      this.addPanel(subPanel);
    }
  }

  generateMiniMap(
    panel: igDebugPanel,
    map: igBackgroundMap,
    id: number,
    game: igGame,
    generateMinimapInterval: NodeJS.Timer
  ): void {
    if (!map.tiles.loaded) {
      return;
    }

    const s = ig.system.scale; // we'll need this a lot

    // resize the tileset, so that one tile is 's' pixels wide and high
    const ts = ig.$new("canvas") as HTMLCanvasElement;
    const tsctx: CanvasRenderingContext2D = ts.getContext("2d");

    const w = map.tiles.width * s;
    const h = map.tiles.height * s;
    const ws = w / map.tilesize;
    const hs = h / map.tilesize;
    ts.width = ws;
    ts.height = hs;
    tsctx.drawImage(map.tiles.data, 0, 0, w, h, 0, 0, ws, hs);

    // create the minimap canvas
    const mapCanvas = ig.$new("canvas") as HTMLCanvasElement;
    mapCanvas.width = map.width * s;
    mapCanvas.height = map.height * s;
    const ctx: CanvasRenderingContext2D = mapCanvas.getContext("2d");

    if (game.clearColor) {
      ctx.fillStyle = game.clearColor;
      ctx.fillRect(0, 0, w, h);
    }

    // draw the map
    let tile = 0;
    for (let x = 0; x < map.width; x++) {
      for (let y = 0; y < map.height; y++) {
        if ((tile = map.data[y][x])) {
          ctx.drawImage(
            ts,
            Math.floor(((tile - 1) * s) % ws),
            Math.floor(((tile - 1) * s) / ws) * s,
            s,
            s,
            x * s,
            y * s,
            s,
            s
          );
        }
      }
    }

    const mapContainer = ig.$new("div");
    mapContainer.className = "ig_debug_map_container";
    mapContainer.style.width = map.width * s + "px";
    mapContainer.style.height = map.height * s + "px";

    const mapScreen = ig.$new("div") as HTMLDivElement;
    mapScreen.className = "ig_debug_map_screen";
    mapScreen.style.width = (ig.system.width / map.tilesize) * s - 2 + "px";
    mapScreen.style.height = (ig.system.height / map.tilesize) * s - 2 + "px";
    this.mapScreens[id] = mapScreen;

    mapContainer.appendChild(mapCanvas);
    mapContainer.appendChild(mapScreen);
    panel.container.appendChild(mapContainer);

    clearInterval(generateMinimapInterval);
  }

  afterRun(): void {
    // Update the screen position DIV for each mini-map
    const s = ig.system.scale;
    for (let m = 0; m < this.maps.length; m++) {
      const map = this.maps[m];
      if (!(map instanceof igBackgroundMap)) {
        continue;
      }
      const screen = this.mapScreens[m];

      if (!map || !screen) {
        // Quick sanity check
        continue;
      }

      let x = map.scroll.x / map.tilesize;
      let y = map.scroll.y / map.tilesize;

      if (map.repeat) {
        x %= map.width;
        y %= map.height;
      }

      screen.style.left = x * s + "px";
      screen.style.top = y * s + "px";
    }
  }
}
