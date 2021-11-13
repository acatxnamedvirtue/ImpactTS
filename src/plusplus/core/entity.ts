import { plusplusConfig } from "./config";
import { plusplusUtilsMath } from "../helpers/utilsmath";
import { plusplusAnimationExtended } from "./animation";
import { plusplusUtilsVector2, Vector2 } from "../helpers/utilsvector2";
import { plusplusSignal } from "../helpers/signals";
import {igEntity, igEntityType} from "../../impact/entity";
import { plusplusUtils } from "../helpers/utils";
import { ig } from "../../impact/impact";
import { igAnimation, igAnimationSheet } from "../../impact/animation";
import { plusplusUtilsDraw } from "../helpers/utilsdraw";
import { plusplusUtilsIntersection } from "../helpers/utilsintersection";
import { plusplusUtilsColor } from "../helpers/utilscolor";
import { plusplusTween, Tween } from "../helpers/tweens";
import { Contour, plusplusUtilsTile } from "../helpers/utilstile";
import { TraceResult } from "../../impact/collision-map";

export class plusplusEntityExtended extends igEntity {
  static PERFORMANCE = {
    STATIC: plusplusConfig.STATIC || "static",
    MOVABLE: plusplusConfig.MOVABLE || "movable",
    DYNAMIC: plusplusConfig.DYNAMIC || "dynamic",
  };

  static TYPE = {};

  layerName = "entities";
  pos = {
    x: 0.01,
    y: 0.01,
  };
  size = {
    x: plusplusConfig.ENTITY.SIZE_EFFECTIVE_X,
    y: plusplusConfig.ENTITY.SIZE_EFFECTIVE_Y,
  };
  offset = {
    x: plusplusConfig.ENTITY.SIZE_OFFSET_X,
    y: plusplusConfig.ENTITY.SIZE_OFFSET_Y,
  };
  posDraw = {
    x: 0.01,
    y: 0.01,
  };
  sizeDraw = {
    x: 0,
    y: 0,
  };
  scale = plusplusConfig.ENTITY.SCALE;
  scaleOfSystemScale = plusplusConfig.ENTITY.SCALE_OF_SYSTEM_SCALE;
  scaleMin = plusplusConfig.ENTITY.SCALE_MIN;
  scaleMax = plusplusConfig.ENTITY.SCALE_MAX;
  scaleMod = 1;
  ignoreSystemScale = plusplusConfig.ENTITY.IGNORE_SYSTEM_SCALE;
  collides = 0;
  collidesChanges = false;
  collisionMapResult: Record<string, any> = null;
  checkAgainst = 0;
  type = 0;
  group = 0;
  frozen = false;
  controllable = true;
  performance = plusplusConfig.STATIC;
  highPerformance = false;
  fixed = false;
  facing = {
    x: 1,
    y: 0,
  };
  canFlipX = plusplusConfig.ENTITY.CAN_FLIP_X;
  canFlipY = plusplusConfig.ENTITY.CAN_FLIP_Y;
  friction = {
    x: plusplusConfig.ENTITY.FRICTION_X,
    y: plusplusConfig.ENTITY.FRICTION_Y,
  };
  maxVel = {
    x: plusplusConfig.ENTITY.MAX_VEL_X,
    y: plusplusConfig.ENTITY.MAX_VEL_Y,
  };
  angle = 0;
  bounciness = plusplusConfig.ENTITY.BOUNCINESS;
  minBounceVelocity = plusplusConfig.ENTITY.MIN_BOUNCE_VEL;
  currentAnim: plusplusAnimationExtended = null;
  overridingAnim: plusplusAnimationExtended = null;
  animSheetPath = "";
  animSheetWidth = 0;
  animSheetHeight = 0;
  animSettings: Record<string, any> = null;
  animationType = 0;
  animationTypes: string[] = null;
  animSequenceCount = 1;
  animTileOffset = 0;
  animFrameTime = 1;
  animInit: plusplusAnimationExtended | string = "";
  textured = false;
  textures: Record<string, any> = null;
  texturedAnimsCount: number;
  persistent = false;
  targetable = false;
  climbable = false;
  climbableStairs = false;
  oneWay = false;
  oneWayFacing: Vector2 = null;
  opaque = plusplusConfig.ENTITY.OPAQUE;
  opaqueOffset = plusplusConfig.ENTITY.OPAQUE_OFFSET;
  opaqueVertices: Vector2[] = null;
  opaqueFromVertices = plusplusConfig.ENTITY.OPAQUE_FROM_VERTICES;
  diffuse = plusplusConfig.ENTITY.DIFFUSE;
  hollow = true;
  activated = false;
  alwaysToggleActivate = false;
  // eslint-disable-next-line @typescript-eslint/ban-types
  activateCallback: Function = null;
  activateContext: Record<string, any> = null;
  deactivateCallback: Function = null;
  deactivateContext: Record<string, any> = null;
  alpha = 1;
  hidden = false;
  health = plusplusConfig.ENTITY.HEALTH;
  healthMax = plusplusConfig.ENTITY.HEALTH;
  invulnerable = false;
  rangeInteractableX = 0;
  rangeInteractableY = 0;
  paused = false;
  visible = false;
  changed = false;
  checking = false;
  wasChecking = false;
  intersecting = false;
  added = false;
  dieing = false;
  dieingSilently = false;
  canDieInstantly = true;
  flip = {
    x: false,
    y: false,
  };
  grounded = plusplusConfig.TOP_DOWN;
  standing = plusplusConfig.TOP_DOWN;
  gravityFactor = plusplusConfig.TOP_DOWN ? 0 : 1;
  hasGravity = plusplusConfig.TOP_DOWN ? false : true;
  collidingWithMap = false;
  collidingWithEntitiesBelow = false;
  slope: Record<string, any> = null;
  slopeSticking = plusplusConfig.ENTITY.SLOPE_STICKING;
  slopeSpeedMod = plusplusConfig.ENTITY.SLOPE_SPEED_MOD;
  slopeStanding = {
    min: plusplusUtilsMath.degreesToRadians(plusplusConfig.ENTITY.SLOPE_STANDING_MIN),
    max: plusplusUtilsMath.degreesToRadians(plusplusConfig.ENTITY.SLOPE_STANDING_MAX),
  };
  moving = false;
  movingX = false;
  movingY = false;
  movingTo: plusplusEntityExtended | Vector2 | plusplusEntityExtended[] | Vector2[] = null;
  movedTo = true;
  movingToOnce = false;
  movingToTweening = false;
  movingToTweenPct = 0;
  linkedTo: plusplusEntityExtended = null;
  managed = false;
  tweens: Record<string, Tween> = {};
  resetState: Record<string, any> = {};
  needsVertices = plusplusConfig.ENTITY.NEEDS_VERTICES;
  vertices: Vector2[] = null;
  verticesWorld: Vector2[] = null;
  onAdded: plusplusSignal = null;
  onRemoved: plusplusSignal = null;
  onMovedTo: plusplusSignal = null;
  onRefreshed: plusplusSignal = null;
  needsRebuild = true;
  overridingAnimName: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  overridingAnimCallback: Function;
  overridingAnimContext: any;
  overridingAnimFrozen: any;
  movingToSettings: Record<string, any>;
  movingToTweenX: number;
  movingToTweenY: number;
  movingToSequence: plusplusEntityExtended[] | Vector2[];

  // internal properties, do not modify
  _posLast: {
    x: 0;
    y: 0;
  };
  _sizeLast = {
    x: 0,
    y: 0,
  };
  _angleLast = 0;
  _changedAdd = false;
  _verticesFound = false;
  _overridedAnim: plusplusAnimationExtended;
  _cleanupPersistent = false;
  _contours: Contour[] = null;
  _contourPool: Contour[] = null;
  _utilVec2Cast1: Vector2;
  _utilVec2Cast2: Vector2;
  _utilVec2Cast3: Vector2;
  _utilVec2Cast4: Vector2;
  _utilVec2Project1: Vector2;
  _utilVec2Project2: Vector2;
  _utilVec2Project3: Vector2;
  _utilVec2Project4: Vector2;
  climbing: boolean;
  _climbingIntentUp: boolean;
  _climbingIntentDown: boolean;
  jumping: boolean;

  constructor(x: number, y: number, settings: Record<string, any>) {
    super(x, y, settings);
    this.id = ++igEntity._lastId;

    // types and checks
    this.initTypes();

    // properties that should only be initialized once
    this.initProperties();

    // do reset
    this.reset(x, y, settings);
  }
  /**
   * Adds this entity's types and checks.
   */
  initTypes(): void {}

  /**
   * Adds properties that should only be initialized once.
   */
  initProperties(): void {
    this.collisionMapResult = {
      collision: {
        x: false,
        y: false,
        slope: false,
      },
      pos: {
        x: 0.0,
        y: 0.0,
      },
      slope: {
        x: 0.0,
        y: 0.0,
        nx: 0.0,
        ny: 0.0,
      },
      tile: {
        x: 0,
        y: 0,
        xPos: {
          x: 0.0,
          y: 0.0,
        },
        yPos: {
          x: 0.0,
          y: 0.0,
        },
      },
    };

    // signals

    this.onAdded = new plusplusSignal();
    this.onRemoved = new plusplusSignal();
    this.onMovedTo = new plusplusSignal();
    this.onRefreshed = new plusplusSignal();
  }

  /**
   * Resets an entity to last state.
   * @param {Number} x x position.
   * @param {Number} y y position.
   * @param {Object} [settings] settings object.
   **/
  override reset(x: number, y: number, settings: Record<string, any>): void {
    this.resetCore(x, y, settings);

    this.resetExtras();
  }

  /**
   * Resets settings and position of entity.
   * @param {Number} x x position.
   * @param {Number} y y position.
   * @param {Object} [settings] settings object.
   **/
  resetCore(x: number, y: number, settings: Record<string, any>): void {
    // reset
    ig.merge(this, this.resetState);

    // position
    if (x) {
      this.pos.x = x;
    }

    if (y) {
      this.pos.y = y;
    }

    // settings

    if (settings && !ig.editor) {
      if (typeof settings.type === "string") {
        plusplusUtils.addType(plusplusEntityExtended, this, "type", settings.type);
        delete settings.type;
      }

      if (typeof settings.checkAgainst === "string") {
        plusplusUtils.addType(plusplusEntityExtended, this, "checkAgainst", settings.checkAgainst);
        delete settings.checkAgainst;
      }

      if (typeof settings.group === "string") {
        plusplusUtils.addType(plusplusEntityExtended, this, "group", settings.group, "GROUP");
        delete settings.group;
      }
    }

    ig.merge(this, settings);

    // no longer killed, dead, or dieing

    this._killed = this.dieing = this.dieingSilently = false;
  }

  /**
   * Resets extra properties after core.
   **/
  resetExtras(): void {
    // stats

    this.healthMax = this.health;

    // dynamic (i.e. uses physics) cannot be fixed

    if (this.performance === plusplusEntityExtended.PERFORMANCE.DYNAMIC) {
      this.fixed = false;
    }

    // fixed entities cannot collide

    if (this.fixed) {
      this.collides = plusplusEntityExtended.COLLIDES.NEVER;
    }

    // when there is no gravity, start grounded

    if (!this.hasGravity) {
      this.setGrounded(true);
    }

    // create anim sheet

    if (this.animSheetPath) {
      this.animSheet = new igAnimationSheet(
        plusplusConfig.PATH_TO_MEDIA + this.animSheetPath,
        this.animSheetWidth,
        this.animSheetHeight
      );

      this.animSheetPath = "";
    }

    // automatically create animations

    if (this.animSettings) {
      this.anims = {};
      this.resetState.currentAnim = null;

      if (this.animSettings === true) {
        this.createAnim();
      } else {
        for (const animName in this.animSettings) {
          this.createAnim(animName, this.animSettings[animName]);
        }
      }

      delete this.animSettings;
    }

    // update reset state

    this.recordResetState();

    // refresh

    if (!ig.editor) {
      ig.system.onResized.add(this.refresh, this);
    }
    this.refresh(true);

    if (this.frozen) {
      this.changed = this._changedAdd = false;
    } else {
      this.changed = this._changedAdd = true;
    }

    // start activated

    if (this.activated) {
      this.activated = false;
      this.activate();
    }
  }

