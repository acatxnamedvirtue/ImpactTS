import { ig } from "./impact";
import { LoadCallback } from "./loader";

export class igImage {
  static drawCount = 0;
  static cache: Record<string, igImage> = {};

  static reloadCache(): void {
    for (const path in igImage.cache) {
      igImage.cache[path].reload();
    }
  }

  data: HTMLImageElement | HTMLCanvasElement = null;
  width = 0;
  height = 0;
  loaded = false;
  failed = false;
  loadCallback: LoadCallback = null;
  path: string;
  scaleCache: Record<string, HTMLImageElement | HTMLCanvasElement>;
  origData: HTMLImageElement | HTMLCanvasElement;

  constructor(path: string) {
    this.path = path;
    this.load();
  }

  load(loadCallback?: LoadCallback): void {
    if (this.loaded) {
      if (loadCallback) {
        loadCallback(this.path, true);
      }
      return;
    } else if (!this.loaded && ig.ready) {
      this.loadCallback = loadCallback;

      this.data = new Image();
      this.data.onload = this.onload.bind(this);
      this.data.onerror = this.onerror.bind(this);
      this.data.src = this.path + ig.nocache;
    } else {
      ig.addResource(this);
    }

    igImage.cache[this.path] = this;
  }

  reload(): void {
    this.loaded = false;
    this.data = new Image();
    this.data.onload = this.onload.bind(this);
    this.data.src = this.path + "?" + Date.now();
  }

  onload(_event: Event): void {
    this.width = this.data.width;
    this.height = this.data.height;
    this.loaded = true;

    if (ig.system?.scale !== 1) {
      this.resize(ig.system?.scale);
    }

    if (this.loadCallback) {
      this.loadCallback(this.path, true);
    }
  }

  onerror(): void {
    this.failed = true;

    if (this.loadCallback) {
      this.loadCallback(this.path, false);
    }
  }

  resize(scale: number): void {
    // Nearest-Neighbor scaling

    // The original image is drawn into an offscreen canvas of the same size
    // and copied into another offscreen canvas with the new size.
    // The scaled offscreen canvas becomes the image (data) of this object.

    const origPixels = ig.getImagePixels(this.data, 0, 0, this.width, this.height);

    const widthScaled = this.width * scale;
    const heightScaled = this.height * scale;

    const scaled = document.createElement("canvas");
    scaled.width = widthScaled;
    scaled.height = heightScaled;
    const scaledCtx = scaled.getContext("2d");
    const scaledPixels = scaledCtx.getImageData(0, 0, widthScaled, heightScaled);

    for (let y = 0; y < heightScaled; y++) {
      for (let x = 0; x < widthScaled; x++) {
        const index = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
        const indexScaled = (y * widthScaled + x) * 4;
        scaledPixels.data[indexScaled] = origPixels.data[index];
        scaledPixels.data[indexScaled + 1] = origPixels.data[index + 1];
        scaledPixels.data[indexScaled + 2] = origPixels.data[index + 2];
        scaledPixels.data[indexScaled + 3] = origPixels.data[index + 3];
      }
    }
    scaledCtx.putImageData(scaledPixels, 0, 0);
    this.data = scaled;
  }

  wmResize(scale: number): void {
    if (!this.loaded) {
      return;
    }
    if (!this.scaleCache) {
      this.scaleCache = {};
    }
    if (this.scaleCache["x" + scale]) {
      this.data = this.scaleCache["x" + scale];
      return;
    }

    // Retain the original image when scaling
    this.origData = this.data = this.origData || this.data;

    if (scale > 1) {
      // Nearest neighbor when zooming in
      this.resize(scale);
    } else {
      // Otherwise blur
      const scaled = ig.$new("canvas") as HTMLCanvasElement;
      scaled.width = Math.ceil(this.width * scale);
      scaled.height = Math.ceil(this.height * scale);
      const scaledCtx = scaled.getContext("2d");
      scaledCtx.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, scaled.width, scaled.height);
      this.data = scaled;
    }

    this.scaleCache["x" + scale] = this.data;
  }

  draw(targetX: number, targetY: number, sourceX?: number, sourceY?: number, width?: number, height?: number): void {
    if (!this.loaded) return;

    const scale = ig.system.scale;
    sourceX = sourceX ? sourceX * scale : 0;
    sourceY = sourceY ? sourceY * scale : 0;
    width = (width ? width : this.width) * scale;
    height = (height ? height : this.height) * scale;

    const context: CanvasRenderingContext2D = ig.system.context;
    context.drawImage(
      this.data,
      sourceX,
      sourceY,
      width,
      height,
      ig.system.getDrawPos(targetX),
      ig.system.getDrawPos(targetY),
      width,
      height
    );

    igImage.drawCount++;
  }

  drawTile(
    targetX: number,
    targetY: number,
    tile: number,
    tileWidth: number,
    tileHeight?: number,
    flipX?: boolean,
    flipY?: boolean
  ): void {
    tileHeight = tileHeight ? tileHeight : tileWidth;

    if (!this.loaded || tileWidth > this.width || tileHeight > this.height) {
      return;
    }

    const scale = ig.system.scale;
    const tileWidthScaled = Math.floor(tileWidth * scale);
    const tileHeightScaled = Math.floor(tileHeight * scale);

    const scaleX = flipX ? -1 : 1;
    const scaleY = flipY ? -1 : 1;

    const context: CanvasRenderingContext2D = ig.system.context;

    if (flipX || flipY) {
      context.save();
      context.scale(scaleX, scaleY);
    }
    context.drawImage(
      this.data,
      (Math.floor(tile * tileWidth) % this.width) * scale,
      Math.floor((tile * tileWidth) / this.width) * tileHeight * scale,
      tileWidthScaled,
      tileHeightScaled,
      ig.system.getDrawPos(targetX) * scaleX - (flipX ? tileWidthScaled : 0),
      ig.system.getDrawPos(targetY) * scaleY - (flipY ? tileHeightScaled : 0),
      tileWidthScaled,
      tileHeightScaled
    );
    if (flipX || flipY) {
      context.restore();
    }

    igImage.drawCount++;
  }
}
