import { plusplusSignal } from "./signals";
import { ig } from "../../impact/impact";
import { plusplusImage } from "../core/image";

export class plusplusPreloader {
  onReady: plusplusSignal = null;
  delayedLevel: any = null;
  delayedSpawnerName = "";
  ready = true;

  // internal properties, do not modify
  _resourceCounter = 0;
  _levelsToLoad: any[] = [];

  constructor() {
    this.onReady = new plusplusSignal();
  }

  queueLevel(levelName: string): void {
    this._levelsToLoad.push(levelName);
  }

  getQueueLength(): number {
    return this._levelsToLoad.length;
  }

  clearQueue(): void {
    this._levelsToLoad = [];
  }

  loadLevels(): void {
    for (let i = 0; i < this._levelsToLoad.length; i++) {
      this.loadSingleLevel(this._levelsToLoad[i]);
    }

    this.clearQueue();
  }

  loadSingleLevel(levelName: string): void {
    if (this.ready) {
      this.ready = false;
    }
    if (!this._resourceCounter) {
      this._resourceCounter = ig.resources.length;
    }
    plusplusXHR.get({
      url: "lib/game/levels/" + levelName + ".js",
      onSuccess: this.preloadCallback,
      callbackParams: {
        levelName: levelName,
      },
      context: this,
    });
  }

  preloadCallback(response: any, options: any): boolean {
    let data = response.response;

    // extract JSON from level
    const jsonMatch = data.match(/\/\*JSON\[\*\/([\s\S]*?)\/\*\]JSON\*\//);
    data = JSON.parse(jsonMatch ? jsonMatch[1] : data);
    // ig.global["Level" + options.levelName] = data;
    for (let i = 0; i < data.layer.length; i++) {
      const mapLayer = data.layer[i];
      if (mapLayer.tilesetName) {
        const newImg = new plusplusImage(mapLayer.tilesetName);

        // If the new image isn't loaded yet in a previous level
        if (ig.resources.indexOf(newImg) == -1) {
          ig.resources.push(newImg);
          newImg.onLoaded.addOnce(this.imageLoadCallback, this);
        }
      }
    }
    return true;
  }

  imageLoadCallback(): void {
    this._resourceCounter++;
    if (this._resourceCounter == ig.resources.length) {
      this.ready = true;
      if (this.onReady) {
        this.onReady.dispatch(this);
        this.onReady.removeAll();
        this.onReady.forget();

        // Reset the resourceCounter just in case something unexpected happened.

        this._resourceCounter = 0;
      }
    }
  }

  delayLevelLoad(level: any, spawnerName: string): void {
    this.delayedLevel = level;
    this.delayedSpawnerName = spawnerName;
  }
}

export class plusplusXHR {
  static _supportedFactoryIndex = 0;

  static get(options: any): void {
    const req = this.createObject();

    if (!req) {
      return;
    }

    req.open("GET", options.url, true);

    req.onreadystatechange = function () {
      if (req.readyState != 4) {
        return;
      }

      if (req.status == 200 || req.status == 304) {
        if (typeof options.onSuccess === "function") {
          options.onSuccess.call(options.context, req, options.callbackParams);
        }
      } else {
        if (typeof options.onError === "function") {
          options.onError.call(options.context, req, options.callbackParams);
        }
      }

      if (typeof options.onComplete === "function") {
        options.onComplete.call(options.context, req, options.callbackParams);
      }
    };

    if (req.readyState == 4) {
      return;
    }

    req.send();
  }

  static factories = [
    function (): XMLHttpRequest {
      return new XMLHttpRequest();
    },
    function (): any {
      return new ActiveXObject("Msxml2.XMLHTTP");
    },
    function (): any {
      return new ActiveXObject("Msxml3.XMLHTTP");
    },
    function (): any {
      return new ActiveXObject("Microsoft.XMLHTTP");
    },
  ];

  static createObject(): any {
    let xhrObject;
    if (this._supportedFactoryIndex) {
      return this.factories[this._supportedFactoryIndex]();
    } else {
      for (let i = 0; i < this.factories.length; i++) {
        try {
          xhrObject = this.factories[i]();
          this._supportedFactoryIndex = i;
        } catch (e) {
          continue;
        }
        break;
      }
    }

    if (!xhrObject) {
      throw new Error("Your browser is not supported.");
    }

    return xhrObject;
  }
}
