import { igInput, KEYS } from "../../impact/input";
import { ig } from "../../impact/impact";
import { plusplusConfig } from "./config";
import { plusplusUtils } from "../helpers/utils";
import { plusplusUtilsIntersection } from "../helpers/utilsintersection";
import { plusplusEntityExtended } from "./entity";

export class plusplusInput extends igInput {
  inputPoints: plusplusInputPoint[] = [];

  override initMouse(): void {
    super.initMouse();

    // cancel input on leave
    ig.system.canvas.addEventListener("mouseout", this.keycancel.bind(this), false);
    ig.system.canvas.addEventListener("mouseleave", this.keycancel.bind(this), false);

    if (ig.ua.touchDevice) {
      // standard
      ig.system.canvas.addEventListener("touchcancel", this.keycancel.bind(this), false);

      // MS
      ig.system.canvas.addEventListener("MSPointerOut", this.keycancel.bind(this), false);
      ig.system.canvas.addEventListener("MSPointerLeave", this.keycancel.bind(this), false);
    }
  }

  override keydown(event: KeyboardEvent | TouchEvent | MouseEvent): void {
    if (event.type == "mousedown" || event.type == "touchstart") {
      // set inputPoint state

      let inputPoint;

      // try changed touches

      if (event.type == "touchstart") {
        event = event as TouchEvent;
        for (let i = 0; i < event.changedTouches.length; i++) {
          inputPoint = this.getInputPoint(event.changedTouches[i]);

          inputPoint.touch = true;
          inputPoint.setDown();
        }
      } else {
        event = event as MouseEvent;
        inputPoint = this.getInputPoint(event);

        inputPoint.setDown();
      }
    }

    super.keydown(event);
  }

  override keyup(event: KeyboardEvent | TouchEvent | MouseEvent): void {
    if (
      event.type === "mouseup" ||
      event.type === "touchend" ||
      event.type === "mouseout" ||
      event.type === "mouseleave" ||
      event.type === "touchcancel"
    ) {
      event = event as TouchEvent;
      // set inputPoint state

      let inputPoint;

      // try changed touches

      if (event.type === "touchcancel" || event.type === "touchend") {
        for (let i = 0; i < event.changedTouches.length; i++) {
          inputPoint = this.getInputPoint(event.changedTouches[i]);

          inputPoint.setUp();
        }
      } else {
        inputPoint = this.getInputPoint(event);

        inputPoint.setUp();
      }

      // move

      this.mousemove(event);
    }

    super.keyup(event);
  }

  /**
   * Cancels an input event.
   * @param {Event} event
   **/
  keycancel(event: MouseEvent): void {
    const action = this.bindings[event.button === 2 ? KEYS.RIGHT_CLICK : KEYS.LEFT_CLICK];
    if (action && this.actions[action]) {
      this.keyup(event);
    }
  }

  /**
   * Repositions inputPoints based on event.
   * @param {Event} event
   **/
  override mousemove(event: MouseEvent | TouchEvent): void {
    const internalWidth = ig.system.canvas.offsetWidth || ig.system.realWidth;
    const scale = ig.system.scale * (internalWidth / ig.system.realWidth);
    let boundsClient: DOMRect;

    if (ig.system.canvas.getBoundingClientRect) {
      boundsClient = ig.system.canvas.getBoundingClientRect();
    }

    // try changed touches
    if (event.type === "touchmove") {
      event = event as TouchEvent;
      for (let i = 0, il = event.changedTouches.length; i < il; i++) {
        this.inputPointMove(event.changedTouches[i], scale, boundsClient);
      }
    } else {
      event = event as MouseEvent;
      this.inputPointMove(event, scale, boundsClient);
    }

    // update the original input mouse for stability
    const mousePoint = this.inputPoints[0];

    ig.input.mouse.x = mousePoint.x;
    ig.input.mouse.y = mousePoint.y;
  }