  /**
   * Records the state of an entity for later reset.
   * <br>- does not record all properties for performance reasons
   **/
  recordResetState(): void {
    const rs = this.resetState;

    if (!rs.pos) {
      rs.pos = {
        x: 0,
        y: 0,
      };
    }
    plusplusUtilsVector2.copy(rs.pos, this.pos);

    if (!rs.vel) {
      rs.vel = {
        x: 0,
        y: 0,
      };
    }
    plusplusUtilsVector2.copy(rs.vel, this.vel);

    if (!rs.accel) {
      rs.accel = {
        x: 0,
        y: 0,
      };
    }
    plusplusUtilsVector2.copy(rs.accel, this.accel);

    rs.layerName = this.layerName;
    rs.frozen = this.frozen;
    rs.alpha = this.alpha;

    rs.type = this.type;
    rs.checkAgainst = this.checkAgainst;
    rs.collides = this.collides;
    rs.performance = this.performance;

    rs.health = this.health;
  }

  /**
   * Generates and adds an animation from {@link plusplusEntityExtended#animSettings}. If no settings passed, creates default idle animation.
   * @param {Object} [name] name of animation.
   * @param {Object} [settings] settings for animation.
   * @see plusplusEntityExtended#animSettings
   **/
  createAnim(name?: string, settings?: Record<string, any>): void {
    settings = settings || {};

    let sequence = settings.sequence;
    const tileOffset = settings.tileOffset || this.animTileOffset;

    if (!sequence || !sequence.length) {
      sequence = settings.sequence = [];

      const frameCount = settings.sequenceCount || this.animSequenceCount;
      let startFrame = 0;

      // animation types are when a sprite sheet has a series of animations that are all the same length

      const animationType = settings.type || this.animationType;

      if (animationType && this.animationTypes) {
        const orderIndex = plusplusUtils.indexOfValue(this.animationTypes, animationType);

        if (orderIndex !== -1) {
          startFrame += frameCount * orderIndex;
        }
      }

      for (let i = 0; i < frameCount; i++) {
        sequence[i] = startFrame + i;
      }
    }

    if (tileOffset) {
      for (let i = 0; i < sequence.length; i++) {
        sequence[i] += tileOffset;
      }
    }

    settings.frameTime = settings.frameTime || this.animFrameTime;

    if (name) {
      this.addAnim(name, settings);
    } else {
      const idleAnim = this.addAnim("idle", settings);
      this.anims.idleX = idleAnim;
      this.anims.idleY = idleAnim;
      this.anims.idleLeft = idleAnim;
      this.anims.idleRight = idleAnim;
      this.anims.idleUp = idleAnim;
      this.anims.idleDown = idleAnim;
    }
  }

  override addAnim(name: string, settings: Record<string, any>): plusplusAnimationExtended {
    if (!this.animSheet) {
      throw "No animSheet to add the animation " + name + " to.";
    }

    const animation = new plusplusAnimationExtended(this.animSheet, settings);

    this.anims[name] = animation;

    if (!this.currentAnim) {
      this.currentAnim = animation;
    }

    return animation;
  }

  getDirectionalAnimName(animName: string): string {
    if (this.facing.y !== 0) {
      if (this.canFlipY) {
        return animName + "Y";
      } else if (this.facing.y < 0) {
        return animName + "Up";
      } else {
        return animName + "Down";
      }
    } else {
      if (this.canFlipX) {
        return animName + "X";
      } else if (this.facing.x < 0) {
        return animName + "Left";
      } else {
        return animName + "Right";
      }
    }
  }

  refresh(force: boolean): void {
    if (!this.ignoreSystemScale) {
      const scale = Math.min(
        Math.max(Math.round(ig.system.scale * this.scaleOfSystemScale), this.scaleMin),
        this.scaleMax
      );

      if (this.scale !== scale) {
        this.scale = scale;
        force = true;
      }
    }

    if (this.needsRebuild) {
      force = true;
    }

    this.scaleMod = this.scale / ig.system.scale;

    force = this.resize(force) || force;

    if (force || this.needsRebuild) {
      this.sizeDraw.x = this.getSizeDrawX();
      this.sizeDraw.y = this.getSizeDrawY();
    }

    force = this.reposition(force) || force;

    this.recordChanges(force);
    this.recordLast();
    plusplusUtilsVector2.copy(this.last, this.pos);

    if (force || this.needsRebuild) {
      this.rebuild();
    }

    if (this.movingTo) {
      this.moveToUpdate();
    }

    this.onRefreshed.dispatch(this);

    if (this.frozen) {
      this.changed = this.moving = this.movingX = this.movingY = false;
      this.facing.x = this.facing.y = 0;
    } else if (this.performance === plusplusEntityExtended.PERFORMANCE.STATIC && this.changed) {
      this.moving = this.movingX = this.movingY = false;
      this._changedAdd = true;
    }
  }

  resize(force: boolean): boolean {
    return force;
  }

  reposition(force: boolean): boolean {
    if (this.movingTo) {
      this.movedTo = false;
    }

    return force;
  }

  rebuild(): void {
    this.needsRebuild = false;
  }

  adding(): void {
    this.ready();

    this.onAdded.dispatch(this);
  }

  ready(): void {
    // initialize performance

    this.changePerformance();

    // resizing and refreshing

    if (this.linkedTo) {
      const linkedTo = this.linkedTo;
      this.linkedTo = null;

      this.link(linkedTo, linkedTo.added);
    }

    // play spawn animation

    const animNameSpawn = this.getDirectionalAnimName("spawn");

    if (this.anims[animNameSpawn]) {
      this.animOverride(animNameSpawn, {
        callback: this.spawn,
      });
    } else {
      this.spawn();
    }
  }

  /**
   * Called after {@link plusplusEntityExtended#ready} when spawn animation is complete.
   * <br>- sets {@link plusplusEntityExtended#currentAnim} to {@link plusplusEntityExtended#animInit} if present
   * <br>- activates entity if {@link plusplusEntityExtended#activated} is true
   **/
  spawn(): void {
    this.resetToInitAnim();
  }

  /**
   * Resets current anim to initial animation.
   */
  resetToInitAnim(): void {
    // set initial animation

    if (this.animInit instanceof igAnimation) {
      this.currentAnim = this.animInit;
    } else if (this.animInit) {
      this.currentAnim = this.anims[this.animInit] as plusplusAnimationExtended;
    } else {
      this.currentAnim = (this.anims["idle"] as plusplusAnimationExtended) || this.currentAnim;
    }

    if (this.currentAnim) {
      this.resetState.currentAnim = this.currentAnim;

      const stop = this.currentAnim.stop;

      this.currentAnim.playFromStart();

      this.currentAnim.stop = stop;
    }
  }

  /**
   * Sets this entity's performance level.
   **/
  setPerformance(level) {
    this.performance = level;

    if (this.performance !== this.performanceLast) {
      this.changePerformance();
    }
  }

  /**
   * Makes changes based on this entity's performance level.
   * @returns {Boolean} whether changed or not.
   **/
  changePerformance() {
    this.performanceLast = this.performance;

    // movable
    if (this.performance === plusplusEntityExtended.PERFORMANCE.MOVABLE) {
      this.changePerformanceMovable();
    }
    // dynamic
    else if (this.performance === plusplusEntityExtended.PERFORMANCE.DYNAMIC) {
      this.changePerformanceDynamic();
    }
    // default to static
    else {
      this.changePerformanceStatic();
    }
  }

  /**
   * Called when performance changed to static.
   **/
  changePerformanceStatic(): void {}

  /**
   * Called when performance changed to movable.
   **/
  changePerformanceMovable(): void {}

  /**
   * Called when performance changed to dynamic.
   **/
  changePerformanceDynamic(): void {}

  /**
   * Sets whether entity can control self.
   * @param {Boolean} [controllable=true]
   **/
  setControllable(controllable: boolean): void {
    if (typeof controllable === "undefined") {
      controllable = true;
    }

    if (!controllable) {
      this.removeControl();
    } else {
      this.addControl();
    }
  }

  /**
   * Adds control to entity.
   * <span class="alert alert-info"><strong>Tip:</strong> this allows entity to call {@link ig.GameExtended#updateChanges} during update cycle.</span>
   **/
  addControl(): void {
    this.controllable = true;
  }

  /**
   * Removes control from entity.
   * <span class="alert alert-info"><strong>Tip:</strong> this blocks entity from calling {@link ig.GameExtended#updateChanges} during update cycle.</span>
   **/
  removeControl(): void {
    this.controllable = false;

    this.applyAntiVelocity();
  }

  /**
   * Gets entity layer based on {@link plusplusEntityExtended#layerName}.
   * @returns {ig.Layer} layer this entity is on.
   **/
  getLayer(): any {
    return ig.game.layersMap[this.layerName];
  }

  /**
   * Calculates vertices based on entity's size.
   * <br>- vertices are relative to entity, not world space, and are not scaled to window
   * <br>- instead of calling this, use {@link plusplusEntityExtended#vertices}
   * @returns {Array} vertices.
   * @example
   * // normally, vertices are never calculated
   * // but you can force vertices to be updated on change
   * entity.needsVertices = true;
   * // this is a bad idea
   * var vertices = entity.getVertices();
   * // this is a good idea
   * var vertices = entity.vertices;
   **/
  getVertices(): Vector2[] {
    const sizeX = this.size.x * 0.5;
    const sizeY = this.size.y * 0.5;

    return [
      {
        x: -sizeX,
        y: -sizeY,
      },
      {
        x: sizeX,
        y: -sizeY,
      },
      {
        x: sizeX,
        y: sizeY,
      },
      {
        x: -sizeX,
        y: sizeY,
      },
    ];
  }

  /**
   * Calculates vertices in world space.
   * <br>- verticesWorld are in world space and are not scaled to window
   * <br>- instead of calling this, use {@link plusplusEntityExtended#verticesWorld}
   * @returns {Array} vertices.
   * @example
   * // normally, vertices are never calculated
   * // but you can force vertices to be updated on change
   * entity.needsVertices = true;
   * // this is a bad idea
   * var verticesWorld = entity.getVerticesWorld();
   * // this is a good idea
   * var verticesWorld = entity.verticesWorld;
   **/
  getVerticesWorld(): Vector2[] {
    // ensure vertices exist

    if (!this.vertices) {
      this.vertices = this.getVertices();
    }

    return plusplusUtilsVector2.projectPoints(
      this.vertices,
      this.pos.x + this.size.x * 0.5,
      this.pos.y + this.size.y * 0.5,
      1,
      1,
      this.angle
    );
  }

  /**
   * Calculates horizontal size, offset included.
   * @returns {Number} total horizontal size.
   **/
  getSizeDrawX(): number {
    return this.size.x + this.offset.x * 2;
  }

  /**
   * Calculates horizontal size, offset included.
   * @returns {Number} total vertical size.
   **/
  getSizeDrawY(): number {
    return this.size.y + this.offset.y * 2;
  }

  /**
   * Calculates entity's draw x position, offset included.
   * @returns {Number} draw x position.
   **/
  getPosDrawX(): number {
    return this.pos.x - this.offset.x;
  }

  /**
   * Calculates entity's draw y position, offset included.
   * @returns {Number} draw y position.
   **/
  getPosDrawY(): number {
    return this.pos.y - this.offset.y;
  }

  /**
   * Calculates entity's center x position.
   * @returns {Number} horizontal center.
   **/
  getCenterX(): number {
    return this.pos.x + this.size.x * 0.5;
  }

  /**
   * Calculates entity's center x position.
   * @returns {Number} vertical center.
   **/
  getCenterY(): number {
    return this.pos.y + this.size.y * 0.5;
  }

  /**
   * Calculates if entity is visible in screen.
   * <br>- instead of calling this, use {@link plusplusEntityExtended#visible}
   * @returns {Boolean} if is in screen.
   * @example
   * // this is a bad idea
   * var visible = entity.getIsVisible();
   * // this is a good idea
   * var visible = entity.visible;
   **/
  getIsVisible(): boolean {
    if (this.alpha <= 0) return false;
    else {
      if (this.fixed) {
        return plusplusUtilsIntersection.AABBIntersect(
          this.posDraw.x,
          this.posDraw.y,
          this.posDraw.x + this.sizeDraw.x,
          this.posDraw.y + this.sizeDraw.y,
          0,
          0,
          ig.system.width,
          ig.system.height
        );
      } else {
        const minX = this.posDraw.x - ig.game.screen.x;
        const minY = this.posDraw.y - ig.game.screen.y;

        return plusplusUtilsIntersection.AABBIntersect(
          minX,
          minY,
          minX + this.sizeDraw.x,
          minY + this.sizeDraw.y,
          0,
          0,
          ig.system.width,
          ig.system.height
        );
      }
    }
  }

