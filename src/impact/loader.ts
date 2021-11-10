import { ig } from "./impact";
import { erase } from "./util";
import { igGame } from "./game";

type Resource = { path: string; load: (cb: LoadCallback) => void };

export type LoadCallback = (path: string, success: boolean, e?: Error | Event) => void;

export class igLoader {
  resources: Resource[];

  gameClass: any;
  status = 0;
  done = false;

  _unloaded: string[] = [];
  _drawStatus = 0;
  _intervalId: NodeJS.Timeout;

  constructor(gameClass: any, resources: Resource[]) {
    this.gameClass = gameClass;
    this.resources = resources;

    this.resources.forEach((resource) => {
      this._unloaded.push(resource.path);
    });
  }

  load(): void {
    ig.system.clear("#000");

    if (!this.resources.length) {
      this.end();
      return;
    }

    this.resources.forEach((resource) => {
      this.loadResource(resource);
    });

    this._intervalId = setInterval(this.draw.bind(this), 16);
  }

  loadResource(res: Resource): void {
    res.load(this._loadCallback);
  }

  end(): void {
    if (this.done) return;

    this.done = true;
    clearInterval(this._intervalId);
    ig.system.setGame(this.gameClass);
  }

  draw(): void {
    this._drawStatus += (this.status - this._drawStatus) / 5;
    const s = ig.system.scale;
    const w = Math.floor(ig.system.width * 0.6);
    const h = Math.floor(ig.system.height * 0.1);
    const x = Math.floor(ig.system.width * 0.5 - w / 2);
    const y = Math.floor(ig.system.height * 0.5 - h / 2);

    ig.system.context.fillStyle = "#000";
    ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);

    ig.system.context.fillStyle = "#fff";
    ig.system.context.fillRect(x * s, y * s, w * s, h * s);

    ig.system.context.fillStyle = "#000";
    ig.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);

    ig.system.context.fillStyle = "#fff";
    ig.system.context.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
  }

  _loadCallback = (path: string, status: boolean): void => {
    if (status) {
      erase(this._unloaded, path);
    } else {
      throw "Failed to load resource: " + path;
    }

    this.status = 1 - this._unloaded.length / this.resources.length;
    if (this._unloaded.length === 0) {
      // all done?
      setTimeout(this.end.bind(this), 250);
    }
  };
}