  /**
   * Repositions a inputPoint based on event, scale, and optionally, bounds.
   * @param {Event} event event object.
   * @param {Number} scale scale to modify event position with.
   * @param {Object} [boundsClient] bounding client rect of canvas.
   **/
  inputPointMove(event: Touch | MouseEvent, scale: number, boundsClient: DOMRect): void {
    let x = event.clientX;
    let y = event.clientY;

    if (boundsClient) {
      x = x - boundsClient.left;
      y = y - boundsClient.top;
    }

    x /= scale;
    y /= scale;

    const inputPoint = this.getInputPoint(event);

    inputPoint.reposition(x, y);
  }

  getInputPointId(parameters: any): any {
    // id
    if (typeof parameters === "string") {
      return parameters;
    }
    // object
    else if (parameters) {
      // event

      if (typeof parameters.identifier === "string") {
        return parameters.identifier;
      }
      // property / values
      else if (parameters.properties && parameters.values) {
        return plusplusUtils.indexOfProperties(this.inputPoints, parameters.properties, parameters.values);
      }
    }

    // default to mouse

    return 0;
  }

  getInputPoint(parameters: any): plusplusInputPoint {
    const id = this.getInputPointId(parameters);
    let inputPoint = this.inputPoints[id];

    // create new as needed

    if (!inputPoint) {
      inputPoint = this.inputPoints[id] = new plusplusInputPoint(0, 0, id);
    }

    return inputPoint;
  }

  getInputPoints(properties: any[], values: any[]): plusplusInputPoint[] {
    const inputPoints: plusplusInputPoint[] = [];

    for (let i = 0; i < this.inputPoints.length; i++) {
      const inputPoint = this.inputPoints[i] as Record<string, any>;
      let missing;

      for (let j = 0; j < properties.length; j++) {
        if (values[j] !== inputPoint[properties[j]]) {
          missing = true;
          break;
        }
      }

      // if input point satisfies all property / value pairs

      if (missing !== true) {
        inputPoints.push(inputPoint as plusplusInputPoint);
      }
    }

    return inputPoints;
  }

  removeInputPoint(parameters: any): void {
    // set up so input releases are triggered

    const id = this.getInputPointId(parameters);
    const inputPoint = this.inputPoints[id];

    if (inputPoint) {
      inputPoint.setUp();

      // remove from list
      this.inputPoints.splice(id, 1);
    }
  }

  inputPressed(code: string): void {
    const action = this.bindings[code];

    if (action) {
      this.actions[action] = true;

      if (!this.locks[action]) {
        this.presses[action] = true;
        this.locks[action] = true;
      }
    }
  }

  inputReleased(code: string): void {
    const action = this.bindings[code];

    if (action) {
      this.delayedKeyup[action] = true;
    }
  }

  update(): void {
    for (let i = 0; i < this.inputPoints.length; i++) {
      this.inputPoints[i].update();
    }
  }
}

export class plusplusInputPoint {
  id = 0;
  x = 0;
  y = 0;
  lastX = 0;
  lastY = 0;
  worldX = 0;
  worldY = 0;
  deltaX = 0;
  deltaY = 0;
  directionX = 0;
  directionY = 0;
  downDeltaX = 0;
  downDeltaY = 0;
  swipeDistanceX = 0;
  swipeDistanceY = 0;
  swipeTotalDeltaX = 0;
  swipeTotalDeltaY = 0;
  duration = 0;
  targets: plusplusEntityExtended[] = null;
  targetsUp: plusplusEntityExtended[] = null;
  targetsDown: plusplusEntityExtended[] = null;
  targetsDownStart: plusplusEntityExtended[] = null;
  down = false;
  tapped = false;
  holding = false;
  holdingActivate = false;
  moved = false;
  swiping = false;
  swipingX = false;
  swipingY = false;
  swipingLeft = false;
  swipingRight = false;
  swipingUp = false;
  swipingDown = false;
  screenSize = 0;
  touch = false;

  // internal properties, do not modify

  _taps = 0;

  _downTotalDeltaX = 0;
  _downTotalDeltaY = 0;
  _directionDeltaTotalX = 0;
  _directionDeltaTotalY = 0;

  _durationReleased = 0;
  _durationSwipeTry = 0;

  _unpositioned = true;
  _movedWithReposition = false;
  _holdingActivatable = true;
  _downLast = false;
  _blockTap = false;