  /**
   * Calculates new velocity on a single axis for entity, and fixes bug of friction not limiting velocity.
   * @param {Number} vel velocity
   * @param {Number} accel acceleration
   * @param {Number} friction friction
   * @param {Number} max max velocity
   **/
  override getNewVelocity(vel: number, accel: number, friction: number, max: number): number {
    if (accel) {
      return plusplusUtilsMath.clamp(vel + accel * ig.system.tick, -max, max);
    } else if (friction) {
      const delta = friction * ig.system.tick;

      if (vel - delta > 0) {
        return Math.min(vel - delta, max);
      } else if (vel + delta < 0) {
        return Math.max(vel + delta, -max);
      } else {
        return 0;
      }
    }
    return plusplusUtilsMath.clamp(vel, -max, max);
  }

  /**
   * Calculates if entity is handling its own movement, i.e. dynamic, moving to, etc.
   * @returns {Boolean} if is handling own movement.
   **/
  getIsMovingSelf(): boolean | plusplusEntityExtended {
    return this.performance === plusplusEntityExtended.PERFORMANCE.DYNAMIC || this.movingTo;
  }

  /**
   * Approximate check of whether this entity is colliding with the one way blocking direction of another other entity.
   * <br>- checks for whether the touching edges are within a certain range based on {@link ig.CONFIG#PRECISION_PCT_ONE_SIDED}
   * <span class="alert"><strong>IMPORTANT:</strong> the non one way entity does this check to allow it to choose whether to ignore one way block.</span>
   * @param {plusplusEntityExtended} entityOneWay one way entity to check against.
   * @returns {Boolean} true if this entity is coming from other entity's one way blocking direction.
   */
  getIsCollidingWithOneWay(entityOneWay: plusplusEntityExtended): boolean {
    // check x

    if (entityOneWay.oneWayFacing.x !== 0) {
      if (entityOneWay.oneWayFacing.x < 0) {
        if (
          this.pos.x + this.size.x - entityOneWay.pos.x <=
          Math.max(entityOneWay.size.x, this.size.x) * plusplusConfig.PRECISION_PCT_ONE_SIDED +
            Math.max(this.vel.x * ig.system.tick, 0) -
            Math.min(entityOneWay.vel.x * ig.system.tick, 0)
        ) {
          return true;
        }
      } else if (
        entityOneWay.pos.x + entityOneWay.size.x - this.pos.x <=
        Math.max(entityOneWay.size.x, this.size.x) * plusplusConfig.PRECISION_PCT_ONE_SIDED -
          Math.min(this.vel.x * ig.system.tick, 0) +
          Math.max(entityOneWay.vel.x * ig.system.tick, 0)
      ) {
        return true;
      }
    }

    // check y

    if (entityOneWay.oneWayFacing.y !== 0) {
      if (entityOneWay.oneWayFacing.y < 0) {
        if (
          this.pos.y + this.size.y - entityOneWay.pos.y <=
          entityOneWay.size.y * plusplusConfig.PRECISION_PCT_ONE_SIDED +
            Math.max(this.vel.y * ig.system.tick, 0) -
            Math.min(entityOneWay.vel.y * ig.system.tick, 0) +
            (entityOneWay.slope && entityOneWay.accel.x !== 0 && entityOneWay.slope.nx * entityOneWay.vel.x <= 0
              ? entityOneWay.vel.x * ig.system.tick
              : 0)
        ) {
          return true;
        }
      } else if (
        entityOneWay.pos.y + entityOneWay.size.y - this.pos.y <=
        Math.max(entityOneWay.size.y, this.size.y) * plusplusConfig.PRECISION_PCT_ONE_SIDED -
          Math.min(this.vel.y * ig.system.tick, 0) +
          Math.max(entityOneWay.vel.y * ig.system.tick, 0)
      ) {
        return true;
      }
    }
  }

  /**
   * Whether this entity touches another.
   * @param {plusplusEntityExtended} entity entity to check against.
   * @returns {Boolean} if touches other.
   **/
  override touches(entity: plusplusEntityExtended): boolean {
    return plusplusUtilsIntersection.AABBIntersect(
      this.pos.x,
      this.pos.y,
      this.pos.x + this.size.x,
      this.pos.y + this.size.y,
      entity.pos.x,
      entity.pos.y,
      entity.pos.x + entity.size.x,
      entity.pos.y + entity.size.y
    );
  }

  /**
   * Calculates distance from center of this entity to center of another entity or position.
   * @param {plusplusEntityExtended|Vector2|Object} from entity or position to find distance to.
   * @returns {Number} distance
   */
  override distanceTo(from: plusplusEntityExtended | Vector2): number {
    let centerX = this.pos.x + this.size.x * 0.5;
    let centerY = this.pos.y + this.size.y * 0.5;

    if (this.fixed) {
      centerX += ig.game.screen.x;
      centerY += ig.game.screen.y;
    }

    let distanceX;
    let distanceY;

    if (from instanceof plusplusEntityExtended) {
      let fromCenterX = from.pos.x + from.size.x * 0.5;
      let fromCenterY = from.pos.y + from.size.y * 0.5;

      if (from.fixed) {
        fromCenterX += ig.game.screen.x;
        fromCenterY += ig.game.screen.y;
      }

      distanceX = centerX - fromCenterX;
      distanceY = centerY - fromCenterY;
    } else {
      distanceX = centerX - from.x;
      distanceY = centerY - from.y;
    }

    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  }

  /**
   * Calculates distance squared from center of this entity (in world space) to center of another entity or position (in world space).
   * <br>- this is faster than distanceTo as it avoids sqrt, but the distance is squared
   * @param {plusplusEntityExtended|Vector2|Object} from entity or position to find distance to.
   * @returns {Number} distance squared
   */
  distanceSquaredTo(from: plusplusEntityExtended | Vector2): number {
    let centerX = this.pos.x + this.size.x * 0.5;
    let centerY = this.pos.y + this.size.y * 0.5;

    if (this.fixed) {
      centerX += ig.game.screen.x;
      centerY += ig.game.screen.y;
    }

    let distanceX;
    let distanceY;

    if (from instanceof plusplusEntityExtended) {
      let fromCenterX = from.pos.x + from.size.x * 0.5;
      let fromCenterY = from.pos.y + from.size.y * 0.5;

      if (from.fixed) {
        fromCenterX += ig.game.screen.x;
        fromCenterY += ig.game.screen.y;
      }

      distanceX = centerX - fromCenterX;
      distanceY = centerY - fromCenterY;
    } else {
      distanceX = centerX - from.x;
      distanceY = centerY - from.y;
    }

    return distanceX * distanceX + distanceY * distanceY;
  }

  /**
   * Calculates distance from edge of this entity to edge of another entity or position.
   * @param {plusplusEntityExtended|Vector2|Object} from entity or position to find distance to.
   * @returns {Number} distance
   */
  distanceEdgeTo(from: plusplusEntityExtended | Vector2): number {
    let minX;
    let maxX;
    let minY;
    let maxY;

    if (this.fixed) {
      minX = this.pos.x + ig.game.screen.x;
      maxX = minX + this.size.x;
      minY = this.pos.y + ig.game.screen.y;
      maxY = minY + this.size.y;
    } else {
      minX = this.pos.x;
      maxX = minX + this.size.x;
      minY = this.pos.y;
      maxY = minY + this.size.y;
    }

    let fromMinX;
    let fromMaxX;
    let fromMinY;
    let fromMaxY;

    if (from instanceof plusplusEntityExtended) {
      if (from.fixed) {
        fromMinX = from.pos.x + ig.game.screen.x;
        fromMaxX = fromMinX + from.size.x;
        fromMinY = from.pos.y + ig.game.screen.y;
        fromMaxY = fromMinY + from.size.y;
      } else {
        fromMinX = from.pos.x;
        fromMaxX = fromMinX + from.size.x;
        fromMinY = from.pos.y;
        fromMaxY = fromMinY + from.size.y;
      }
    } else {
      fromMinX = fromMaxX = from.x;
      fromMinY = fromMaxY = from.y;
    }

    let distanceX;
    let distanceY;

    if (maxX < fromMinX) {
      distanceX = fromMinX - maxX;
    } else if (minX > fromMaxX) {
      distanceX = minX - fromMaxX;
    } else {
      distanceX = 0;
    }

    if (maxY < fromMinY) {
      distanceY = fromMinY - maxY;
    } else if (minY > fromMaxY) {
      distanceY = minY - fromMaxY;
    } else {
      distanceY = 0;
    }

    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  }

  /**
   * Calculates distance squared from edge of this entity to edge of another entity or position.
   * <br>- this is faster than distanceEdgeTo as it avoids sqrt, but the distance is squared
   * @param {plusplusEntityExtended|Vector2|Object} from entity or position to find distance to.
   * @returns {Number} distance
   */
  distanceSquaredEdgeTo(from: plusplusEntityExtended | Vector2): number {
    let minX;
    let maxX;
    let minY;
    let maxY;

    if (this.fixed) {
      minX = this.pos.x + ig.game.screen.x;
      maxX = minX + this.size.x;
      minY = this.pos.y + ig.game.screen.y;
      maxY = minY + this.size.y;
    } else {
      minX = this.pos.x;
      maxX = minX + this.size.x;
      minY = this.pos.y;
      maxY = minY + this.size.y;
    }

    let fromMinX;
    let fromMaxX;
    let fromMinY;
    let fromMaxY;

    if (from instanceof plusplusEntityExtended) {
      if (from.fixed) {
        fromMinX = from.pos.x + ig.game.screen.x;
        fromMaxX = fromMinX + from.size.x;
        fromMinY = from.pos.y + ig.game.screen.y;
        fromMaxY = fromMinY + from.size.y;
      } else {
        fromMinX = from.pos.x;
        fromMaxX = fromMinX + from.size.x;
        fromMinY = from.pos.y;
        fromMaxY = fromMinY + from.size.y;
      }
    } else {
      fromMinX = fromMaxX = from.x;
      fromMinY = fromMaxY = from.y;
    }

    let distanceX;
    let distanceY;

    if (maxX < fromMinX) {
      distanceX = fromMinX - maxX;
    } else if (minX > fromMaxX) {
      distanceX = minX - fromMaxX;
    } else {
      distanceX = 0;
    }

    if (maxY < fromMinY) {
      distanceY = fromMinY - maxY;
    } else if (minY > fromMaxY) {
      distanceY = minY - fromMaxY;
    } else {
      distanceY = 0;
    }

    return distanceX * distanceX + distanceY * distanceY;
  }

  /**
   * Calculates angle from this entity to another entity or position.
   * @param {plusplusEntityExtended|Vector2|Object} from entity or position to find angle to.
   * @returns {Number} angle
   */
  override angleTo(from: plusplusEntityExtended | Vector2): number {
    if (from instanceof plusplusEntityExtended) {
      return Math.atan2(
        this.pos.x + this.size.x * 0.5 - (from.pos.x + from.size.x * 0.5),
        this.pos.y + this.size.y * 0.5 - (from.pos.y + from.size.y * 0.5)
      );
    } else {
      return Math.atan2(this.pos.x + this.size.x * 0.5 - from.x, this.pos.y + this.size.y * 0.5 - from.y);
    }
  }

  /**
   * Zeroes out velocity.
   **/
  applyAntiVelocity(): void {
    this.applyAntiVelocityX();
    this.applyAntiVelocityY();
  }

  /**
   * Zeroes out horizontal velocity.
   **/
  applyAntiVelocityX(): void {
    this.vel.x = 0;
    this.movingX = false;
    this.moving = this.movingY;
  }

  /**
   * Zeroes out vertical velocity.
   **/
  applyAntiVelocityY(): void {
    this.vel.y = 0;
    this.movingY = false;
    this.moving = this.movingX;
  }

  /**
   * Applies velocity to counteract gravity.
   **/
  applyAntiGravity(): void {
    if (this.gravityFactor !== 0) {
      this.vel.y -= ig.game.gravity * ig.system.tick * this.gravityFactor;
    }
  }

