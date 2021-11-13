/* eslint-disable @typescript-eslint/ban-types */
import { plusplusConfig } from "../core/config";

class TweenController {
  _tweens: any[] = [];
  _paused = false;

  getAll(): any[] {
    return this._tweens;
  }

  removeAll(): void {
    this._tweens = [];
  }

  add(tween: any): void {
    if (this._paused) {
      tween.pause();
    } else {
      tween.unpause();
    }

    this._tweens.push(tween);
  }

  remove(tween: any): void {
    const i = this._tweens.indexOf(tween);

    if (i !== -1) {
      this._tweens.splice(i, 1);
    }
  }

  pause(): void {
    if (!this._paused) {
      this._paused = true;

      for (let i = 0; i < this._tweens.length; i++) {
        this._tweens[i].pause();
      }
    }
  }

  unpause(): void {
    if (this._paused) {
      this._paused = false;

      for (let i = 0; i < this._tweens.length; i++) {
        this._tweens[i].unpause();
      }
    }
  }

  update(time: number): boolean {
    if (this._tweens.length === 0 || this._paused) return false;

    let i = 0;
    let numTweens = this._tweens.length;

    time =
      time !== undefined
        ? time
        : // : ig.global.performance !== undefined && ig.global.performance.now !== undefined
          // ? ig.global.performance.now()
          Date.now();

    while (i < numTweens) {
      const tween = this._tweens[i];

      if (tween.update(time)) {
        i++;
      } else {
        this._tweens.splice(i, 1);

        numTweens--;
      }
    }

    return true;
  }
}

export type TweenOptions = {
  duration?: number;
  easing?: (k: number) => number;
  interpolation?: (v: any[], k: number) => number;
  onStart?: Function;
  onUpdate?: Function;
  onComplete?: Function;
  stopped?: boolean;
  tween?: Tween;
};

export class plusplusTween {
  static Easing = {
    Linear: {
      None: function (k: number): number {
        return k;
      },
    },

    Quadratic: {
      In: function (k: number): number {
        return k * k;
      },

      Out: function (k: number): number {
        return k * (2 - k);
      },

      InOut: function (k: number): number {
        if ((k *= 2) < 1) return 0.5 * k * k;
        return -0.5 * (--k * (k - 2) - 1);
      },
    },

    Cubic: {
      In: function (k: number): number {
        return k * k * k;
      },

      Out: function (k: number): number {
        return --k * k * k + 1;
      },

      InOut: function (k: number): number {
        if ((k *= 2) < 1) return 0.5 * k * k * k;
        return 0.5 * ((k -= 2) * k * k + 2);
      },
    },

    Quartic: {
      In: function (k: number): number {
        return k * k * k * k;
      },

      Out: function (k: number): number {
        return 1 - --k * k * k * k;
      },

      InOut: function (k: number): number {
        if ((k *= 2) < 1) return 0.5 * k * k * k * k;
        return -0.5 * ((k -= 2) * k * k * k - 2);
      },
    },

    Quintic: {
      In: function (k: number): number {
        return k * k * k * k * k;
      },

      Out: function (k: number): number {
        return --k * k * k * k * k + 1;
      },

      InOut: function (k: number): number {
        if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
        return 0.5 * ((k -= 2) * k * k * k * k + 2);
      },
    },

    Sinusoidal: {
      In: function (k: number): number {
        return 1 - Math.cos((k * Math.PI) / 2);
      },

      Out: function (k: number): number {
        return Math.sin((k * Math.PI) / 2);
      },

      InOut: function (k: number): number {
        return 0.5 * (1 - Math.cos(Math.PI * k));
      },
    },

    Exponential: {
      In: function (k: number): number {
        return k === 0 ? 0 : Math.pow(1024, k - 1);
      },

      Out: function (k: number): number {
        return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      },

      InOut: function (k: number): number {
        if (k === 0) return 0;
        if (k === 1) return 1;
        if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
        return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
      },
    },

    Circular: {
      In: function (k: number): number {
        return 1 - Math.sqrt(1 - k * k);
      },

      Out: function (k: number): number {
        return Math.sqrt(1 - --k * k);
      },

      InOut: function (k: number): number {
        if ((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
        return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
      },
    },

    Elastic: {
      In: function (k: number): number {
        let s;
        let a = 0.1;
        const p = 0.4;
        if (k === 0) return 0;
        if (k === 1) return 1;
        if (!a || a < 1) {
          a = 1;
          s = p / 4;
        } else s = (p * Math.asin(1 / a)) / (2 * Math.PI);
        return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin(((k - s) * (2 * Math.PI)) / p));
      },

      Out: function (k: number): number {
        let s;
        let a = 0.1;
        const p = 0.4;
        if (k === 0) return 0;
        if (k === 1) return 1;
        if (!a || a < 1) {
          a = 1;
          s = p / 4;
        } else s = (p * Math.asin(1 / a)) / (2 * Math.PI);
        return a * Math.pow(2, -10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p) + 1;
      },

      InOut: function (k: number): number {
        let s;
        let a = 0.1;
        const p = 0.4;
        if (k === 0) return 0;
        if (k === 1) return 1;
        if (!a || a < 1) {
          a = 1;
          s = p / 4;
        } else s = (p * Math.asin(1 / a)) / (2 * Math.PI);
        if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin(((k - s) * (2 * Math.PI)) / p));
        return a * Math.pow(2, -10 * (k -= 1)) * Math.sin(((k - s) * (2 * Math.PI)) / p) * 0.5 + 1;
      },
    },

    Back: {
      In: function (k: number): number {
        const s = 1.70158;
        return k * k * ((s + 1) * k - s);
      },

      Out: function (k: number): number {
        const s = 1.70158;
        return --k * k * ((s + 1) * k + s) + 1;
      },

      InOut: function (k: number): number {
        const s = 1.70158 * 1.525;
        if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
        return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
      },
    },

    Bounce: {
      In: function (k: number): number {
        return 1 - plusplusTween.Easing.Bounce.Out(1 - k);
      },

      Out: function (k: number): number {
        if (k < 1 / 2.75) {
          return 7.5625 * k * k;
        } else if (k < 2 / 2.75) {
          return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
        } else if (k < 2.5 / 2.75) {
          return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
        } else {
          return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
        }
      },

      InOut: function (k: number): number {
        if (k < 0.5) return plusplusTween.Easing.Bounce.In(k * 2) * 0.5;
        return plusplusTween.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
      },
    },
  };