  constructor(x?: number, y?: number, id?: number) {
    this.x = x || 0;
    this.y = y || 0;
    this.id = id || 0;

    this.targets = [];
    this.targetsUp = [];
    this.targetsDown = [];
    this.targetsDownStart = [];

    this.lastX = this.x;
    this.lastY = this.y;
    this.worldX = this.x + ig.game.screen.x;
    this.worldY = this.y + ig.game.screen.y;
  }

  reset(): void {
    this._unpositioned = true;
    this.lastX = this.x;
    this.lastY = this.y;
    this.worldX = this.x + ig.game.screen.x;
    this.worldY = this.y + ig.game.screen.y;
    this._taps = 0;
    this._durationReleased = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.directionX = 0;
    this.directionY = 0;
    this._directionDeltaTotalX = 0;
    this._directionDeltaTotalY = 0;

    this.moved = false;
    this._movedWithReposition = false;

    this.resetTargets();
    this.resetDown();
  }

  resetTargets(): void {
    this.targets = [];
    this.targetsUp = [];
    this.targetsDown = [];
    this.targetsDownStart = [];
  }

  resetDown(): void {
    if (this.down !== false) {
      if (this.holding) {
        // ig.input.inputReleased(KEYS.HOLD);
      }

      this.duration = 0;
      this.downDeltaX = 0;
      this.downDeltaY = 0;
      this._downTotalDeltaX = 0;
      this._downTotalDeltaY = 0;
      this.down = false;
      this._downLast = false;
      this.holding = false;
      this._blockTap = false;
      this.holdingActivate = false;
      this._holdingActivatable = true;

      this.resetSwipe();
    }
  }

  resetSwipe(): void {
    if (this.swiping !== false) {
      // ig.input.inputReleased(KEYS.SWIPE);

      this.releaseSwipeX();
      this.releaseSwipeY();

      this.swiping = false;
      this.resetSwipeValues();
    }
  }

  resetSwipeValues(): void {
    this._durationSwipeTry = 0;
    this.swipeDistanceX = 0;
    this.swipeDistanceY = 0;
    this.swipeTotalDeltaX = 0;
    this.swipeTotalDeltaY = 0;
  }

  releaseSwipeX(): void {
    if (this.swipingX) {
      (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_X);

      if (this.swipingLeft) {
        (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_LEFT);
        this.swipingLeft = false;
      } else if (this.swipingRight) {
        (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_RIGHT);
        this.swipingRight = false;
      }

      this.swipingX = false;
    }
  }

  releaseSwipeY(): void {
    if (this.swipingY) {
      (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_Y);

      if (this.swipingUp) {
        (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_UP);
        this.swipingUp = false;
      } else if (this.swipingDown) {
        (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_DOWN);
        this.swipingDown = false;
      }

      this.swipingY = false;
    }
  }

  setDown(): void {
    this.resetDown();
    this.down = true;
  }

  setUp(): void {
    if (this.down) {
      // check taps

      if (!this._blockTap) {
        this.tapped = true;
        this._taps++;
        this._durationReleased = 0;

        // always single tap

        (ig.input as plusplusInput).inputReleased(KEYS.TAP);

        // double tap and reset taps

        if (
          this._taps === 2 &&
          this._downTotalDeltaX * this._downTotalDeltaX + this._downTotalDeltaY * this._downTotalDeltaY <=
            this.screenSize * this.screenSize * plusplusConfig.GESTURE.TAP_MULTI_DISTANCE_PCT
        ) {
          this._taps = 0;
          (ig.input as plusplusInput).inputReleased(KEYS.TAP_DOUBLE);
        }

        // targets

        if (plusplusConfig.GESTURE.TARGET_TAP) {
          if (plusplusConfig.GESTURE.TARGET_DOWN_START) {
            this.targets = this.targetsDownStart;
          } else {
            this.targets = this.getTargets();
          }
        }
      } else {
        this._taps = 0;
        this.tapped = false;
      }

      // reset

      this.resetDown();
    }
  }