  /**
   * Sets entity as grounded. Only changes gravity state if has gravity.
   * @param {Boolean} [withoutVelocity=false] whether to leave velocity untouched
   */
  setGrounded(withoutVelocity?: boolean): void {
    if (plusplusConfig.TOP_DOWN) {
      this.standing = this.grounded = true;
    } else {
      this.standing = this.grounded = this.hasGravity;

      if (!withoutVelocity) {
        // force to max velocity so we stick to ground

        if (this.slopeSticking && this.hasGravity) {
          this.vel.y = this.maxVel.y;
        } else {
          this.vel.y = 0;
        }
      }
    }
  }

  /**
   * Sets entity as ungrounded.
   */
  setUngrounded(): void {
    if (!plusplusConfig.TOP_DOWN) {
      this.grounded = this.standing = false;
    }
  }

  /**
   * Plays an animation and sets animation as override until complete to ensure that no other animations play.
   * @param {String} animName name of animation to play.
   * @param {Object} [settings] settings object.
   * @example
   * // settings is a plain object
   * settings = {};
   * // use an animation from another entity
   * settings.entity = otherEntity;
   * // don't auto release override
   * settings.lock = true;
   * // loop overriding animation
   * // also does not auto release override
   * settings.loop = true;
   * // play animation in reverse
   * settings.reverse = true;
   * // call a function when override completes
   * settings.callback = function () {...};
   * // call the callback in a context
   * settings.context = callbackContext;
   **/
  animOverride(animName: string, settings: Record<string, any>): void {
    // entity has animation

    if (this.overridingAnimName !== animName && ((settings && settings.entity) || this).anims[animName]) {
      settings = settings || {};
      const entity = settings.entity || this;

      this.animRelease();

      this.overridingAnimName = animName;
      this.overridingAnimCallback = settings.callback;
      this.overridingAnimContext = settings.context;
      this.overridingAnimFrozen = this.frozen;

      // store current to be restored when anim released

      this._overridedAnim = this.currentAnim;

      // set current to overriding

      this.currentAnim = this.overridingAnim = entity.anims[animName];

      // listen for complete of animation if not looping or locked to automatically release override
      // not allowing this can be dangerous as it requires a manual release of override

      if (!settings.loop && !settings.lock && !settings.stop) {
        this.overridingAnim.onCompleted.addOnce(this.animRelease, this);
      }

      // reset override

      if (this.frozen) {
        this.frozen = false;
      }

      // play from start and only play once

      if (settings.frame) {
        this.overridingAnim.gotoFrame(settings.frame);

        if (typeof settings.reverse === "boolean") {
          this.overridingAnim.reverse = settings.reverse;
        }
      } else {
        this.overridingAnim.playFromStart(!settings.loop, settings.reverse);
      }

      if (typeof settings.stop === "boolean") {
        this.overridingAnim.stop = settings.stop;
      }
    }
    // release override
    else if (settings && typeof settings.callback === "function") {
      this.animRelease(animName, true);

      settings.callback.call(settings.context || this);
    }
  }

  /**
   * Removes animation override, see plusplusEntityExtended.animOverride.
   * @param {String} [name=any] specific name of overriding animation to release. If does not match will not release.
   * @param {Boolean} [silent=false] whether to suppress callback.
   **/
  animRelease(name?: string, silent?: boolean): void {
    if (!name || this.overridingAnimName === name) {
      // store callback/context and clear override

      const callback = this.overridingAnimCallback;
      const context = this.overridingAnimContext;

      if (this.overridingAnimFrozen) {
        this.frozen = this.overridingAnimFrozen;
      }

      if (this.overridingAnim) {
        this.overridingAnim.onCompleted.remove(this.animRelease, this);

        this.currentAnim = this._overridedAnim;

        this.overridingAnimName =
          this.overridingAnim =
          this._overridedAnim =
          this.overridingAnimCallback =
          this.overridingAnimContext =
            undefined;
      }

      // do callback

      if (!silent && callback) {
        callback.call(context || this);
      }
    }
  }

  /**
   * Initializes vertices for shadow casting.
   */
  initOpaqueVertices(): void {
    this.opaqueVertices = [
      {
        x: 0,
        y: 0,
      },
      {
        x: 0,
        y: 0,
      },
      {
        x: 0,
        y: 0,
      },
      {
        x: 0,
        y: 0,
      },
    ];
  }

  /**
   * Calculates vertices for shadow casting just before first shadow is cast since changed.
   * @returns {Array} vertices for shadow casting
   */
  getOpaqueVertices(): Vector2[] {
    const width = this.size.x;
    const height = this.size.y;

    const x = this.pos.x;
    const y = this.pos.y;

    // get offsets

    let opaqueOffset = this.opaqueOffset;

    // offset by animation and tile

    if (this.currentAnim && this.currentAnim.opaqueOffset) {
      opaqueOffset =
        (this.currentAnim.opaqueOffset.tiles && this.currentAnim.opaqueOffset.tiles[this.currentAnim.tile]) ||
        this.currentAnim.opaqueOffset;
    }

    const minX = x + opaqueOffset.left;
    const minY = y + opaqueOffset.top;
    const maxX = x + width + opaqueOffset.right;
    const maxY = y + height + opaqueOffset.bottom;

    const cX = x + width * 0.5;
    const cY = y + height * 0.5;

    const tl = this.opaqueVertices[0];
    const tr = this.opaqueVertices[1];
    const br = this.opaqueVertices[2];
    const bl = this.opaqueVertices[3];

    if (this.angle !== 0) {
      const cos = Math.cos(this.angle);
      const sin = Math.sin(this.angle);
      const dminX = minX - cX;
      const dminY = minY - cY;
      const dmaxX = maxX - cX;
      const dmaxY = maxY - cY;

      tl.x = cX + dminX * cos - dminY * sin;
      tl.y = cY + dminX * sin + dminY * cos;
      tr.x = cX + dmaxX * cos - dminY * sin;
      tr.y = cY + dmaxX * sin + dminY * cos;
      br.x = cX + dmaxX * cos - dmaxY * sin;
      br.y = cY + dmaxX * sin + dmaxY * cos;
      bl.x = cX + dminX * cos - dmaxY * sin;
      bl.y = cY + dminX * sin + dmaxY * cos;
    } else {
      tl.x = minX;
      tl.y = minY;
      tr.x = maxX;
      tr.y = minY;
      br.x = maxX;
      br.y = maxY;
      bl.x = minX;
      bl.y = maxY;
    }

    return this.opaqueVertices;
  }

  /**
   * Fill context with the shadow cast by this entity from a point within a light, constrained by the given bounds.
   * @param {ig.EntityLight} light to cast shadows from
   * @param {CanvasRenderingContext2D} context The canvas context onto which the shadows will be cast.
   * @param {Object} point point that represents where the light is coming from.
   * @param {Number} minX left position of light
   * @param {Number} minY top position of light
   * @param {Number} radius radius of light
   **/
  castShadow(
    light: plusplusEntityLight,
    context: CanvasRenderingContext2D,
    point: Vector2,
    minX: number,
    minY: number,
    radius: number
  ) {
    // ensure casting properties are ready

    if (!this._contours) {
      this._utilVec2Cast1 = {
        x: 0,
        y: 0,
      };
      this._utilVec2Cast2 = {
        x: 0,
        y: 0,
      };
      this._utilVec2Cast3 = {
        x: 0,
        y: 0,
      };
      this._utilVec2Cast4 = {
        x: 0,
        y: 0,
      };

      this._utilVec2Project1 = {
        x: 0,
        y: 0,
      };
      this._utilVec2Project2 = {
        x: 0,
        y: 0,
      };
      this._utilVec2Project3 = {
        x: 0,
        y: 0,
      };
      this._utilVec2Project4 = {
        x: 0,
        y: 0,
      };

      this._contourPool = [];
      this._contours = [];
    }

    if (this.opaqueFromVertices) {
      if (!this._verticesFound) {
        this.opaqueVertices = this.verticesWorld = this.getVerticesWorld();
      }
    } else {
      if (!this.opaqueVertices) {
        this.initOpaqueVertices();
      }

      if (!this._verticesFound) {
        this.getOpaqueVertices();
      }
    }

    this._verticesFound = true;

    // cast no shadows if light is within these bounds and this is not hollow

    if (!this.hollow && plusplusUtilsIntersection.pointInPolygon(point.x, point.y, this.opaqueVertices)) {
      return;
    }

    const alpha = this.diffuse >= 1 || light.diffuse >= 1 ? 1 : this.diffuse * light.diffuse;
    const opaqueVertices = this.opaqueVertices;
    const maxX = minX + radius * 2;
    const maxY = minY + radius * 2;
    let withinLight = false;
    const contourPool = this._contourPool;
    let contours = this._contours;
    let contour, contourVertices;
    let contourOther, contourOtherVertices;
    let oa, ob, oc, od, combined;
    let a = opaqueVertices[opaqueVertices.length - 1],
      b,
      c,
      d;
    let i, il, j, jl, k, kl;

    // check each segment;

    for (i = 0, il = opaqueVertices.length; i < il; i++) {
      b = opaqueVertices[i];

      // check if line is within light

      let abMinX;
      let abMinY;
      let abMaxX;
      let abMaxY;

      if (a.x < b.x) {
        abMinX = a.x;
        abMaxX = b.x;
      } else {
        abMinX = b.x;
        abMaxX = a.x;
      }

      if (a.y < b.y) {
        abMinY = a.y;
        abMaxY = b.y;
      } else {
        abMinY = b.y;
        abMaxY = a.y;
      }

      if (plusplusUtilsIntersection.AABBIntersect(abMinX, abMinY, abMaxX, abMaxY, minX, minY, maxX, maxY)) {
        withinLight = true;

        // check if line is facing away from point
        // dot gives us angle domain between normal of A to B and vector pointing from point to A
        // dot > 0 = angle < 90, so line would be facing away

        const aToB = plusplusUtilsVector2.copy(this._utilVec2Cast1, b);
        plusplusUtilsVector2.subtract(aToB, a);
        const normal = plusplusUtilsVector2.set(this._utilVec2Cast2, aToB.y, -aToB.x);
        const pointToA = plusplusUtilsVector2.copy(this._utilVec2Cast3, a);
        plusplusUtilsVector2.subtract(pointToA, point);

        if (plusplusUtilsVector2.dot(normal, pointToA) > 0) {
          const pointToB = plusplusUtilsVector2.copy(this._utilVec2Cast4, b);
          plusplusUtilsVector2.subtract(pointToB, point);

          // project a and b to edge of light and get shape

          contourPool.push({
            vertices: this.projectShadow(point, radius, a, b, pointToA, pointToB, aToB),
            verticesActual: [a, b],
            verticesHollow: [],
          });
        }
      }

      a = b;
    }

    if (withinLight) {
      // process contours and combine any touching

      for (i = 0, il = contourPool.length; i < il; i++) {
        contour = contourPool[i];
        contourVertices = contour.vertices;
        combined = false;

        a = contourVertices[0];
        b = contourVertices[1];
        c = contourVertices[contourVertices.length - 2];
        d = contourVertices[contourVertices.length - 1];

        // check every following contour for duplicate start or end

        for (j = i + 1; j < il; j++) {
          contourOther = contourPool[j];
          contourOtherVertices = contourOther.vertices;
          oa = contourOtherVertices[0];
          ob = contourOtherVertices[1];
          oc = contourOtherVertices[contourOtherVertices.length - 2];
          od = contourOtherVertices[contourOtherVertices.length - 1];

          // discard b, and od, and join contours [ contourOther, contour ] with a at end
          if (plusplusUtilsVector2.equal(a, od) && plusplusUtilsVector2.equal(b, oc)) {
            combined = true;

            contourPool[j] = {
              vertices: contourOtherVertices.slice(0, -1).concat(contourVertices.slice(2)),
              verticesActual: contourOther.verticesActual.slice(0, -1).concat(contour.verticesActual),
              verticesHollow: contour.verticesHollow.concat(a, contourOther.verticesHollow),
            };

            break;
          }
          // discard d, oa, and ob and join contours [ contour, contourOther ]
          else if (plusplusUtilsVector2.equal(c, ob) && plusplusUtilsVector2.equal(d, oa)) {
            combined = true;

            contourPool[j] = {
              vertices: contourVertices.slice(0, -1).concat(contourOtherVertices.slice(2)),
              verticesActual: contour.verticesActual.slice(0, -1).concat(contourOther.verticesActual),
              verticesHollow: contourOther.verticesHollow.concat(d, contour.verticesHollow),
            };

            break;
          }
        }

        if (combined !== true) {
          contours.push(contour);
        }
      }

      // fill in this shape
      // check all contours and for any with a matching vertex, combine into one contour

      if (!this.hollow) {
        const vertices = opaqueVertices.slice(0);

        const connections: Record<string, any> = {};
        let connection: Vector2[] = [];
        let connected = false;

        // walk self vertices
        // check for any vertices in self that match contour's actual vertices
        // create connections between contours from vertices that do not match

        for (i = 0, il = vertices.length; i < il; i++) {
          const vertex = vertices[i];
          let matched = false;

          for (j = 0, jl = contours.length; j < jl; j++) {
            contour = contours[j];
            const contourVerticesActual = contour.verticesActual;

            for (k = 0, kl = contourVerticesActual.length; k < kl; k++) {
              const vertexActual = contourVerticesActual[k];

              if (vertex.x === vertexActual.x && vertex.y === vertexActual.y) {
                matched = true;

                if (connection) {
                  connections[j === 0 ? jl - 1 : j - 1] = connection;
                  connection = undefined;
                  connected = true;
                }

                break;
              }
            }

            if (matched === true) {
              break;
            }
          }

          // not matched, put into last connection

          if (matched === false) {
            if (!connection) {
              connection = [];
            }

            connection.push(vertex);
          }
        }

        // handle last connection

        if (connection) {
          connections[jl - 1] =
            connection !== connections[jl - 1] ? connection.concat(connections[jl - 1] || []) : connection;
        }

        // if at least one connection
        // combine all contours and connections

        if (connected) {
          const contourConnected = {
            vertices: [] as Vector2[],
          };

          for (i = 0, il = contours.length; i < il; i++) {
            contour = contours[i];

            // add contour and connection

            contourConnected.vertices = contourConnected.vertices.concat(contour.vertices, connections[i] || []);
          }

          contours = [contourConnected];
        }
        // no connections so just add self
        else {
          contours.push({
            vertices: vertices,
          });
        }
      }
      // add all hollow vertices to end of contours
      else {
        for (i = 0, il = contours.length; i < il; i++) {
          contour = contours[i];

          contour.vertices = contour.vertices.concat(contour.verticesHollow);
        }
      }

      // draw each contour

      if (light.pixelPerfect) {
        for (i = 0, il = contours.length; i < il; i++) {
          contour = contours[i];
          plusplusUtilsDraw.pixelFillPolygon(
            context,
            minX,
            minY,
            maxX,
            maxY,
            contour.vertices,
            1,
            1,
            1,
            alpha,
            true,
            plusplusUtilsIntersection.boundsOfPoints(contour.vertices)
          );
        }
      } else {
        context.fillStyle = plusplusUtilsColor.RGBAToCSS(1, 1, 1, alpha);

        for (i = 0, il = contours.length; i < il; i++) {
          contour = contours[i];
          plusplusUtilsDraw.fillPolygon(context, contour.vertices, -minX, -minY, light.scale);
        }
      }

      // clear contour lists

      contourPool.length = contours.length = 0;
    }
  }

