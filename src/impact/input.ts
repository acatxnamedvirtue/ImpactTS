// noinspection JSUnusedGlobalSymbols

import { ig } from "./impact";

export enum KEYS {
  // Mouse
  LEFT_CLICK = "LeftClick",
  RIGHT_CLICK = "RightClick",
  WHEEL_UP = "WheelUp",
  WHEEL_DOWN = "WheelDown",

  // Keyboard
  BACKSPACE = "Backspace",
  TAB = "Tab",
  ENTER = "Enter",
  PAUSE = "Pause",
  CAPS = "CapsLock",
  ESC = "Escape",
  SPACE = "Space",
  PAGE_UP = "PageUp",
  PAGE_DOWN = "PageDown",
  END = "End",
  HOME = "Home",
  LEFT_ARROW = "ArrowLeft",
  UP_ARROW = "ArrowUp",
  RIGHT_ARROW = "ArrowRight",
  DOWN_ARROW = "ArrowDown",
  INSERT = "Insert",
  DELETE = "Delete",
  _0 = "Digit0",
  _1 = "Digit1",
  _2 = "Digit2",
  _3 = "Digit3",
  _4 = "Digit4",
  _5 = "Digit5",
  _6 = "Digit6",
  _7 = "Digit7",
  _8 = "Digit8",
  _9 = "Digit9",
  A = "KeyA",
  B = "KeyB",
  C = "KeyC",
  D = "KeyD",
  E = "KeyE",
  F = "KeyF",
  G = "KeyG",
  H = "KeyH",
  I = "KeyI",
  J = "KeyJ",
  K = "KeyK",
  L = "KeyL",
  M = "KeyM",
  N = "KeyN",
  O = "KeyO",
  P = "KeyP",
  Q = "KeyQ",
  R = "KeyR",
  S = "KeyS",
  T = "KeyT",
  U = "KeyU",
  V = "KeyV",
  W = "KeyW",
  X = "KeyX",
  Y = "KeyY",
  Z = "KeyZ",
  NUMPAD_0 = "Numpad0",
  NUMPAD_1 = "Numpad1",
  NUMPAD_2 = "Numpad2",
  NUMPAD_3 = "Numpad3",
  NUMPAD_4 = "Numpad4",
  NUMPAD_5 = "Numpad5",
  NUMPAD_6 = "Numpad6",
  NUMPAD_7 = "Numpad7",
  NUMPAD_8 = "Numpad8",
  NUMPAD_9 = "Numpad9",
  MULTIPLY = "NumpadMultiply",
  ADD = "NumpadAdd",
  SUBSTRACT = "NumpadSubtract",
  DECIMAL = "NumpadDecimal",
  DIVIDE = "NumpadDivide",
  F1 = "F1",
  F2 = "F2",
  F3 = "F3",
  F4 = "F4",
  F5 = "F5",
  F6 = "F6",
  F7 = "F7",
  F8 = "F8",
  F9 = "F9",
  F10 = "F10",
  F11 = "F11",
  F12 = "F12",
  LEFT_SHIFT = "ShiftLeft",
  RIGHT_SHIFT = "ShiftRight",
  LEFT_CTRL = "ControlLeft",
  RIGHT_CTRL = "ControlRight",
  LEFT_ALT = "AltLeft",
  RIGHT_ALT = "AltRight", //boo hiss
  EQUAL = "Equal",
  COMMA = "Comma",
  MINUS = "Minus",
  PERIOD = "Period",
}

const MOUSE_KEYS = [KEYS.RIGHT_CLICK, KEYS.LEFT_CLICK, KEYS.WHEEL_DOWN, KEYS.WHEEL_UP];

export class igInput {
  bindings: Record<string, string> = {};
  actions: Record<string, boolean> = {};
  presses: Record<string, boolean> = {};
  locks: Record<string, boolean> = {};
  delayedKeyup: Record<string, boolean> = {};

  isUsingMouse = false;
  isUsingKeyboard = false;
  isUsingAccelerometer = false;
  mouse = { x: 0, y: 0 };
  accel: DeviceMotionEventAcceleration = { x: 0, y: 0, z: 0 };

  initMouse(): void {
    if (this.isUsingMouse) return;
    this.isUsingMouse = true;
    ig.system.canvas.addEventListener("wheel", this.mousewheel.bind(this), false);

    ig.system.canvas.addEventListener("contextmenu", this.contextmenu.bind(this), false);
    ig.system.canvas.addEventListener("mousedown", this.keydown.bind(this), false);
    ig.system.canvas.addEventListener("mouseup", this.keyup.bind(this), false);
    ig.system.canvas.addEventListener("mousemove", this.mousemove.bind(this), false);

    if (ig.ua.touchDevice) {
      // Standard
      ig.system.canvas.addEventListener("touchstart", this.keydown.bind(this), false);
      ig.system.canvas.addEventListener("touchend", this.keyup.bind(this), false);
      ig.system.canvas.addEventListener("touchcancel", this.keyup.bind(this), false);
      ig.system.canvas.addEventListener("touchmove", this.mousemove.bind(this), false);

      // MS
      ig.system.canvas.addEventListener("MSPointerDown", this.keydown.bind(this), false);
      ig.system.canvas.addEventListener("MSPointerUp", this.keyup.bind(this), false);
      ig.system.canvas.addEventListener("MSPointerMove", this.mousemove.bind(this), false);
    }
  }

