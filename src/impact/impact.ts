import { igInput } from "./input";
import { igLoader } from "./loader";
import { igMusic, igSound, igSoundManager } from "./sound";
import { igSystem } from "./system";
import { igDebug } from "./debug/menu";
import { igDebugMode } from "./debug/debug";
import { igDebugGraphPanel } from "./debug/graph-panel";
import { wmWeltmeister } from "../weltmeister/weltmeister";
import { wmEventedInput } from "../weltmeister/evented-input";
import { igGame } from "./game";
import { igImage } from "./image";

// -----------------------------------------------------------------------------
// ig Namespace

type Ig = {
  system: igSystem;
  resources: (igSound | igImage)[];
  input: igInput | wmEventedInput;
  soundManager: igSoundManager;
  music: igMusic;
  ready: boolean;
  game: any;
  editor: wmWeltmeister;
  version: string;
  impactJsVersion: string;
  baked: boolean;
  nocache: string;

  ua: Record<string, any>;
  _domready: boolean;

  debug: igDebug;
  graph: igDebugGraphPanel;

  $: (selector: string) => HTMLElement | HTMLCollectionOf<Element>;
  $new: (name: string) => HTMLElement;
  copy: <T = unknown>(object: T) => T;
  merge: (original: any, extended: any) => any;
  ksort: (obj?: unknown) => any[];
  setVendorAttribute: (el: any, attr: string, val: any) => void;
  getVendorAttribute: (el: any, attr: string) => any;
  normalizeVendorAttribute: (el: any, attr: string) => void;
  getImagePixels: (
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) => ImageData;
  addResource: (resource: igImage | igSound) => void;
  setNocache: (set: boolean) => void;
  log: () => void;
  assert: (_condition: boolean, _msg: string) => void;
  show: (_name: string, _number: number) => void;
  mark: (_msg: string, _color: string) => void;
  _DOMReady: () => void;
  _boot: () => void;
  _initDOMReady: () => void;

  // eslint-disable-next-line @typescript-eslint/ban-types
  setAnimation: (callback: () => void) => number;
  clearAnimation: (id: number) => void;
};