  /**
   * Projects an edge based on an point.
   * @param {Vector2|Object} point 2d point to project from.
   * @param {Number} radius
   * @param {Object} a edge vertex a.
   * @param {Object} b edge vertex b.
   * @param {Vector2|Object} pointToA 2d vector from point to vertex a.
   * @param {Vector2|Object} pointToB 2d vector from point to vertex b.
   * @param {Object} aToB 2d vector from vertex a to vertex b.
   * @returns {Array} vertices of the shape cast by light from edge.
   **/
  projectShadow(
    point: Vector2,
    radius: number,
    a: Vector2,
    b: Vector2,
    pointToA: Vector2,
    pointToB: Vector2,
    aToB: Vector2
  ): Vector2[] {
    const pointToAB = this._utilVec2Project1; // projected point of point to [a, b]
    const invOriginToA = plusplusUtilsVector2.copy(this._utilVec2Project2, pointToA);
    plusplusUtilsVector2.inverse(invOriginToA);

    const t = plusplusUtilsVector2.dot(aToB, invOriginToA) / plusplusUtilsVector2.lengthSquared(aToB);

    if (t < 0) {
      plusplusUtilsVector2.copy(pointToAB, a);
    } else if (t > 1) {
      plusplusUtilsVector2.copy(pointToAB, b);
    } else {
      plusplusUtilsVector2.copy(pointToAB, a);

      const n = plusplusUtilsVector2.copy(this._utilVec2Project3, aToB);
      plusplusUtilsVector2.multiplyScalar(n, t);
      plusplusUtilsVector2.add(pointToAB, n);
    }

    const pointToM = plusplusUtilsVector2.copy(this._utilVec2Project4, pointToAB);
    plusplusUtilsVector2.subtract(pointToM, point);

    // normalize to radius

    plusplusUtilsVector2.normalize(pointToM);
    plusplusUtilsVector2.multiplyScalar(pointToM, radius);

    plusplusUtilsVector2.normalize(pointToA);
    plusplusUtilsVector2.multiplyScalar(pointToA, radius);

    plusplusUtilsVector2.normalize(pointToB);
    plusplusUtilsVector2.multiplyScalar(pointToB, radius);

    // project points

    const ap = plusplusUtilsVector2.clone(a);
    plusplusUtilsVector2.add(ap, pointToA);

    const bp = plusplusUtilsVector2.clone(b);
    plusplusUtilsVector2.add(bp, pointToB);

    // return in clockwise order, with intermediary points to ensure full cover
    // if t < 0, ap === oam, so ignore intermediary oam
    // if t > 1, bp === obm, so ignore intermediary obm

    let oam, obm;

    if (t < 0) {
      obm = plusplusUtilsVector2.clone(b);
      plusplusUtilsVector2.add(obm, pointToM);

      return [a, ap, obm, bp, b];
    } else if (t > 1) {
      oam = plusplusUtilsVector2.clone(a);
      plusplusUtilsVector2.add(oam, pointToM);

      return [a, ap, oam, bp, b];
    } else {
      oam = plusplusUtilsVector2.clone(a);
      plusplusUtilsVector2.add(oam, pointToM);

      obm = plusplusUtilsVector2.clone(b);
      plusplusUtilsVector2.add(obm, pointToM);

      return [a, ap, oam, obm, bp, b];
    }
  }

  activate(entity?: plusplusEntityExtended): void {
    this.activated = true;

    // do activate callback
    // useful for entities that are built dynamically
    // instead of predefined entity classes

    if (this.activateCallback) {
      this.activateCallback.call(this.activateContext || this, entity);
    }
  }

  /**
   * Do some deactivated behavior.
   * @param {Entity} [entity] causing deactivation.
   **/
  deactivate(entity?: plusplusEntityExtended): void {
    this.activated = false;

    // do deactivate callback
    // useful for entities that are built dynamically
    // instead of predefined entity classes

    if (this.deactivateCallback) {
      this.deactivateCallback.call(this.deactivateContext || this, entity);
    }
  }

  /**
   * Toggles between activate and deactivate.
   * @param {Entity} [entity] causing deactivation.
   */
  toggleActivate(entity: plusplusEntityExtended): void {
    if (!this.alwaysToggleActivate && this.activated) {
      this.deactivate(entity);
    } else {
      this.activate(entity);
    }
  }

  /**
   * Sets {@link plusplusEntityExtended#hidden}.
   * @param {Boolean} [hidden=false] whether entity should be hidden.
   */
  setHidden(hidden?: boolean): void {
    if (hidden) {
      this.hide();
    } else {
      this.unhide();
    }
  }

  /**
   * Sets {@link plusplusEntityExtended#hidden} to true.
   */
  hide(): void {
    this.hidden = true;
  }

  /**
   * Sets {@link plusplusEntityExtended#hidden} to false.
   */
  unhide(): void {
    this.hidden = false;
  }

  /**
   * Simple fade to specified alpha. Only tweens if not already at alpha, but onUpdate and onComplete methods are guaranteed to call at least once.
   * @param {Number} alpha alpha value between 0 and 1.
   * @param {Object} [settings] settings for tween.
   * @returns {Tween} tween object if tweening to alpha.
   **/
  fadeTo(alpha: number, settings: Record<string, any>): Tween {
    if (this.alpha !== alpha) {
      // default settings

      settings = ig.merge(
        {
          name: "fade",
          duration: plusplusConfig.DURATION_FADE,
        },
        settings
      );

      return this.tween(
        {
          alpha: alpha || 0,
        },
        settings
      );
    } else if (settings) {
      if (settings.onUpdate) {
        settings.onUpdate();
      }

      if (settings.onComplete) {
        settings.onComplete();
      }
    }
  }

  /**
   * Convenience function for tween fade to max alpha.
   * @param {Object} [settings] settings for tween.
   * @returns {Tween} tween object.
   **/
  fadeIn(settings: Record<string, any>): Tween {
    return this.fadeTo(1, settings);
  }

  /**
   * Convenience function for tween fade out.
   * @param {Object} [settings] settings for tween.
   * @returns {Tween} tween object.
   **/
  fadeOut(settings: Record<string, any>): Tween {
    return this.fadeTo(0, settings);
  }

  /**
   * Convenience function for tween fade out and then kill.
   * @param {Object} [settings] settings for tween.
   * @returns {Tween} tween object.
   **/
  fadeToDeath(settings: Record<string, any>): Tween {
    settings = settings || {};

    // insert complete callback to kill this entity

    const onCompleteOriginal = settings.onComplete;

    settings.onComplete = function () {
      ig.game.removeEntity(this);

      if (onCompleteOriginal) {
        onCompleteOriginal();
      }
    };

    return this.fadeTo(0, settings);
  }

  /**
   * Simple tween of specified properties.
   * <span class="alert"><strong>IMPORTANT:</strong> make sure this entity has all tweening properties.</span>
   * @param {Object} properties property values on entity.
   * @param {Object} [settings] settings for tween, based on {@link ig.TWEEN.tween}.
   * @returns {Tween} tween object.
   **/
  tween(properties: Record<string, any>, settings: Record<string, any>): Tween {
    settings = settings || {};

    // stop previous tween

    const name = settings.name || "tween";
    const tween = this.tweens[name];
    if (tween) {
      tween.stop();
    }

    // set up auto complete and delete

    if (!settings.noComplete) {
      const onComplete = settings.onComplete;

      settings.onComplete = function () {
        delete this.tweens[name];

        if (typeof onComplete === "function") {
          onComplete();
        }
      }.bind(this);
    }

    // tween

    return (this.tweens[name] = plusplusTween.tween(this, properties, settings));
  }

  /**
   * Stops tweens on this entity.
   * <span class="alert"><strong>IMPORTANT:</strong> if no specific tween name passed, will stop all tweens.</span>
   * @param {String} [name] name of specific tween.
   **/
  tweenEnd(name?: string): void {
    // name of specific tween passed

    if (name) {
      const tween = this.tweens[name];

      if (tween) {
        tween.stop();
        delete this.tweens[name];
      }
    }
    // clear all tweens
    else {
      for (name in this.tweens) {
        this.tweenEnd(name);
      }
    }
  }

