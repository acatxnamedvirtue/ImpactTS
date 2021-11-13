import { igImage } from "../../impact/image";
import { plusplusSignal } from "../helpers/signals";
import { ig } from "../../impact/impact";
import { igSystem } from "../../impact/system";

export class plusplusImage extends igImage {
  width = 1;
  height = 1;
  data: HTMLCanvasElement = null;
  dataContext: CanvasRenderingContext2D = null;
  dataWidth = 1;
  dataHeight = 1;
  scale = 1;
  scaleOfSystemScale: 1;
  scaleMin: 1;

  scaleMax = Infinity;

  ignoreSystemScale = false;

  retainScaledData = true;

  scaleCache: Record<string, HTMLCanvasElement> = null;

  onLoaded: plusplusSignal = null;

  // internal properties, do not modify

  _scale = 0;

  constructor(path: string, settings?: Record<string, any>) {
    super(path);

    ig.merge(this, settings);

    this.onLoaded = new plusplusSignal();
    this.scaleCache = {};
  }

  override onload(_: Event): void {
    this.width = Math.max(this.data.width | 0, 1);
    this.height = Math.max(this.data.height | 0, 1);
    this.loaded = true;

    // store original image data at 1 scale
    // resize is skipped to save on performance
    // as resize will be done based on draw call

    const original = ig.$new("canvas") as HTMLCanvasElement;
    original.width = this.width;
    original.height = this.height;
    original.style.width = this.width + "px";
    original.style.height = this.height + "px";
    const originalContext = original.getContext("2d");
    igSystem.scaleMode(original, originalContext);
    originalContext.drawImage(this.data, 0, 0);

    this.data = original;
    this.dataContext = this.data.getContext("2d");
    this.dataWidth = this.data.width;
    this.dataHeight = this.data.height;

    if (!this.scaleCache) {
      this.scaleCache = {};
    }

    this.scaleCache.x1 = this.data;

    if (this.loadCallback) {
      this.loadCallback(this.path, true);
    }

    if (this.onLoaded) {
      this.onLoaded.dispatch(this);
      this.onLoaded.removeAll();
      this.onLoaded.forget();
    }

    // image is loaded after game has started
    // force global resize on next update
    if (!ig.editor && ig.game && !ig.game._gameNeedsSetup) {
      ig.game.resizeDeferred(true);
    }
  }

  override resize(scale: number): void {
    // the original image is copied into another canvas with the new size.
    // the scaled canvas becomes the image (data) of this object.
    const origData = this.scaleCache.x1;

    if (origData && scale) {
      scale = Math.min(Math.max(Math.round(scale * this.scaleOfSystemScale), this.scaleMin), this.scaleMax);

      if (this._scale !== scale) {
        // store scale so we know when system was resized
        this.scale = this._scale = scale;

        // do we already have scaled data?
        if (!this.scaleCache) {
          this.scaleCache = {};
        }

        this.data = this.scaleCache["x" + scale];

        if (this.data) {
          this.dataContext = this.data.getContext("2d");
          this.dataWidth = this.data.width;
          this.dataHeight = this.data.height;
        } else {
          const origPixels = ig.getImagePixels(origData, 0, 0, this.width, this.height);
          const widthScaled = (this.width * scale) | 0;
          const heightScaled = (this.height * scale) | 0;
          const scaled = (this.data = ig.$new("canvas") as HTMLCanvasElement);
          scaled.width = widthScaled;
          scaled.height = heightScaled;
          scaled.style.width = widthScaled + "px";
          scaled.style.height = heightScaled + "px";
          this.dataWidth = widthScaled;
          this.dataHeight = heightScaled;
          const scaledCtx = (this.dataContext = this.data.getContext("2d"));

          igSystem.scaleMode(scaled, scaledCtx);
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

          // store for reuse
          if (this.retainScaledData) {
            this.scaleCache["x" + scale] = this.data;
          }
        }
      }
    }
  }

  override wmResize(scale: number) {
    if (scale && this._scale !== scale) {
      const origData = this.scaleCache.x1;

      if (!origData) {
        this.scaleCache.x1 = this.data;
      }

      this.resize(scale);
    }
  }

  override draw(
    targetX: number,
    targetY: number,
    sourceX: number,
    sourceY: number,
    width: number,
    height: number,
    scale?: number
  ): void {
    if (!this.data) return;

    if (!scale && ig.editor) {
      scale = ig.system.scale;
    } else if (!scale && !ig.editor) {
      if (!this.ignoreSystemScale && this._scale !== ig.system.scale) {
        this.resize(ig.system.scale);
      } else if (this._scale !== this.scale) {
        this.resize(this.scale);
      }

      scale = this._scale;
    } else {
      this.resize(scale);
    }

    width = ((typeof width !== "undefined" ? width : this.width) * scale) | 0;
    height = ((typeof height !== "undefined" ? height : this.height) * scale) | 0;

    // no sense in drawing when 0 width or height
    if (width === 0 || height === 0) return;

    sourceX = sourceX ? (sourceX * scale) | 0 : 0;
    sourceY = sourceY ? (sourceY * scale) | 0 : 0;

    ig.system.context.drawImage(
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

  override drawTile(
    targetX: number,
    targetY: number,
    tile: number,
    tileWidth: number,
    tileHeight: number,
    flipX: boolean,
    flipY: boolean,
    scale?: number
  ): void {
    tileHeight = tileHeight ? tileHeight : tileWidth;

    if (!this.data || tileWidth > this.width || tileHeight > this.height) return;

    if (!scale && ig.editor) {
      scale = ig.system.scale;
    } else if (!scale && !ig.editor) {
      if (!this.ignoreSystemScale && this._scale !== ig.system.scale) {
        this.resize(ig.system.scale);
      } else if (this._scale !== this.scale) {
        this.resize(this.scale);
      }

      scale = this._scale;
    } else {
      this.resize(scale);
    }

    const tileWidthScaled = Math.floor(tileWidth * scale);
    const tileHeightScaled = Math.floor(tileHeight * scale);
    let dirX;
    let dirY;
    let offsetX;
    let offsetY;

    if (flipX) {
      dirX = -1;
      offsetX = tileWidthScaled;
    } else {
      dirX = 1;
      offsetX = 0;
    }

    if (flipY) {
      dirY = -1;
      offsetY = tileHeightScaled;
    } else {
      dirY = 1;
      offsetY = 0;
    }

    if (flipX || flipY) {
      ig.system.context.save();
      ig.system.context.scale(dirX, dirY);

      ig.system.context.drawImage(
        this.data,
        (Math.floor(tile * tileWidth) % this.width) * scale,
        Math.floor((tile * tileWidth) / this.width) * tileHeight * scale,
        tileWidthScaled,
        tileHeightScaled,
        ig.system.getDrawPos(targetX) * dirX - offsetX,
        ig.system.getDrawPos(targetY) * dirY - offsetY,
        tileWidthScaled,
        tileHeightScaled
      );

      ig.system.context.restore();
    } else {
      ig.system.context.drawImage(
        this.data,
        (Math.floor(tile * tileWidth) % this.width) * scale,
        Math.floor((tile * tileWidth) / this.width) * tileHeight * scale,
        tileWidthScaled,
        tileHeightScaled,
        ig.system.getDrawPos(targetX) * dirX - offsetX,
        ig.system.getDrawPos(targetY) * dirY - offsetY,
        tileWidthScaled,
        tileHeightScaled
      );
    }

    igImage.drawCount++;
  }
}