export const ig: Ig = {
  game: null,
  system: null,
  editor: null,
  input: null,
  music: null,
  soundManager: null,
  version: "1.0.0",
  impactJsVersion: "1.24-master-ca59f0e",
  resources: [],
  ready: false,
  baked: false,
  nocache: "",
  ua: {},

  _domready: false,

  // Debug
  debug: null,
  graph: null,

  $: function (selector: string): HTMLElement | HTMLCollectionOf<Element> {
    return selector.charAt(0) === "#"
      ? document.getElementById(selector.substr(1))
      : document.getElementsByTagName(selector);
  },

  $new: function (name: string): HTMLElement {
    return document.createElement(name);
  },

  copy: function <T = unknown>(object: T): T {
    if (!object || typeof object !== "object" || object instanceof HTMLElement) {
      return object;
    } else if (Array.isArray(object)) {
      const c = [];
      for (let i = 0, l = object.length; i < l; i++) {
        c[i] = ig.copy(object[i]);
      }

      return c as unknown as T;
    } else {
      const c = {} as Partial<T>;
      for (const i in object) {
        c[i] = ig.copy(object[i]);
      }

      return c as T;
    }
  },

  merge: function (original: any, extended: any): any {
    for (const key in extended) {
      const ext = extended[key];

      if (typeof ext !== "object" || ext instanceof HTMLElement || ext === null) {
        original[key] = ext;
      } else {
        if (!original[key] || typeof original[key] != "object") {
          original[key] = ext instanceof Array ? [] : {};
        }
        ig.merge(original[key], ext);
      }
    }

    return original;
  },

  ksort: function (obj?: unknown): any[] {
    if (!obj || typeof obj !== "object") {
      return [];
    }

    const keys = Object.keys(obj);
    keys.sort();

    return keys.map((k) => (obj as any)[k]);
  },

  // Ah, yes. I love vendor prefixes. So much fun!
  setVendorAttribute: function (el: any, attr: string, val: any): void {
    const uc = attr.charAt(0).toUpperCase() + attr.substr(1);
    el[attr] = el["ms" + uc] = el["moz" + uc] = el["webkit" + uc] = el["o" + uc] = val;
  },

  getVendorAttribute: function (el: any, attr: string): any {
    const uc = attr.charAt(0).toUpperCase() + attr.substr(1);
    return el[attr] || el["ms" + uc] || el["moz" + uc] || el["webkit" + uc] || el["o" + uc];
  },

  normalizeVendorAttribute: function (el: any, attr: string): void {
    const prefixedVal = ig.getVendorAttribute(el, attr);
    if (!el[attr] && prefixedVal) {
      el[attr] = prefixedVal;
    }
  },

  // This function normalizes getImageData to extract the real, actual
  // pixels from an image. The naive method recently failed on retina
  // devices with a backingStoreRatio != 1
  getImagePixels: function (
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): ImageData {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");

    // Try to draw pixels as accurately as possible
    igSystem.SCALE.CRISP(canvas, ctx);

    const ratio = ig.getVendorAttribute(ctx, "backingStorePixelRatio") || 1;
    ig.normalizeVendorAttribute(ctx, "getImageDataHD");

    const realWidth = image.width / ratio;
    const realHeight = image.height / ratio;

    canvas.width = Math.ceil(realWidth);
    canvas.height = Math.ceil(realHeight);

    ctx.drawImage(image, 0, 0, realWidth, realHeight);

    return ctx.getImageData(x, y, width, height);
  },

  addResource: function (resource: igImage | igSound): void {
    ig.resources.push(resource);
  },

  setNocache: function (set: boolean): void {
    ig.nocache = set ? "?" + Date.now() : "";
  },

  // Stubs for ig.Debug
  log: function (): void {},
  assert: function (_condition: boolean, _msg: string): void {},
  show: function (_name: string, _number: number): void {},
  mark: function (_msg: string, _color: string): void {},

  _DOMReady: function (): NodeJS.Timeout {
    if (!ig._domready) {
      if (!document.body) {
        return setTimeout(ig._DOMReady, 13);
      }
      ig._domready = true;
    }
    return null;
  },

  _boot: function (): void {
    if (document.location.href.match(/\?nocache/)) {
      ig.setNocache(true);
    }

    // Probe user agent string
    ig.ua.pixelRatio = window.devicePixelRatio || 1;
    ig.ua.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    ig.ua.screen = {
      width: window.screen.availWidth * ig.ua.pixelRatio,
      height: window.screen.availHeight * ig.ua.pixelRatio,
    };

    ig.ua.iPhone = /iPhone|iPod/i.test(navigator.userAgent);
    ig.ua.iPhone4 = ig.ua.iPhone && ig.ua.pixelRatio == 2;
    ig.ua.iPad = /iPad/i.test(navigator.userAgent);
    ig.ua.android = /android/i.test(navigator.userAgent);
    ig.ua.winPhone = /Windows Phone/i.test(navigator.userAgent);
    ig.ua.iOS = ig.ua.iPhone || ig.ua.iPad;
    ig.ua.mobile = ig.ua.iOS || ig.ua.android || ig.ua.winPhone || /mobile/i.test(navigator.userAgent);
    ig.ua.touchDevice = "ontouchstart" in window;
  },

  _initDOMReady: function (): void {
    ig._boot();

    ig._domready = false;
    if (document.readyState === "complete") {
      ig._DOMReady();
    } else {
      document.addEventListener("DOMContentLoaded", ig._DOMReady, false);
      window.addEventListener("load", ig._DOMReady, false);
    }
  },

  setAnimation: null,
  clearAnimation: null,
};

// -----------------------------------------------------------------------------
// Provide ig.setAnimation and ig.clearAnimation as a compatible way to use
// requestAnimationFrame if available or setInterval otherwise

// Use requestAnimationFrame if available
ig.normalizeVendorAttribute(window, "requestAnimationFrame");
if (window.requestAnimationFrame) {
  let next = 1;
  const anims: Record<number, boolean> = {};

  ig.setAnimation = function (callback: () => void): number {
    const current = next++;
    anims[current] = true;

    const animate = function () {
      if (!anims[current]) return; // deleted?
      window.requestAnimationFrame(animate);
      callback();
    };
    window.requestAnimationFrame(animate);
    return current;
  };

  ig.clearAnimation = function (id: number): void {
    delete anims[id];
  };
}

// [set/clear]Interval fallback
else {
  ig.setAnimation = function (callback: TimerHandler): number {
    return window.setInterval(callback, 1000 / 60);
  };
  ig.clearAnimation = function (id: number): void {
    window.clearInterval(id);
  };
}

// -----------------------------------------------------------------------------
// The main() function creates the system, input, sound and jumpnrun objects,
// creates a preloader and starts the run loop

export function main(
  canvasId: string,
  gameClass: any,
  fps: number,
  width: number,
  height: number,
  scale?: number,
  loaderClass?: any,
  debug?: boolean
): void {
  ig.system = new igSystem(canvasId, fps, width, height, scale || 1, debug);
  ig.input = new igInput();
  ig.soundManager = new igSoundManager();
  ig.music = new igMusic();
  ig.ready = true;

  if (debug) {
    ig.debug = new igDebug();
    new igDebugMode();
  }

  const loader = new (loaderClass || igLoader)(gameClass, ig.resources);
  loader.load();
}