  /**
   * Moves to an item, which can be an entity or a position.
   * @param {plusplusEntityExtended|Vector2|Object} item entity with bounds or position with x and y properties.
   * @param {Object} [settings] settings for move.
   * @returns {Boolean} whether a new move to has been started
   * @example
   * // settings is a plain object
   * settings = {};
   * // to ensure entity follows other properly
   * settings.matchPerformance = true;
   * // to move to only once
   * settings.once = true;
   * // follow defaults to aligning at center of followed
   * // to follow at the top left instead of center
   * settings.align = { x: 0, y: 0 };
   * // to follow and flip with whatever we're moving to
   * settings.flipWith = true;
   * // to follow offset by 10 px
   * settings.offset = { x: 10, y: 10 };
   * // to follow above
   * settings.offsetPct = { x: 0, y: -1 };
   * // to follow at a random offset between -0.25 and 0.25 on both axes
   * settings.randomOffsetPct = { x: 0.25, y: 0.25 };
   * // a lerp between 0 and 1 will cause a smooth follow
   * settings.lerp = 0.1;
   * // a tweened follow with optional tween settings based on {@link plusplusEntityExtended#tween}
   * settings.tween = true;
   * settings.tweenSettings = {...};
   */
  moveTo(
    item: plusplusEntityExtended | Vector2 | plusplusEntityExtended[] | Vector2[],
    settings: Record<string, any>
  ): boolean {
    // not already moving to

    if (item && this.movingTo !== item) {
      // clear previous

      this.moveToStop();

      settings = settings || {};

      // check if is sequence

      if (Array.isArray(item)) {
        if (item.length === 0) {
          return;
        }

        // copy entity sequence

        this.movingToSequence = item.slice(0);

        // move to first

        item = this.movingToSequence.shift();

        if (this.movingTo === item) {
          return;
        }

        // moveTo shouldn't be more than once

        this.movingToOnce = true;
      }

      // check moving to once

      if (typeof settings.once !== "undefined") {
        this.movingToOnce = settings.once;
      }

      // handle performance

      let singleMove = !this.fixed && this.performance === plusplusEntityExtended.PERFORMANCE.STATIC;

      if (item instanceof plusplusEntityExtended) {
        // match performance of entity to follow
        // this ensures static entities will be able to follow non static
        // and that entities ignoring system scale will follow correctly through resize

        if (
          (settings.matchPerformance || this.ignoreSystemScale || this.scale !== ig.system.scale) &&
          this.performance !== plusplusEntityExtended.PERFORMANCE.MOVABLE
        ) {
          this.setPerformance(plusplusEntityExtended.PERFORMANCE.MOVABLE);

          singleMove = false;
        }
      }

      // random offsets

      if (settings.randomOffsetPct) {
        // set base in case settings are reused

        settings.baseOffsetPct = settings.baseOffsetPct ||
          settings.offsetPct || {
            x: 0,
            y: 0,
          };

        // ensure random offset has both x and y

        const randomOffsetPct = settings.randomOffsetPct;

        randomOffsetPct.x = randomOffsetPct.x || 0;
        randomOffsetPct.y = randomOffsetPct.y || 0;

        // combine base offset with random offset

        settings.offsetPct = {
          x: settings.baseOffsetPct.x + (Math.random() * 2 * randomOffsetPct.x - randomOffsetPct.x),
          y: settings.baseOffsetPct.y + (Math.random() * 2 * randomOffsetPct.y - randomOffsetPct.y),
        };
      }

      // no need to constantly follow if this is not movable or item to follow is static, and not lerping or tweening

      if (singleMove && !settings.lerp && !settings.tween) {
        this.moveToPosition(item, settings);
        this.recordChanges();
      } else {
        // make sure we are not frozen

        this.frozen = false;

        this.movingTo = item;
        this.movedTo = false;
        this.movingToSettings = settings;

        // moveTo is a tween

        if (settings.tween && this.performance !== plusplusEntityExtended.PERFORMANCE.DYNAMIC) {
          this.movingToTweening = true;
          this.movingToTweenPct = 0;
          this.movingToTweenX = this.pos.x;
          this.movingToTweenY = this.pos.y;

          // tween settings

          const tweenSettings = (settings.tweenSettings = settings.tweenSettings || {});
          tweenSettings.name = "movingTo";
          tweenSettings.onComplete = function () {
            this.moveToUpdate();
            this.moveToComplete();
          }.bind(this);

          // tween pct to 1

          this.tween(
            {
              movingToTweenPct: 1,
            },
            tweenSettings
          );
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Moves to next in current sequence of moving to entities.
   **/
  moveToSequenceNext(): void {
    // moving to sequence

    if (this.movingToSequence) {
      // another to move to

      if (this.movingToSequence.length > 0) {
        // remove moving to temporarily so moveTo doesn't reset properties

        this.movingTo = null;

        this.moveTo(this.movingToSequence.shift(), this.movingToSettings);
      }
      // none left, end sequence
      else {
        this.movingToSequence = undefined;
        this.moveToComplete();
        this.moveToStop();
      }
    }
  }

  /**
   * Updates any moveTo in progress.
   **/
  moveToUpdate(): void {
    if (this.movingTo && (!this.movedTo || this.movingTo.changed)) {
      this.moveToPosition(this.movingTo, this.movingToSettings);
    }
  }

  /**
   * Positions this entity relative to moving to item based on settings.
   * @param {plusplusEntityExtended|Vector2|Object} item item to move to.
   * @param {Object} [settings] settings object.
   * @see plusplusEntityExtended#moveTo
   **/
  moveToPosition(item: plusplusEntityExtended | Vector2, settings: Record<string, any>): void {
    let targetX = 0;
    let targetY = 0;
    let alignX = 0.5;
    let alignY = 0.5;

    // item is entity and needs different handling

    if (item instanceof plusplusEntityExtended) {
      if (settings) {
        let align = settings.align;

        if (align) {
          if (typeof align.x !== "undefined") {
            alignX = align.x;
          }

          if (typeof align.y !== "undefined") {
            alignY = align.y;
          }
        }

        let offset = settings.offset;

        if (offset) {
          targetX += offset.x * item.scaleMod || 0;
          targetY += offset.y * item.scaleMod || 0;
        }

        const offsetPct = settings.offsetPct;

        if (offsetPct) {
          let offsetX = offsetPct.x || 0;
          let offsetY = offsetPct.y || 0;

          targetX +=
            offsetX * (item.size.x * 0.5 * item.scaleMod + this.size.x * 0.5 * this.scaleMod) * (item.flip.x ? -1 : 1);
          targetY += offsetY * (item.size.y * 0.5 * item.scaleMod + this.size.y * 0.5 * this.scaleMod);
        }

        if (settings.flipWith) {
          this.flip.x = item.flip.x;
          this.flip.y = item.flip.y;
        }
      }

      targetX += item.pos.x + alignX * (item.size.x * item.scaleMod - this.size.x * this.scaleMod);
      targetY += item.pos.y + alignY * (item.size.y * item.scaleMod - this.size.y * this.scaleMod);

      if (this.fixed) {
        if (!item.fixed) {
          targetX -= ig.game.screen.x;
          targetY -= ig.game.screen.y;
        }
      } else {
        if (item.fixed) {
          targetX += ig.game.screen.x;
          targetY += ig.game.screen.y;
        }
      }
    }
    // assume item is position
    else {
      if (settings) {
        const align = settings.align;

        if (align) {
          if (typeof align.x !== "undefined") {
            alignX = align.x;
          }

          if (typeof align.y !== "undefined") {
            alignY = align.y;
          }
        }

        const offset = settings.offset;

        if (offset) {
          targetX += offset.x || 0;
          targetY += offset.y || 0;
        }

        const offsetPct = settings.offsetPct;

        if (offsetPct) {
          const offsetX = offsetPct.x || 0;
          const offsetY = offsetPct.y || 0;

          targetX += offsetX * this.size.x * 0.5;
          targetY += offsetY * this.size.y * 0.5;
        }
      }

      targetX += item.x + alignX * this.size.x;
      targetY += item.y + alignY * this.size.y;

      if (this.fixed) {
        targetX -= ig.game.screen.x;
        targetY -= ig.game.screen.y;
      }
    }

    const dx = targetX - this.pos.x;
    const dy = targetY - this.pos.y;

    // tween

    if (this.movingToTweening) {
      this.pos.x = this.movingToTweenX + (targetX - this.movingToTweenX) * this.movingToTweenPct;
      this.pos.y = this.movingToTweenY + (targetY - this.movingToTweenY) * this.movingToTweenPct;
    }
    // lerp
    else if (settings && settings.lerp) {
      this.pos.x += dx * settings.lerp;
      this.pos.y += dy * settings.lerp;
    }
    // instantly
    else {
      this.pos.x = targetX;
      this.pos.y = targetY;
    }

    // check if done

    if (
      plusplusUtilsMath.almostEqual(dx, 0, plusplusConfig.PRECISION_ZERO) &&
      plusplusUtilsMath.almostEqual(dy, 0, plusplusConfig.PRECISION_ZERO)
    ) {
      this.moveToComplete();
    }
  }

  /**
   * Called when moved to complete.
   * @returns {Boolean} true when move is completed, otherwise is continuing sequence.
   **/
  moveToComplete(): boolean {
    // continue sequence

    if (this.movingToSequence) {
      this.moveToSequenceNext();
    }
    // complete
    else {
      // end move to if only moving to once

      if (this.movingToOnce) {
        this.moveToStop();
      }

      this.movedTo = true;

      this.onMovedTo.dispatch(this);

      return true;
    }
  }

  /**
   * Ends any moveTo in progress.
   **/
  moveToStop(): void {
    if (this.movingTo) {
      if (this.movingToTweening) {
        this.tweenEnd("movingTo");

        this.movingToTweenPct = this.movingToTweenX = this.movingToTweenY = 0;
      }

      this.movedTo = this.movingToTweening = this.movingToOnce = false;
      this.movingTo = this.movingToSettings = this.movingToSequence = null;
    }
  }

  /**
   * Stops all movement immediately.
   **/
  moveAllStop(): void {
    this.moveToStop();
    this.applyAntiVelocity();
  }

  /**
   * Flips entity to face a target entity or position.
   * @param {plusplusEntityExtended|Vector2|Object} target target to look at.
   **/
  lookAt(target: plusplusEntityExtended | Vector2): void {
    // target is not self and not fixed

    if (target && this !== target && !target.fixed) {
      const centerX = this.pos.x + this.size.x * 0.5;
      let centerY;
      let targetCenterX;
      let targetCenterY;

      if (plusplusConfig.TOP_DOWN) {
        centerY = this.pos.y + this.size.y * 0.5;

        if (target instanceof plusplusEntityExtended) {
          targetCenterX = target.pos.x + target.size.x * 0.5;
          targetCenterY = target.pos.y + target.size.y * 0.5;
        } else {
          targetCenterX = target.x;
          targetCenterY = target.y;
        }

        const xDiff = centerX - targetCenterX;
        const yDiff = centerY - targetCenterY;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
          this.facing.y = 0;

          if (xDiff > 0) {
            this.flip.x = this.canFlipX;
            this.facing.x = -1;
          } else {
            this.flip.x = false;
            this.facing.x = 1;
          }
        } else {
          this.facing.x = 0;

          if (yDiff > 0) {
            this.flip.y = this.canFlipY;
            this.facing.y = -1;
          } else {
            this.flip.y = false;
            this.facing.y = 1;
          }
        }
      } else {
        if (target instanceof plusplusEntityExtended) {
          targetCenterX = target.pos.x + target.size.x * 0.5;
        } else {
          targetCenterX = target.x;
        }

        if (centerX > targetCenterX) {
          this.flip.x = this.canFlipX;
          this.facing.x = -1;
        } else {
          this.flip.x = false;
          this.facing.x = 1;
        }
      }
    }
  }

  /**
   * Whether this entity can see another in a direct line of sight.
   * @param {plusplusEntityExtended} entity entity to check against.
   * @returns {Boolean} if sees other.
   **/
  lineOfSight(entity: plusplusEntityExtended) {
    if (entity.hidden) {
      return false;
    }

    const collisionMap = ig.game.collisionMap;
    const tilesize = collisionMap.tilesize;

    let cX = ((this.pos.x + this.size.x * 0.5) / tilesize) | 0;
    let cY = ((this.pos.y + this.size.y * 0.5) / tilesize) | 0;
    const ecX = ((entity.pos.x + entity.size.x * 0.5) / tilesize) | 0;
    const ecY = ((entity.pos.y + entity.size.y * 0.5) / tilesize) | 0;

    const dX = ecX - cX;
    const dY = ecY - cY;
    const length = Math.sqrt(dX * dX + dY * dY);
    const dirX = dX / length;
    const dirY = dY / length;

    cX = Math.round(cX + dirX);
    cY = Math.round(cY + dirY);

    // walk tiles in direction

    for (let i = 0, il = (length | 0) - 2; i < il; i++) {
      const tileX = cX | 0;
      const tileY = cY | 0;
      const tileId = collisionMap.data[tileY][tileX];

      // hit unwalkable tile

      if (!plusplusUtilsTile.isTileWalkableStrict(tileId)) {
        return false;
      }

      cX += dirX;
      cY += dirY;
    }

    return true;
  }

  /**
   * Does damage to entity while checking if invulnerable.
   * @param {Number} amount amount of damage.
   * @param {plusplusEntityExtended} [from] entity causing damage.
   * @param {Boolean} [unblockable] whether damage cannot be blocked.
   * @returns {Boolean} whether damage was applied.
   **/
  override receiveDamage(amount: number, from: plusplusEntityExtended, unblockable?: boolean): boolean {
    // check if invulnerable

    if ((!this.invulnerable || unblockable) && amount) {
      this.health -= amount;

      if (this.health <= 0) {
        this.kill();
      }

      return true;
    }

    // nothing happened

    return false;
  }

  /**
   * Called automatically by {@link ig.GameExtended#PlayerManager} when managing entity as if player were playing them.
   */
  manageStart(): void {
    this.managed = true;
  }

  /**
   * Called automatically by {@link ig.GameExtended#PPlayerManager} when done managing entity.
   */
  manageStop(): void {
    this.managed = false;
  }

  /**
   * Pauses entity.
   */
  pause(): void {
    this.paused = true;

    let anim;
    let tween;

    // animations

    for (const name in this.anims) {
      anim = this.anims[name];

      if (anim) {
        anim.timer.pause();
      }
    }

    // tweens

    for (const name in this.tweens) {
      tween = this.tweens[name];

      if (tween) {
        tween.pause();
      }
    }
  }

  /**
   * Unpauses entity.
   */
  unpause(): void {
    this.paused = false;

    let anim;
    let tween;

    // animations

    for (const name in this.anims) {
      anim = this.anims[name];

      if (anim) {
        anim.timer.unpause();
      }
    }

    // tweens

    for (const name in this.tweens) {
      tween = this.tweens[name];

      if (tween) {
        tween.unpause();
      }
    }
  }

  /**
   * Links entity to another entity, making original refresh after the entity it is linked to.
   * <span class="alert alert-info"><strong>Tip:</strong> this allows for entity chaining and pseudo parent/child transforms.</span>
   * @param {plusplusEntityExtended} entity to link to.
   * @param {Boolean} [refresh=true] whether to refresh after linking.
   **/
  link(entity: plusplusEntityExtended, refresh?: boolean): void {
    if (entity !== this) {
      // remove previous

      this.unlink(false);

      // setup new

      this.linkedTo = entity;

      // swap listen to game refresh with listen to linked refresh

      if (this.linkedTo) {
        ig.system.onResized.remove(this.refresh, this);

        if (!this._killed) {
          this.linkedTo.onRefreshed.add(this.refresh, this);
          this.linkedTo.onRemoved.add(this.unlink, this);
        }
      }

      // refresh self

      if (refresh !== false && !this._killed) {
        this.refresh(true);
      }
    }
  }

  /**
   * Unlinks entity from whatever it was linked to.
   * @param {Boolean} [refresh=true] whether to refresh after unlinking.
   **/
  unlink(refresh?: boolean): void {
    if (this.linkedTo) {
      this.linkedTo.onRefreshed.remove(this.refresh, this);
      this.linkedTo.onRemoved.remove(this.unlink, this);

      if (!this._killed) {
        ig.system.onResized.add(this.refresh, this);
      }

      this.linkedTo = null;
    }

    // refresh self

    if (refresh !== false && !this._killed) {
      this.refresh(true);
    }
  }

  /**
   * Kills entity and shows optional effects, animation, etc via {@link plusplusEntityExtended#death}.
   * <br>- this is not the same as {@link ig.GameExtended#removeEntity}
   * @param {Boolean} [silent] whether to die without effects or animation.
   * @see ig.Entity.
   */
  kill(silent?: boolean): void {
    if (!this.dieing) {
      this.dieing = true;
      this.dieingSilently = silent || false;

      if (!silent) {
        this.death();
      } else {
        this.die();
      }
    }
  }

  /**
   * Shows death animation, automatically called when entity is first killed.
   * <span class="alert"><strong>Tip:</strong> it is not recommended to call this method, but it is fine to override it!</span>
   * @param {String} [animNameDeath="death" + direction] name of death animation to play
   */
  death(animNameDeath?: string): void {
    // try to guess death animation name

    if (!animNameDeath || !this.anims[animNameDeath]) {
      animNameDeath = this.getDirectionalAnimName("death");
    }

    if (this.anims[animNameDeath]) {
      // flag as killed

      ig.game.flagAsKilled(this);

      // clear velocity

      this.applyAntiVelocity();

      // play death animation and then die

      this.animOverride(animNameDeath, {
        callback: this.die,
      });
    } else {
      this.die();
    }
  }

  /**
   * Automatically called after entity finished being killed.
   * <span class="alert"><strong>IMPORTANT:</strong> for full animated death, use {@link plusplusEntityExtended#kill} instead.</span>
   */
  die(): void {
    ig.game.removeEntity(this);
  }

  /**
   * Does cleanup on entity as it is added to deferred removal list.
   **/
  cleanup(): void {
    // if persistent and needs to cleanup persistent additions

    if (this._cleanupPersistent) {
      this._cleanupPersistent = false;
      this.cleanupPersistent();
    }

    this.unhide();

    this.tweenEnd();
    this.moveAllStop();

    this.unlink(false);

    this.animRelease();
    this.currentAnim = null;

    // signals

    this.onRemoved.dispatch(this);
    ig.system.onResized.remove(this.refresh, this);

    // clean signals when game has no level

    if (!ig.game.hasLevel) {
      this.onAdded.removeAll();
      this.onAdded.forget();
      this.onRemoved.removeAll();
      this.onRemoved.forget();
      this.onMovedTo.removeAll();
      this.onMovedTo.forget();
      this.onRefreshed.removeAll();
      this.onRefreshed.forget();

      for (const animName in this.anims) {
        const anim = this.anims[animName];

        anim.onCompleted.removeAll();
        anim.onCompleted.forget();
      }
    }
  }

  /**
   * Does cleanup on persistent changes to game made by this entity, ex: UI elements.
   */
  cleanupPersistent(): void {}

  /**
   * Cleans entity of previous collision properties just before new collision checks.
   */
  cleanupCollision(): void {
    this.wasChecking = this.checking;
    this.checking = this.intersecting = this.collidingWithEntitiesBelow = false;
  }

  /**
   * Called when two entities intersect, regardless of collides and before checks or collisions.
   * @param {plusplusEntityExtended} entity entity intersecting.
   **/
  intersectWith(entity: plusplusEntityExtended): void {
    this.intersecting = true;
  }

  /**
   * Checks this entity against another entity that matches this entity's {@link plusplusEntityExtended#type}.
   * @param {plusplusEntityExtended} [entity] other entity.
   * @see ig.Entity.
   **/
  override check(entity: plusplusEntityExtended): void {
    this.checking = true;
  }

  /**
   * Collides with another entity along a specified axis.
   * @param {plusplusEntityExtended} entity entity colliding with.
   * @param {Number} dirX horizontal direction of colliding entity
   * @param {Number} dirY vertical direction of colliding entity
   * @param {Number} nudge nudge amount in direction
   * @param {Number} vel velocity in direction
   * @param {Boolean} weak weak colliding entity (i.e. only weak moves)
   */
  override collideWith(
    entity: plusplusEntityExtended,
    dirX: number,
    dirY: number,
    nudge: number,
    vel: number,
    weak: plusplusEntityExtended
  ): void {
    let res;
    let nudgeX;

    if (weak) {
      if (this === weak) {
        // horizontal separation

        if (dirX !== 0) {
          if (plusplusUtilsMath.oppositeSidesOfZero(this.vel.x, dirX)) {
            this.vel.x += entity.vel.x;
          } else {
            this.vel.x = -this.vel.x * this.bounciness + entity.vel.x;
          }

          res = ig.game.collisionMap.trace(
            this.pos.x,
            this.pos.y,
            nudge,
            0,
            this.size.x,
            this.size.y,
            this.collisionMapResult
          );
        }
        // vertical separation
        else {
          this.vel.y = -this.vel.y * this.bounciness + entity.vel.y;

          // on a moving entity that collides fixed (ex: platform)

          nudgeX = 0;

          if (dirY > 0) {
            this.collidingWithEntitiesBelow = true;

            if (
              (entity.collides >= plusplusEntityExtended.COLLIDES.FIXED ||
                this.collides === plusplusEntityExtended.COLLIDES.LITE) &&
              Math.abs(this.vel.y - entity.vel.y) < this.minBounceVelocity
            ) {
              this.setGrounded();

              if (entity.moving) {
                nudgeX = entity.pos.x - entity.last.x;
              }
            }
          }

          res = ig.game.collisionMap.trace(
            this.pos.x,
            this.pos.y,
            nudgeX,
            nudge,
            this.size.x,
            this.size.y,
            this.collisionMapResult
          );
        }

        // record changes and check bounds to account for collision if this was not strong in the collision
        // because collision will likely only change positions, check for position change here instead of in record changes
        // record changes tends to check more than just position, which in this case is unnecessary

        if (res.pos.x !== this.pos.x || res.pos.y !== this.pos.y) {
          this.pos.x = res.pos.x;
          this.pos.y = res.pos.y;

          this.recordChanges(true);
        }
      }
    } else {
      // horizontal separation

      if (dirX !== 0) {
        this.vel.x = vel;

        res = ig.game.collisionMap.trace(
          this.pos.x,
          this.pos.y,
          nudge * 0.5,
          0,
          this.size.x,
          this.size.y,
          this.collisionMapResult
        );
      }
      // vertical separation
      else {
        let unfair;

        if (dirY > 0) {
          this.collidingWithEntitiesBelow = true;

          nudgeX =
            entity.collides >= plusplusEntityExtended.COLLIDES.FIXED ||
            this.collides === plusplusEntityExtended.COLLIDES.LITE
              ? entity.vel.x * ig.system.tick
              : 0;
          unfair = entity.grounded && entity.collidingWithMap;
        } else {
          if (this.grounded && this.collidingWithMap) {
            return;
          }

          nudgeX = 0;
        }

        // unfair collision
        // only this should be moved

        if (unfair) {
          res = ig.game.collisionMap.trace(
            this.pos.x,
            this.pos.y,
            nudgeX,
            nudge,
            this.size.x,
            this.size.y,
            this.collisionMapResult
          );

          if (this.bounciness > 0 && this.vel.y > this.minBounceVelocity) {
            this.vel.y *= -this.bounciness;
          } else {
            this.setGrounded();
          }
        } else {
          this.vel.y = vel;

          res = ig.game.collisionMap.trace(
            this.pos.x,
            this.pos.y,
            nudgeX,
            nudge * 0.5,
            this.size.x,
            this.size.y,
            this.collisionMapResult
          );
        }
      }

      // record changes and check bounds to account for collision if this was not strong in the collision
      // because collision will likely only change positions, check for position change here instead of in record changes
      // record changes tends to check more than just position, which in this case is unnecessary

      if (res && (res.pos.x !== this.pos.x || res.pos.y !== this.pos.y)) {
        this.pos.x = res.pos.x;
        this.pos.y = res.pos.y;

        this.recordChanges(true);
      }
    }
  }

  /**
   * Enhanced handling of results of collision with collision map.
   * @override
   * @example
   * // generally, climbable tiles are IGNORED
   * // if we need them we should be using game's shapesPasses
   * myGame.shapesPasses = [
   *      {
   *          ignoreSolids: true,
   *          ignoreOneWays: true
   *      }
   * ]
   * // this is because movement trace only catches collisions
   * // and it does not record the tile(s) this entity is within
   * // but the above shapes passes will extract climbable shapes
   * // and create entities of them, so we can know when
   * // one entity is within another entity that is climbable
   */
  handleMovementTrace(res: TraceResult): void {
    const wasGrounded = this.grounded;
    let collisionMap;
    let row;

    if (this.hasGravity) {
      this.standing = false;

      if (this.vel.y !== 0 && !this.collidingWithEntitiesBelow) {
        this.grounded = false;
      }
    }

    this.collidingWithMap = false;

    if (res.tile.x && plusplusUtilsTile.isTileClimbable(res.tile.x)) {
      res.pos.x = this.pos.x + this.vel.x * ig.system.tick;
    } else if (res.collision.x) {
      this.collidingWithMap = true;

      if (this.bounciness > 0 && Math.abs(this.vel.x) > this.minBounceVelocity) {
        this.vel.x *= -this.bounciness;
      } else {
        this.vel.x = 0;
      }
    }

    // handle vertical climbing by checking if tiles below to left and right are not blocking

    if (res.tile.y && plusplusUtilsTile.isTileClimbable(res.tile.y)) {
      if (this.climbing || !this.hasGravity || this._climbingIntentUp) {
        res.pos.y = this.pos.y + this.vel.y * ig.system.tick;
        res.collision.y = res.collision.slope = false;
      } else if (this._climbingIntentDown) {
        collisionMap = ig.game.collisionMap;
        const rowIndex = Math.floor((this.pos.y + this.size.y + collisionMap.tilesize * 0.5) / collisionMap.tilesize);
        row = collisionMap.data[rowIndex];
        const tileLeft = row && row[Math.floor(this.pos.x / collisionMap.tilesize)];
        const tileRight = row && row[Math.floor((this.pos.x + this.size.x) / collisionMap.tilesize)];

        if (
          (typeof tileLeft === "undefined" || plusplusUtilsTile.isTileWalkable(tileLeft)) &&
          (typeof tileRight === "undefined" || plusplusUtilsTile.isTileWalkable(tileRight))
        ) {
          res.pos.y = this.pos.y + this.vel.y * ig.system.tick;
          res.collision.y = res.collision.slope = false;
        }
      }
    }

    if (res.collision.y) {
      this.collidingWithMap = true;

      if (this.bounciness > 0 && Math.abs(this.vel.y) > this.minBounceVelocity) {
        this.vel.y *= -this.bounciness;
      } else {
        if (this.vel.y < 0) {
          this.vel.y = 0;
        } else {
          this.setGrounded();
        }
      }
    }

    if (res.collision.slope) {
      const s = (this.slope = res.slope);
      this.collidingWithMap = true;
      s.angle = Math.atan2(s.ny, s.nx);

      if (s.angle > this.slopeStanding.min && s.angle < this.slopeStanding.max) {
        this.setGrounded();

        // shift the result position a little upwards if moving up a slope, based on slope angle
        // otherwise movement up slopes is far more difficult than flat or down
        // of course this can be controlled through the slope speed modifier

        if (
          this.accel.x !== 0 &&
          !plusplusUtilsMath.oppositeSidesOfZero(this.accel.x, this.vel.x) &&
          s.nx * this.vel.x <= 0
        ) {
          this.vel.y = 0;
          res.pos.y +=
            -Math.abs((s.angle + plusplusUtilsMath.HALFPI) * this.vel.x) * this.slopeSpeedMod * ig.system.tick;
        }
      } else if (this.vel.y < 0) {
        this.vel.y = 0;
      }
    } else if (this.slope) {
      // one extra grounded state to avoid flipping

      if (!this.jumping) {
        this.setGrounded();
      }

      this.slope = null;
    }

    // check for when falling off an edge and reset vertical velocity
    // this undoes the sticking to ground effect

    if (wasGrounded && wasGrounded !== this.grounded && !this.jumping) {
      collisionMap = ig.game.collisionMap;
      row = collisionMap.data[Math.floor((this.pos.y + this.size.y + 1) / collisionMap.tilesize)];
      const tile = row && row[Math.floor((this.pos.x + this.size.x * 0.5) / collisionMap.tilesize)];

      if (typeof tile === "undefined" || plusplusUtilsTile.isTileWalkableStrict(tile)) {
        this.vel.y = 0;
        res.pos.y = this.pos.y;
      }
    }

    // when standing still on slope, just force grounded and ignore result position

    if (!(this.slopeSticking && this.slope && this.vel.x === 0)) {
      this.pos.x = res.pos.x;
      this.pos.y = res.pos.y;
    }
  }

  /**
   * Entities update is now broken down into a series of functions/methods, which can be opted into based on {@link plusplusEntityExtended#frozen} and {@link plusplusEntityExtended#performance}.
   * <br>- paused and frozen entities don't update at all
   * <br>- performance === plusplusEntityExtended.PERFORMANCE.STATIC entities only check if visible and do {@link plusplusEntityExtended#updateVisible}
   * <br>- performance === plusplusEntityExtended.PERFORMANCE.MOVABLE does all static performance steps plus can move self or be moved, but ignores collision map, and checks for changes via {@link plusplusEntityExtended#updateChanges} and {@link plusplusEntityExtended#recordChanges}
   * <br>- performance === plusplusEntityExtended.PERFORMANCE.DYNAMIC does all movable performance steps plus collides with collision map and has physics forces via {@link plusplusEntityExtended#updateDynamics}
   * <span class="alert"><strong>IMPORTANT:</strong> {@link plusplusEntityExtended#performance} has nothing to do with entity to entity collisions, which is defined by {@link plusplusEntityExtended#collides}.</span>
   **/
  update(): void {
    if (!this.paused) {
      // unfrozen entities, i.e. do more on update than just checks

      if (!this.frozen) {
        // static entities, i.e. never moving

        if (this.performance === plusplusEntityExtended.PERFORMANCE.STATIC) {
          if (this._changedAdd && this.changed) {
            this.updateBounds();
            this.changed = false;
          }
        }
        // movable or moving entities
        else {
          if (this.controllable && !this._killed) {
            this.updateChanges();

            // dynamic entities

            if (this.performance === plusplusEntityExtended.PERFORMANCE.DYNAMIC) {
              this.updateDynamics();
            }
          }

          this.recordChanges();

          // record last at end
          // allows for external changes to entity

          this.recordLast();
        }

        // visibility

        this.visible = this.getIsVisible();

        if (this.visible) {
          this.updateVisible();
        }
        // die instantly when possible
        else if (this.dieing && this.canDieInstantly) {
          this.die();
        }

        if (this.currentAnim) {
          this.currentAnim.update();
        }
      }
    }
    // check visible when paused but camera is not
    else if (ig.game.camera && !ig.game.camera.paused) {
      this.visible = this.getIsVisible();
    }
  }

  /**
   * Records last transform.
   * <br>- called automatically by {@link plusplusEntityExtended#update}
   **/
  recordLast(): void {
    // inject an intermediate position record
    // so external forces can change entity position
    // but last is still recording the last and not current

    plusplusUtilsVector2.copy(this.last, this._posLast);
    plusplusUtilsVector2.copy(this._posLast, this.pos);
    plusplusUtilsVector2.copy(this._sizeLast, this.size);
    this._angleLast = this.angle;
  }

  /**
   * Records limited changes in transform and sets {@link plusplusEntityExtended#changed} and {@link plusplusEntityExtended#moving}.
   * <br>- called automatically by {@link plusplusEntityExtended#update}
   * @param {Boolean} [force] forces changed.
   **/
  recordChanges(force?: boolean): void {
    if (
      force === true ||
      this.pos.x !== this.last.x ||
      this.pos.y !== this.last.y ||
      this.size.x !== this._sizeLast.x ||
      this.size.y !== this._sizeLast.y ||
      this.angle !== this._angleLast
    ) {
      this.changed = true;

      if (this.vel.x !== 0) {
        this.movingX = true;

        if (this.vel.x < 0) {
          this.flip.x = this.canFlipX;
        } else {
          this.flip.x = false;
        }
      } else {
        this.movingX = false;
      }

      if (this.vel.y !== 0) {
        this.movingY = !this.hasGravity || this.vel.y < 0 || !this.grounded || (!!this.slope && this.movingX);

        // y facing

        if (plusplusConfig.TOP_DOWN || this.canFlipY) {
          if (this.vel.y < 0) {
            this.flip.y = this.canFlipY;
          } else {
            this.flip.y = false;
          }
        }
      } else {
        this.movingY = false;
      }

      this.moving = this.movingX || this.movingY;

      this.updateBounds();
    } else {
      this.changed = this.moving = this.movingX = this.movingY = false;
    }
  }

  /**
   * Updates bounds.
   * <br>- called automatically by {@link plusplusEntityExtended#recordChanges} when {@link plusplusEntityExtended#needsBounds}
   **/
  updateBounds(): void {
    this.posDraw.x = this.getPosDrawX();
    this.posDraw.y = this.getPosDrawY();

    this.sizeDraw.x = this.getSizeDrawX();
    this.sizeDraw.y = this.getSizeDrawY();

    if (this.needsVertices) {
      this._verticesFound = true;
      this.verticesWorld = this.getVerticesWorld();
    } else {
      this._verticesFound = false;
    }
  }

  /**
   * Changes entity.
   * <br>- called automatically by {@link plusplusEntityExtended#update}
   * <span class="alert alert-info"><strong>Tip:</strong> use this method to handle moving, acting, etc, instead of the main update method.</span>
   **/
  updateChanges(): void {
    this.moveToUpdate();
  }

  /**
   * Updates dynamic properties such as velocity, gravity, collisions with collision map, etc.
   * <br>- called automatically by {@link plusplusEntityExtended#update}
   * <span class="alert"><strong>IMPORTANT:</strong> if you change the way bounds are calculated you will also need to override the updateDynamics method!</span>
   **/
  updateDynamics(): void {
    if (this.gravityFactor === 0 || ig.game.gravity === 0) {
      this.hasGravity = false;
    } else {
      this.hasGravity = true;
      this.vel.y += ig.game.gravity * ig.system.tick * this.gravityFactor;
    }

    this.updateVelocity();

    const res = ig.game.collisionMap.trace(
      this.pos.x,
      this.pos.y,
      this.vel.x * ig.system.tick,
      this.vel.y * ig.system.tick,
      this.size.x,
      this.size.y,
      this.collisionMapResult
    );

    this.handleMovementTrace(res);
  }

  /**
   * Updates velocity based on acceleration and friction.
   * <br>- called automatically by {@link plusplusEntityExtended#updateDynamics}
   **/
  updateVelocity(): void {
    this.vel.x = this.getNewVelocity(this.vel.x, this.accel.x, this.friction.x, this.maxVel.x);
    this.vel.y = this.getNewVelocity(this.vel.y, this.accel.y, this.friction.y, this.maxVel.y);
  }

  /**
   * Called when visible to update animations.
   * <br>- called automatically by {@link plusplusEntityExtended#update}
   **/
  updateVisible(): void {
    // ensure current animation is overridden

    if (this.overridingAnim && this.currentAnim !== this.overridingAnim) {
      // store current to be restored when anim released

      this._overridedAnim = this.currentAnim;
      this.currentAnim = this.overridingAnim;
    }

    // reset _changedAdd when visible only
    // this can help to avoid heavy start-up costs
    // as an entity will remain changed until it is visible

    if (this._changedAdd) {
      this._changedAdd = false;
      this.updateBounds();
    }
  }

  /**
   * Draws entity.
   **/
  draw(): void {
    if (this.currentAnim && this.visible) {
      let minX = this.posDraw.x;
      let minY = this.posDraw.y;

      // temporarily swap properties

      const alpha = this.currentAnim.alpha;
      const flip = this.currentAnim.flip;

      this.currentAnim.alpha *= this.alpha;
      this.currentAnim.flip = this.flip;

      let angle;

      if (this.angle !== 0) {
        angle = this.currentAnim.angle;
        this.currentAnim.angle = this.angle;
        minX += (this.sizeDraw.x - this.currentAnim.sheet.width) * 0.5;
        minY += (this.sizeDraw.y - this.currentAnim.sheet.height) * 0.5;
      }

      // fixed in screen

      if (this.fixed) {
        this.currentAnim.draw(minX, minY, this.scale, this.textured ? this : undefined);
      }
      // default draw
      else {
        // original entity draw uses ig.game._rscreen, which seems to cause drawing to jitter
        // ig.game.screen is much more accurate (but may use non integer positions which may be slower)

        this.currentAnim.draw(
          minX - ig.game.screen.x,
          minY - ig.game.screen.y,
          this.scale,
          this.textured ? this : undefined
        );
      }

      // restore properties

      this.currentAnim.alpha = alpha;
      this.currentAnim.flip = flip;

      if (this.angle !== 0) {
        this.currentAnim.angle = angle;
      }
    }
  }
}

enum TYPES {
  NONE,
  A,
  B,
  BOTH,
  INTERACTIVE,
  DAMAGEABLE,
  DANGEROUS,

}

plusplusEntityExtended.TYPE = function () {
  const types = [];
  const combinationTypes = [];
  let name;
  let flag;

  // get all existing types

  for (name in igEntityType) {

    types.push({
      name: name,
      flag: igEntityType[name]
    });

  }

  // sort types by lowest flag up

  types.sort(function(a, b) {

    if  a.flag < b.flag

  });

  // add types that are a power of 2

  for (var i = 0, il = types.length; i < il; i++) {

    var type = types[i];
    name = type.name;
    flag = type.flag;

    // flag that is zero or not a power of 2 should be added manually at end

    if ((flag === 0) || ((flag & (flag - 1)) !== 0)) {

      combinationTypes.push(type);

    } else {

      _ut.getType(ig.EntityExtended, name);

    }

  }

  // add combination types

  for (var i = 0, il = combinationTypes.length; i < il; i++) {

    var type = combinationTypes[i];
    name = type.name;
    flag = type.flag;

    ig.EntityExtended.TYPE[name] = flag;

  }

  return ig.EntityExtended.TYPE;
};