  static Interpolation = {
    Linear: function (v: any[], k: number): number {
      const m = v.length - 1;
      const f = m * k;
      const i = Math.floor(f);
      const fn = plusplusTween.Interpolation.Utils.Linear;

      if (k < 0) return fn(v[0], v[1], f);
      if (k > 1) return fn(v[m], v[m - 1], m - f);

      return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },

    Bezier: function (v: any[], k: number): number {
      let b = 0;
      const n = v.length - 1;
      const pw = Math.pow;
      const bn = plusplusTween.Interpolation.Utils.Bernstein;

      for (let i = 0; i <= n; i++) {
        b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
      }

      return b;
    },

    CatmullRom: function (v: any[], k: number): number {
      const m = v.length - 1;
      let f = m * k;
      let i = Math.floor(f);
      const fn = plusplusTween.Interpolation.Utils.CatmullRom;

      if (v[0] === v[m]) {
        if (k < 0) i = Math.floor((f = m * (1 + k)));

        return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
      } else {
        if (k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
        if (k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);

        return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
      }
    },

    Utils: {
      Linear: function (p0: number, p1: number, t: number): number {
        return (p1 - p0) * t + p0;
      },

      Bernstein: function (n: number, i: number): number {
        const fc = plusplusTween.Interpolation.Utils.Factorial;
        return fc(n) / fc(i) / fc(n - i);
      },

      Factorial: (function (): (n: number) => number {
        const a = [1];

        return function (n: number) {
          let s = 1;
          if (a[n]) return a[n];
          for (let i = n; i > 1; i--) s *= i;
          return (a[n] = s);
        };
      })(),

      CatmullRom: function (p0: number, p1: number, p2: number, p3: number, t: number): number {
        const v0 = (p2 - p0) * 0.5;
        const v1 = (p3 - p1) * 0.5;
        const t2 = t * t;
        const t3 = t * t2;
        return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
      },
    },
  };

  static TweenController = new TweenController();

  static tween(object: any, properties: Record<string, any>, options: TweenOptions): Tween {
    options = options || {};

    // existing tween passed, stop

    if (options.tween) {
      options.tween.stop();
    }

    // generate new tween

    const tween = new Tween(object)
      .to(properties, options.duration)
      .easing(options.easing)
      .interpolation(options.interpolation)
      .onStart(options.onStart)
      .onUpdate(options.onUpdate)
      .onComplete(options.onComplete);

    if (!options.stopped) {
      tween.start();
    }

    return tween;
  }
}

export class Tween {
  _object: any;
  _valuesStart: any = {};
  _valuesEnd: any = {};
  _valuesStartRepeat: any = {};
  _duration = plusplusConfig.DURATION_TWEEN;
  _repeat = 0;
  _delayTime = 0;
  _startTime: number;
  _paused = false;
  _pausedAt = 0;
  _easingFunction = plusplusTween.Easing.Linear.None;
  _interpolationFunction = plusplusTween.Interpolation.Linear;
  _chainedTweens: any[] = [];
  _onStartCallback: Function;
  _onStartCallbackFired = false;
  _onUpdateCallback: Function;
  _onCompleteCallback: Function;

