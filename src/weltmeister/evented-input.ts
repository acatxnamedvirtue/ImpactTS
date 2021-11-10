import { igInput, KEYS } from "../impact/input";

export class wmEventedInput extends igInput {
  mousemoveCallback: () => {} = null;
  keyupCallback: (action: string) => {} = null;
  keydownCallback: (action: string) => {} = null;

  delayedKeyup: Record<string, any> = {
    push() {},
    length: 0,
  };

  override keydown(event: KeyboardEvent | TouchEvent | MouseEvent): void {
    const tag = (event.target as HTMLElement).tagName;
    if (tag == "INPUT" || tag == "TEXTAREA") {
      return;
    }

    let code;
    if (event.type === "keydown") {
      code = (event as KeyboardEvent).code;
    } else {
      code = (event as MouseEvent).button === 2 ? KEYS.RIGHT_CLICK : KEYS.LEFT_CLICK;
    }
    const action = this.bindings[code];
    if (action) {
      if (!this.actions[action]) {
        this.actions[action] = true;
        if (this.keydownCallback) {
          this.keydownCallback(action);
        }
      }
      event.stopPropagation();
      event.preventDefault();
    }
  }

  override keyup(event: KeyboardEvent | TouchEvent | MouseEvent): void {
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
      this.actions[action] = false;
      if (this.keyupCallback) {
        this.keyupCallback(action);
      }
      event.stopPropagation();
      event.preventDefault();
    }
  }

  override mousewheel(event: WheelEvent): void {
    const delta = event.deltaY ? event.deltaY : event.detail * -1;
    const code = delta < 0 ? KEYS.WHEEL_UP : KEYS.WHEEL_DOWN;
    const action = this.bindings[code];

    if (action) {
      if (this.keyupCallback) {
        this.keyupCallback(action);
      }
      event.stopPropagation();
      event.preventDefault();
    }
  }

  override mousemove(event: MouseEvent | TouchEvent): void {
    super.mousemove(event);
    if (this.mousemoveCallback) {
      this.mousemoveCallback();
    }
  }
}
