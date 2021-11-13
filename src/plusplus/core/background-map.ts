import { igBackgroundMap } from "../../impact/background-map";
import { plusplusConfig } from "./config";
import { plusplusImageDrawing } from "./image-drawing";
import { igImage } from "../../impact/image";
import { plusplusUtils } from "../helpers/utils";
import { ig } from "../../impact/impact";
import { igSystem } from "../../impact/system";

export class plusplusBackgroundMapExtended extends igBackgroundMap {
  preRenderedScale = 0;
  mergedMaps: plusplusBackgroundMapExtended[] = [];
  parallaxX = plusplusConfig.BACKGROUNDS_PARALLAX_X;
  parallaxY = plusplusConfig.BACKGROUNDS_PARALLAX_Y;

  override setScreenPos(x: number, y: number): void {
    this.scroll.x = this.parallaxX ? x / this.distance : x;
    this.scroll.y = this.parallaxY ? y / this.distance : y;
  }

  override setTileset(tileset: igImage | string): void {
    // handle when tileset is an image drawing

    if (tileset instanceof plusplusImageDrawing) {
      // should we copy image?
      this.tiles = tileset;
    } else {
      this.tilesetName = tileset instanceof igImage ? tileset.path : tileset;
      this.tiles = new igImage(this.tilesetName);
    }

    this.preRenderedChunks = null;
  }

  merge(map: igBackgroundMap): boolean {
    if (
      this.preRender &&
      !this.repeat &&
      map instanceof igBackgroundMap &&
      map.preRender &&
      !map.repeat &&
      map.distance === this.distance
    ) {
      // store map

      plusplusUtils.arrayCautiousAdd(this.mergedMaps, map);

      // reset prerendered chunks to force another render

      this.preRenderedChunks = null;

      return true;
    }

    return false;
  }

  override preRenderMapToChunks(): void {
    // store current scale

    this.preRenderedScale = ig.system.scale;

    // handle merged prerender

    if (this.mergedMaps.length > 0) {
      this.preRenderedChunks = [];

      // combine merged maps with this map first

      const maps = [this, ...this.mergedMaps];

      // find largest chunk values from maps

      let totalWidth = 0;
      let totalHeight = 0;
      let totalSize = 0;
      let chunkSize = 0;

      for (let i = 0; i < maps.length; i++) {
        const map = maps[i];

        totalWidth = Math.max(totalWidth, map.width * map.tilesize * ig.system.scale);
        totalHeight = Math.max(totalHeight, map.height * map.tilesize * ig.system.scale);
        totalSize = Math.max(totalWidth, totalHeight);
        chunkSize = Math.max(chunkSize, Math.min(totalSize, map.chunkSize));
      }

      const chunkCols = Math.ceil(totalWidth / chunkSize);
      const chunkRows = Math.ceil(totalHeight / chunkSize);

      for (let y = 0; y < chunkRows; y++) {
        const chunkRow = (this.preRenderedChunks[y] = this.preRenderedChunks[y] || []);

        for (let x = 0; x < chunkCols; x++) {
          const chunkWidth = x === chunkCols - 1 ? totalWidth - x * chunkSize : chunkSize;
          const chunkHeight = y === chunkRows - 1 ? totalHeight - y * chunkSize : chunkSize;

          chunkRow[x] = this.preRenderMergedChunk(maps, chunkSize, x, y, chunkWidth, chunkHeight);
        }
      }
    }
    // default to unmerged prerender
    else {
      super.preRenderMapToChunks();
    }
  }

  /**
   * Prerenders a merged chunk of a map from a list of maps.
   * @param {Array} maps maps to render from
   * @param {Number} chunkSize size of chunk
   * @param {Number} cx x position of chunk
   * @param {Number} cy y position of chunk
   * @param {Number} w width of chunk
   * @param {Number} h height of chunk
   * @returns {*}
   */
  preRenderMergedChunk(
    maps: plusplusBackgroundMapExtended[],
    chunkSize: number,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): HTMLCanvasElement {
    const chunk = ig.$new("canvas") as HTMLCanvasElement;
    chunk.width = w;
    chunk.height = h;
    chunk.style.width = w + "px";
    chunk.style.height = h + "px";

    const screenContext = ig.system.context;
    const chunkContext = chunk.getContext("2d");
    igSystem.scaleMode(chunk, chunkContext);
    ig.system.context = chunkContext;

    for (let i = 0; i < maps.length; i++) {
      this.preRenderChunk(cx, cy, w, h, maps[i], chunkSize, chunk);
    }

    ig.system.context = screenContext;

    return chunk;
  }

  /**
   * Prerenders a chunk of a map.
   * @override
   */
  override preRenderChunk(
    cx: number,
    cy: number,
    w: number,
    h: number,
    map: plusplusBackgroundMapExtended,
    chunkSize: number,
    chunk: HTMLCanvasElement
  ): HTMLCanvasElement {
    map = map || this;
    chunkSize = chunkSize || this.chunkSize;

    let screenContext;

    if (!chunk) {
      chunk = ig.$new("canvas") as HTMLCanvasElement;
      chunk.width = w;
      chunk.height = h;
      chunk.style.width = w + "px";
      chunk.style.height = h + "px";

      const chunkContext = chunk.getContext("2d");
      igSystem.scaleMode(chunk, chunkContext);

      screenContext = ig.system.context;
      ig.system.context = chunkContext;
    }

    const tw = w / map.tilesize / ig.system.scale + 1;
    const th = h / map.tilesize / ig.system.scale + 1;

    const nx = ((cx * chunkSize) / ig.system.scale) % map.tilesize;
    const ny = ((cy * chunkSize) / ig.system.scale) % map.tilesize;

    const tx = Math.floor((cx * chunkSize) / map.tilesize / ig.system.scale);
    const ty = Math.floor((cy * chunkSize) / map.tilesize / ig.system.scale);

    for (let x = 0; x < tw; x++) {
      for (let y = 0; y < th; y++) {
        if (x + tx < map.width && y + ty < map.height) {
          const tile = map.data[y + ty][x + tx];

          if (tile) {
            map.tiles.drawTile(x * map.tilesize - nx, y * map.tilesize - ny, tile - 1, map.tilesize);
          }
        }
      }
    }

    if (screenContext) {
      ig.system.context = screenContext;
    }

    return chunk;
  }

  override draw(): void {
    // add .setScreenPos to the draw method to make the game-wide drawing method much simpler

    this.setScreenPos(ig.game.screen.x, ig.game.screen.y);

    if (!this.tiles.loaded || !this.enabled) return;

    // draw prerendered or by tile

    if (this.preRender) {
      if (this.preRenderedScale !== ig.system.scale) {
        // reset prerendered chunks to force another render to scale

        this.preRenderedChunks = null;
      }

      this.drawPreRendered();
    } else {
      this.drawTiled();
    }
  }
}