  constructor(object: any) {
    this._object = object;
  }

  to(properties: any, duration: number) {
    if (duration !== undefined) {
      this._duration = duration;
    }

    this._valuesEnd = properties;

    return this;
  }

  start(time?: number) {
    plusplusTween.TweenController.add(this);

    this._onStartCallbackFired = false;

    this._startTime =
      time !== undefined
        ? time
        : // : ig.global.performance !== undefined && ig.global.performance.now !== undefined
          // ? ig.global.performance.now()
          Date.now();
    this._startTime += this._delayTime;

    for (const property in this._valuesEnd) {
      // This prevents the interpolation of null values or of non-existing properties
      if (!(property in this._object) || this._object[property] === null) {
        continue;
      }

      // check if an Array was provided as property value
      if (this._valuesEnd[property] instanceof Array) {
        if (this._valuesEnd[property].length === 0) {
          continue;
        }

        // create a local copy of the Array with the start value at the front
        this._valuesEnd[property] = [this._object[property]].concat(this._valuesEnd[property]);
      }

      this._valuesStart[property] = this._object[property];

      if (!(this._valuesStart[property] instanceof Array)) {
        this._valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
      }

      this._valuesStartRepeat[property] = this._valuesStart[property];
    }

    return this;
  }

  stop(): this {
    plusplusTween.TweenController.remove(this);

    return this;
  }

  pause(): this {
    if (!this._paused) {
      this._paused = true;
      this._pausedAt =
        // ig.global.performance !== undefined && ig.global.performance.now !== undefined
        //   ? ig.global.performance.now()
        //   :
        Date.now();
    }

    return this;
  }

  unpause(): this {
    if (this._paused) {
      this._paused = false;
      this._startTime +=
        // (ig.global.performance !== undefined && ig.global.performance.now !== undefined
        //   ? ig.global.performance.now()
        //   : Date.now()) - this._pausedAt;
        Date.now() - this._pausedAt;
      this._pausedAt = 0;
    }

    return this;
  }

  delay(amount: number): this {
    this._delayTime = amount;
    return this;
  }

  repeat(times: number): this {
    this._repeat = times;
    return this;
  }

  easing(easing: (k: number) => number): this {
    this._easingFunction = easing;
    return this;
  }

  interpolation(interpolation: (v: any[], k: number) => number): this {
    this._interpolationFunction = interpolation;
    return this;
  }

  chain(...params: any[]): this {
    this._chainedTweens = Array.from(params);
    return this;
  }

  onStart(callback: Function): this {
    this._onStartCallback = callback;
    return this;
  }

  onUpdate(callback: Function): this {
    this._onUpdateCallback = callback;
    return this;
  }

  onComplete(callback: Function): this {
    this._onCompleteCallback = callback;
    return this;
  }

  update(time: number): boolean {
    if (this._paused || time < this._startTime) {
      return true;
    }

    if (this._onStartCallbackFired === false) {
      if (this._onStartCallback) {
        this._onStartCallback.call(this._object);
      }

      this._onStartCallbackFired = true;
    }

    let elapsed = (time - this._startTime) / this._duration;
    elapsed = elapsed > 1 ? 1 : elapsed;

    const value = this._easingFunction(elapsed);

    for (const property in this._valuesStart) {
      const start = this._valuesStart[property];
      const end = this._valuesEnd[property];

      if (end instanceof Array) {
        this._object[property] = this._interpolationFunction(end, value);
      } else {
        this._object[property] = start + (end - start) * value;
      }
    }

    if (this._onUpdateCallback) {
      this._onUpdateCallback.call(this._object, value);
    }

    if (elapsed == 1) {
      if (this._repeat > 0) {
        if (isFinite(this._repeat)) {
          this._repeat--;
        }

        // reassign starting values, restart by making startTime = now
        for (const property in this._valuesStartRepeat) {
          this._valuesStart[property] = this._valuesStartRepeat[property];
        }
        this._startTime = time + this._delayTime;

        return true;
      } else {
        if (this._onCompleteCallback) {
          this._onCompleteCallback.call(this._object);
        }

        for (let i = 0; i < this._chainedTweens.length; i++) {
          this._chainedTweens[i].start(time);
        }

        return false;
      }
    }

    return true;
  }
}
