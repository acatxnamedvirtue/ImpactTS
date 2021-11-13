import { plusplusImage } from "./image";
import { ig } from "../../impact/impact";
import { igSystem } from "../../impact/system";

export class plusplusImageDrawing extends plusplusImage {
  loaded = true;

  constructor(settings: Record<string, any>) {
    super(settings.path, settings);
    ig.merge(this, settings);

    // base canvas for drawing on
    this.data = ig.$new("canvas") as HTMLCanvasElement;
    this.dataContext = this.data.getContext("2d");
    this.dataWidth = (this.width * this.scale) | 0;
    this.dataHeight = (this.height * this.scale) | 0;
    this.data.width = this.dataWidth;
    this.data.height = this.dataHeight;
    this.data.style.width = this.dataWidth + "px";
    this.data.style.height = this.dataHeight + "px";
    igSystem.scaleMode(this.data, this.dataContext);

    this.scaleCache = {};
    this.scaleCache.x1 = this.data;
  }

  override load(): void {}

  override reload(): void {}

  override onload(): void {}

  setWidth(width: number): void {
    this.setDimensions(width, this.height);
  }

  setHeight(height: number): void {
    this.setDimensions(this.width, height);
  }

  setDimensions(width?: number, height?: number): void {
    this.width = Math.max(width | 0, 1);
    this.height = Math.max(height | 0, 1);

    if (this.data) {
      this.dataWidth = this.data.width = this.width;
      this.dataHeight = this.data.height = this.height;
      igSystem.scaleMode(this.data, this.dataContext);
    }
  }

  finalize(scale: number): void {
    if (!this.data) return;

    if (!scale) {
      this._scale = scale = 1;
    } else {
      this.scale = this._scale = Math.min(
        Math.max(Math.round(scale * this.scaleOfSystemScale), this.scaleMin),
        this.scaleMax
      );
    }

    // reset
    this.scaleCache = {};
    this.scaleCache["x" + scale] = this.data;
    this.dataContext = this.data.getContext("2d");

    this.dataWidth = this.data.width;
    this.dataHeight = this.data.height;
    this.width = Math.max((this.dataWidth / scale) | 0, 1);
    this.height = Math.max((this.dataHeight / scale) | 0, 1);
  }
}