  getTargets(): plusplusEntityExtended[] {
    const searchRadius = plusplusConfig.GESTURE.TARGET_SEARCH_RADIUS / ig.system.scale;

    return plusplusUtilsIntersection.entitiesInAABB(
      this.worldX - searchRadius,
      this.worldY - searchRadius,
      this.worldX + searchRadius,
      this.worldY + searchRadius,
      true
    );
  }

  reposition(x: number, y: number): void {
    let directionChangedX;
    let directionChangedY;

    this.screenSize = Math.min(ig.system.width, ig.system.height);

    if (this._unpositioned) {
      this.x = x;
      this.y = y;
      this._unpositioned = false;
    } else {
      // delta

      this.deltaX = x - this.x;
      this.deltaY = y - this.y;

      // direction

      if (this.deltaX !== 0) {
        const directionX = this.deltaX < 0 ? -1 : 1;

        if (this.directionX !== directionX) {
          this._directionDeltaTotalX += this.deltaX * directionX;

          if (this._directionDeltaTotalX >= this.screenSize * plusplusConfig.GESTURE.DIRECTION_SWITCH_PCT) {
            directionChangedX = true;
            this._directionDeltaTotalX = 0;
            this.directionX = directionX;
          }
        }
      }

      if (this.deltaY !== 0) {
        const directionY = this.deltaY < 0 ? -1 : 1;

        if (this.directionY !== directionY) {
          this._directionDeltaTotalY += this.deltaY * directionY;

          if (this._directionDeltaTotalY >= this.screenSize * plusplusConfig.GESTURE.DIRECTION_SWITCH_PCT) {
            directionChangedY = true;
            this._directionDeltaTotalY = 0;
            this.directionY = directionY;
          }
        }
      }

      this._movedWithReposition = this.deltaX !== 0 || this.deltaY !== 0;

      this.x = x;
      this.y = y;
    }

    // world position

    this.worldX = this.x + ig.game.screen.x;
    this.worldY = this.y + ig.game.screen.y;

    // targets

    if (plusplusConfig.GESTURE.TARGET_UP) {
      this.targetsUp = this.getTargets();
    }

    // state

    if (this.down) {
      // targets while down

      if (plusplusConfig.GESTURE.TARGET_DOWN) {
        // copy targets from up

        if (plusplusConfig.GESTURE.TARGET_UP) {
          this.targetsDown = this.targetsUp;
        }
        // find targets
        else {
          this.targetsDown = this.getTargets();
        }
      }

      // start down

      if (this._downLast !== this.down) {
        this._downLast = this.down;

        // targets

        if (plusplusConfig.GESTURE.TARGET_DOWN_START) {
          // copy targets from down

          if (plusplusConfig.GESTURE.TARGET_DOWN) {
            this.targetsDownStart = this.targetsDown;
          }
          // copy targets from up
          else if (plusplusConfig.GESTURE.TARGET_UP) {
            this.targetsDownStart = this.targetsUp;
          }
          // find targets
          else {
            this.targetsDownStart = this.getTargets();
          }
        }
      }

      // delta while down

      this.downDeltaX = this.deltaX;
      this.downDeltaY = this.deltaY;
      this._downTotalDeltaX += this.downDeltaX;
      this._downTotalDeltaY += this.downDeltaY;

      // check if moved too much to activate

      if (
        this._holdingActivatable &&
        this._downTotalDeltaX * this._downTotalDeltaX + this._downTotalDeltaY * this._downTotalDeltaY >=
          this.screenSize * this.screenSize * plusplusConfig.GESTURE.HOLD_ACTIVATE_DISTANCE_PCT
      ) {
        this._holdingActivatable = false;
      }

      // swipe

      this.swipeTotalDeltaX += this.downDeltaX;
      this.swipeTotalDeltaY += this.downDeltaY;
      this.swipeDistanceX = this.swipeTotalDeltaX < 0 ? -this.swipeTotalDeltaX : this.swipeTotalDeltaX;
      this.swipeDistanceY = this.swipeTotalDeltaY < 0 ? -this.swipeTotalDeltaY : this.swipeTotalDeltaY;

      // reset swipe values if not enough swipe distance in time

      if (this.swiping !== true && this._durationSwipeTry > plusplusConfig.GESTURE.SWIPE_DURATION_TRY) {
        this.resetSwipeValues();
      }
      // start swipe if enough distance
      else {
        // swiping x
        if (
          this.swipingX !== true &&
          this.swipeDistanceX >= this.screenSize * plusplusConfig.GESTURE.SWIPE_DISTANCE_PCT
        ) {
          this.swiping = this._blockTap = true;
          this._holdingActivatable = false;

          (ig.input as plusplusInput).inputPressed(KEYS.SWIPE);

          this.swipingX = directionChangedX = true;
          (ig.input as plusplusInput).inputPressed(KEYS.SWIPE_X);
        }

        if (this.swipingX && directionChangedX) {
          if (this.directionX === -1) {
            if (this.swipingRight) {
              this.swipingRight = false;
              (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_RIGHT);
            }

            this.swipingLeft = true;
            (ig.input as plusplusInput).inputPressed(KEYS.SWIPE_LEFT);
          } else if (this.directionX === 1) {
            if (this.swipingLeft) {
              this.swipingLeft = false;
              (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_LEFT);
            }

            this.swipingRight = true;
            (ig.input as plusplusInput).inputPressed(KEYS.SWIPE_RIGHT);
          }
        }

        // swiping y
        if (
          this.swipingY !== true &&
          this.swipeDistanceY >= this.screenSize * plusplusConfig.GESTURE.SWIPE_DISTANCE_PCT
        ) {
          this.swiping = this._blockTap = true;
          this._holdingActivatable = false;

          (ig.input as plusplusInput).inputPressed(KEYS.SWIPE);

          this.swipingY = directionChangedY = true;
          (ig.input as plusplusInput).inputPressed(KEYS.SWIPE_Y);
        }

        if (this.swipingY && directionChangedY) {
          if (this.directionY === -1) {
            if (this.swipingDown) {
              this.swipingDown = false;
              (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_DOWN);
            }

            this.swipingUp = true;
            (ig.input as plusplusInput).inputPressed(KEYS.SWIPE_UP);
          } else if (this.directionY === 1) {
            if (this.swipingUp) {
              this.swipingUp = false;
              (ig.input as plusplusInput).inputReleased(KEYS.SWIPE_UP);
            }

            this.swipingDown = true;
            (ig.input as plusplusInput).inputPressed(KEYS.SWIPE_DOWN);
          }
        }
      }
    }
  }

