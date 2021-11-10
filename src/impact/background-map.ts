import { ig } from "./impact";
import { igMap } from "./map";
import { igImage } from "./image";
import { igSystem } from "./system";
import { toInt } from "./util";

export type igMapData = {
  repeat: boolean;
  distance: number;
  foreground: boolean;
  preRender: boolean;
  tilesize: number;
  data: number[][];
  tilesetName: string;
  name: string;
  width: number;
  height: number;
  linkWithCollision: boolean;
  visible: boolean;
};

export class igBackgroundMap extends igMap {
  tiles: igImage;
  scroll = { x: 0, y: 0 };
  distance = 1;
  repeat = false;
  tilesetName = "";
  foreground = false;
  enabled = true;

  preRender = false;
  preRenderedChunks: HTMLImageElement[][] = null;
  chunkSize = 512;
  debugChunks = false;

  anims: Record<number, any> = {};

  constructor(mapData: igMapData) {
    super(mapData.tilesize, mapData.data);
    this.setTileset(mapData.tilesetName);

    this.repeat = mapData.repeat;
    this.distance = mapData.distance;
    this.foreground = !!mapData.foreground;
    this.preRender = !!mapData.preRender;
    this.name = mapData.name;
  }

  setTileset(tileset: igImage | string): void {
    this.tilesetName = tileset instanceof igImage ? tileset.path : tileset;
    this.tiles = new igImage(this.tilesetName);
    this.preRenderedChunks = null;
  }

  setScreenPos(x: number, y: number): void {
    this.scroll.x = x / this.distance;
    this.scroll.y = y / this.distance;
  }

  preRenderMapToChunks(): void {
    const totalWidth = this.width * this.tilesize * ig.system.scale;
    const totalHeight = this.height * this.tilesize * ig.system.scale;

    // If this layer is smaller than the chunkSize, adjust the chunkSize
    // accordingly, so we don't have as much overdraw
    this.chunkSize = Math.min(Math.max(totalWidth, totalHeight), this.chunkSize);

    const chunkCols = Math.ceil(totalWidth / this.chunkSize);
    const chunkRows = Math.ceil(totalHeight / this.chunkSize);

    this.preRenderedChunks = [];

    for (let y = 0; y < chunkRows; y++) {
      this.preRenderedChunks[y] = [];

      for (let x = 0; x < chunkCols; x++) {
        const chunkWidth = x === chunkCols - 1 ? totalWidth - x * this.chunkSize : this.chunkSize;

        const chunkHeight = y === chunkRows - 1 ? totalHeight - y * this.chunkSize : this.chunkSize;

        this.preRenderedChunks[y][x] = this.preRenderChunk(x, y, chunkWidth, chunkHeight);
      }
    }
  }

  preRenderChunk(cx: number, cy: number, w: number, h: number): HTMLImageElement {
    const tw = w / this.tilesize / ig.system.scale + 1;
    const th = h / this.tilesize / ig.system.scale + 1;

    const nx = ((cx * this.chunkSize) / ig.system.scale) % this.tilesize;
    const ny = ((cy * this.chunkSize) / ig.system.scale) % this.tilesize;

    const tx = Math.floor((cx * this.chunkSize) / this.tilesize / ig.system.scale);
    const ty = Math.floor((cy * this.chunkSize) / this.tilesize / ig.system.scale);

    const chunk = ig.$new("canvas") as HTMLCanvasElement;
    chunk.width = w;
    chunk.height = h;

    const chunkContext = chunk.getContext("2d");
    igSystem.scaleMode(chunk, chunkContext);

    const screenContext = ig.system.context;
    ig.system.context = chunkContext;

    for (let x = 0; x < tw; x++) {
      for (let y = 0; y < th; y++) {
        if (x + tx < this.width && y + ty < this.height) {
          const tile = this.data[y + ty][x + tx];
          if (tile) {
            this.tiles.drawTile(x * this.tilesize - nx, y * this.tilesize - ny, tile - 1, this.tilesize);
          }
        }
      }
    }
    ig.system.context = screenContext;

    // Workaround for Chrome 49 bug - handling many offscreen canvases
    // seems to slow down the browser significantly. So we convert the
    // canvas to an image.
    const image = new Image();
    image.src = chunk.toDataURL();
    image.width = chunk.width;
    image.height = chunk.height;

    return image;
  }

  draw(): void {
    if (!this.tiles.loaded || !this.enabled) {
      return;
    }

    if (this.preRender) {
      this.drawPreRendered();
    } else {
      this.drawTiled();
    }
  }