  initKeyboard(): void {
    if (this.isUsingKeyboard) return;
    this.isUsingKeyboard = true;
    window.addEventListener("keydown", this.keydown.bind(this), false);
    window.addEventListener("keyup", this.keyup.bind(this), false);
  }

  initAccelerometer(): void {
    if (this.isUsingAccelerometer) return;
    this.isUsingAccelerometer = true;
    window.addEventListener("devicemotion", this.devicemotion.bind(this), false);
  }

  mousewheel(event: WheelEvent): void {
    const delta = event.deltaY ? event.deltaY : event.detail * -1;
    const code = delta < 0 ? KEYS.WHEEL_UP : KEYS.WHEEL_DOWN;
    const action = this.bindings[code];
    if (action) {
      this.actions[action] = true;
      this.presses[action] = true;
      this.delayedKeyup[action] = true;
      event.stopPropagation();
      event.preventDefault();
    }
  }

  mousemove(event: MouseEvent | TouchEvent): void {
    const internalWidth = ig.system.canvas.offsetWidth || ig.system.realWidth;
    const scale = ig.system.scale * (internalWidth / ig.system.realWidth);

    let pos = { left: 0, top: 0 };
    if (ig.system.canvas.getBoundingClientRect) {
      pos = ig.system.canvas.getBoundingClientRect();
    }

    let ev = event as MouseEvent | Touch;
    if (event instanceof TouchEvent) {
      ev = event.touches[0];
    }

    this.mouse.x = (ev.clientX - pos.left) / scale;
    this.mouse.y = (ev.clientY - pos.top) / scale;
  }

  contextmenu(event: Event): void {
    if (this.bindings[KEYS.RIGHT_CLICK]) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  keydown(event: KeyboardEvent | TouchEvent | MouseEvent): void {
    const tag = (event.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag == "TEXTAREA") {
      return;
    }

    let code;
    if (event.type === "keydown") {
      code = (event as KeyboardEvent).code;
    } else {
      code = (event as MouseEvent).button === 2 ? KEYS.RIGHT_CLICK : KEYS.LEFT_CLICK;
      // Focus window element for mouse clicks. Prevents issues when
      // running the game in an iframe.
      if (!ig.ua.mobile) {
        window.focus();
      }
    }

    if (event.type === "touchstart" || event.type === "mousedown") {
      this.mousemove(event as MouseEvent | TouchEvent);
    }

    const action = this.bindings[code];
    if (action) {
      this.actions[action] = true;
      if (!this.locks[action]) {
        this.presses[action] = true;
        this.locks[action] = true;
      }
      event.preventDefault();
    }
  }

  keyup(event: KeyboardEvent | TouchEvent | MouseEvent): void {
    const tag = (event.target as HTMLElement).tagName;
    if (tag == "INPUT" || tag == "TEXTAREA") {
      return;
    }

    let code;
    if (event.type === "keyup") {
      code = (event as KeyboardEvent).code;
    } else {
      code = (event as MouseEvent).button === 2 ? KEYS.RIGHT_CLICK : KEYS.LEFT_CLICK;
    }

    const action = this.bindings[code];
    if (action) {
      this.delayedKeyup[action] = true;
      event.preventDefault();
    }
  }

  devicemotion(event: DeviceMotionEvent): void {
    this.accel = event.accelerationIncludingGravity;
  }

  bind(key: KEYS, action: string): void {
    if (MOUSE_KEYS.includes(key)) {
      this.initMouse();
      this.bindings[key] = action;
    } else {
      this.initKeyboard();
      this.bindings[key] = action;
    }
  }

  bindTouch(selector: string, action: string): void {
    const element = document.querySelector(selector);

    if (element) {
      element.addEventListener(
        "touchstart",
        (ev: TouchEvent) => {
          this.touchStart(ev, action);
        },
        false
      );
      element.addEventListener(
        "touchend",
        (ev: TouchEvent) => {
          this.touchEnd(ev, action);
        },
        false
      );
      element.addEventListener(
        "MSPointerDown",
        (ev: TouchEvent) => {
          this.touchStart(ev, action);
        },
        false
      );
      element.addEventListener(
        "MSPointerUp",
        (ev: TouchEvent) => {
          this.touchEnd(ev, action);
        },
        false
      );
    } else {
      console.error("Failed to find element with selector:", selector);
    }
  }

  unbind(key: KEYS): void {
    const action = this.bindings[key];
    this.delayedKeyup[action] = true;

    this.bindings[key] = null;
  }

  unbindAll(): void {
    this.bindings = {};
    this.actions = {};
    this.presses = {};
    this.locks = {};
    this.delayedKeyup = {};
  }

  state(action: string): boolean {
    return this.actions[action];
  }

  pressed(action: string): boolean {
    return this.presses[action];
  }

  released(action: string): boolean {
    return !!this.delayedKeyup[action];
  }

  clearPressed(): void {
    for (const action in this.delayedKeyup) {
      this.actions[action] = false;
      this.locks[action] = false;
    }
    this.delayedKeyup = {};
    this.presses = {};
  }

  touchStart(event: TouchEvent, action: string): boolean {
    this.actions[action] = true;
    this.presses[action] = true;

    event.stopPropagation();
    event.preventDefault();
    return false;
  }

  touchEnd(event: TouchEvent, action: string): boolean {
    this.delayedKeyup[action] = true;
    event.stopPropagation();
    event.preventDefault();
    return false;
  }
}