  update(): void {
    // movement

    this.moved = this.x - this.lastX !== 0 || this.y - this.lastY !== 0;
    this.lastX = this.x;
    this.lastY = this.y;
    this.worldX = this.x + ig.game.screen.x;
    this.worldY = this.y + ig.game.screen.y;

    // state

    if (this.down) {
      this.duration += ig.system.tick;
      this._durationSwipeTry += ig.system.tick;

      // hold

      if (!this.holding && this.duration >= plusplusConfig.GESTURE.HOLD_DELAY) {
        this.holding = true;

        (ig.input as plusplusInput).inputPressed(KEYS.HOLD);
      }

      // tap block

      if (!this._blockTap && this.duration >= plusplusConfig.GESTURE.HOLD_DELAY_BLOCK_TAP) {
        this._blockTap = true;
      }

      // activate

      if (
        this._holdingActivatable &&
        !this.holdingActivate &&
        this.duration >= plusplusConfig.GESTURE.HOLD_DELAY_ACTIVATE
      ) {
        this.holdingActivate = true;

        (ig.input as plusplusInput).inputPressed(KEYS.HOLD_ACTIVATE);
      }

      // no movement, reset swipe

      if (!this.moved && this._durationSwipeTry > plusplusConfig.GESTURE.SWIPE_DURATION_RESET) {
        this.resetSwipe();
      }
    } else if (this._taps > 0) {
      this._durationReleased += ig.system.tick;

      if (this._durationReleased >= plusplusConfig.GESTURE.RELEASE_DELAY) {
        // if input point from touch, clear out upon release
        // we don't need to track a touch that has been released, as it won't move

        if (this.touch) {
          (ig.input as plusplusInput).removeInputPoint(this.id);
        }
        // retain mouse input point and just reset taps
        else {
          this._taps = 0;
        }
      }
    }
  }
}