  drawPreRendered(): void {
    if (!this.preRenderedChunks) {
      this.preRenderMapToChunks();
    }

    let dx = ig.system.getDrawPos(this.scroll.x);
    let dy = ig.system.getDrawPos(this.scroll.y);

    if (this.repeat) {
      const w = this.width * this.tilesize * ig.system.scale;
      dx = ((dx % w) + w) % w;

      const h = this.height * this.tilesize * ig.system.scale;
      dy = ((dy % h) + h) % h;
    }

    const minChunkX = Math.max(Math.floor(dx / this.chunkSize), 0);
    const minChunkY = Math.max(Math.floor(dy / this.chunkSize), 0);
    let maxChunkX = Math.ceil((dx + ig.system.realWidth) / this.chunkSize);
    let maxChunkY = Math.ceil((dy + ig.system.realHeight) / this.chunkSize);
    const maxRealChunkX = this.preRenderedChunks?.[0]?.length ?? 0;
    const maxRealChunkY = this.preRenderedChunks?.length ?? 0;

    if (!this.repeat) {
      maxChunkX = Math.min(maxChunkX, maxRealChunkX);
      maxChunkY = Math.min(maxChunkY, maxRealChunkY);
    }

    let nudgeY = 0;
    let chunk: HTMLImageElement | undefined;

    for (let cy = minChunkY; cy < maxChunkY; cy++) {
      let nudgeX = 0;
      let x = 0;
      let y = 0;

      for (let cx = minChunkX; cx < maxChunkX; cx++) {
        const chunk = this.preRenderedChunks[cy % maxRealChunkY]?.[cx % maxRealChunkX];

        if (!chunk) {
          continue;
        }

        x = -dx + cx * this.chunkSize - nudgeX;
        y = -dy + cy * this.chunkSize - nudgeY;
        ig.system.context.drawImage(chunk, x, y);
        igImage.drawCount++;

        if (this.debugChunks) {
          ig.system.context.strokeStyle = "#f0f";
          ig.system.context.strokeRect(x, y, this.chunkSize, this.chunkSize);
        }

        // If we repeat in X and this chunk's width wasn't the full chunk size
        // and the screen is not already filled, we need to draw anohter chunk
        // AND nudge it to be flush with the last chunk
        if (this.repeat && chunk.width < this.chunkSize && x + chunk.width < ig.system.realWidth) {
          nudgeX += this.chunkSize - chunk.width;

          // Only re-calculate maxChunkX during initial row to avoid
          // unnecessary off-screen draws on subsequent rows.
          if (cy === minChunkY) {
            maxChunkX++;
          }
        }
      }

      // Same as above, but for Y
      if (this.repeat && (chunk?.height ?? 0) < this.chunkSize && y + (chunk?.height ?? 0) < ig.system.realHeight) {
        nudgeY += this.chunkSize - (chunk?.height ?? 0);
        maxChunkY++;
      }
    }
  }

  drawTiled(): void {
    let tile = 0;
    let anim = null;
    const tileOffsetX = toInt(this.scroll.x / this.tilesize);
    const tileOffsetY = toInt(this.scroll.y / this.tilesize);
    const pxOffsetX = this.scroll.x % this.tilesize;
    const pxOffsetY = this.scroll.y % this.tilesize;
    const pxMinX = -pxOffsetX - this.tilesize;
    const pxMinY = -pxOffsetY - this.tilesize;
    const pxMaxX = ig.system.width + this.tilesize - pxOffsetX;
    const pxMaxY = ig.system.height + this.tilesize - pxOffsetY;

    // FIXME: could be sped up for non-repeated maps: restrict the for loops
    // to the map size instead of to the screen size and skip the 'repeat'
    // checks inside the loop.

    for (let mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
      let tileY = mapY + tileOffsetY;

      // Repeat Y?
      if (tileY >= this.height || tileY < 0) {
        if (!this.repeat) continue;

        tileY = ((tileY % this.height) + this.height) % this.height;
      }

      for (let mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize) {
        let tileX = mapX + tileOffsetX;

        // Repeat X?
        if (tileX >= this.width || tileX < 0) {
          if (!this.repeat) continue;

          tileX = ((tileX % this.width) + this.width) % this.width;
        }

        // Draw!
        if ((tile = this.data[tileY][tileX])) {
          if ((anim = this.anims[tile - 1])) {
            anim.draw(pxX, pxY);
          } else {
            this.tiles.drawTile(pxX, pxY, tile - 1, this.tilesize);
          }
        }
      } // end for x
    } // end for y
  }
}
