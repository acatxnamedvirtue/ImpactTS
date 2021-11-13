import { igAnimation, igAnimationSheet } from "../../impact/animation";
import { igTimer } from "../../impact/timer";
import { plusplusSignal } from "../helpers/signals";
import { ig } from "../../impact/impact";
import { plusplusImageDrawing } from "./image-drawing";
import { igSystem } from "../../impact/system";
import { Vector2 } from "../helpers/utilsvector2";
import { plusplusImage } from "./image";
import { plusplusEntityExtended } from "./entity";

export class plusplusAnimationExtended extends igAnimation {
  frameTime = 1;
  sequence: number[] = [];
  pivot: Vector2 = null;
  stop = false;
  changed = false;
  once = false;
  reverse = false;
  texturing: plusplusEntityExtended = null;
  textureWidth = 0;
  textureHeight = 0;
  opaqueOffset: DOMRect = null;
  onCompleted: plusplusSignal = null;
  sheet: igAnimationSheet = null;
  tile: number = null;
  timer: igTimer = null;

  // internal properties, do not modify
  _texturingDeferred: plusplusEntityExtended;

  // wm
  computeDrawCount = 5;
  computeDrawCountMax = 5;

  constructor(sheet: igAnimationSheet, settings: Record<string, any>) {
    super(sheet, settings.frameTime, settings.sequence, settings.stop);
    this.sheet = sheet;
    this.pivot = {
      x: sheet.width * 0.5,
      y: sheet.height * 0.5,
    };

    ig.merge(this, settings);

    this.tile = this.sequence[0];

    this.timer = new igTimer();
    this.onCompleted = new plusplusSignal();
  }

  getDuration(): number {
    return this.frameTime * this.sequence.length;
  }

  texturize(entity: plusplusEntityExtended): void {
    // ensure image is loaded

    if (!this.sheet.image.loaded) {
      this._texturingDeferred = entity;

      (this.sheet.image as plusplusImage).onLoaded.remove(this._texturizeDeferred, this);
      (this.sheet.image as plusplusImage).onLoaded.addOnce(this._texturizeDeferred, this);
    } else {
      const sheetData = (this.sheet.image.scaleCache && this.sheet.image.scaleCache.x1) || this.sheet.image.data;
      const textureWidth = entity.getSizeDrawX();
      const textureHeight = entity.getSizeDrawY();
      const tileWidth = this.sheet.width;
      const tileHeight = this.sheet.height;
      const sizeMismatch = this.textureWidth !== textureWidth || this.textureHeight !== textureHeight;

      // only texture when entity bounds are larger than tile

      if (tileWidth < textureWidth || tileHeight < textureHeight) {
        // store texture data in entity because entity animations may reuse frames

        this.texturing = entity;
        this.texturing.textures = this.texturing.textures || {};

        // increment counter to record number of anims using textures

        this.texturing.texturedAnimsCount = (this.texturing.texturedAnimsCount || 0) + 1;

        // create pattern for each frame in animation sequence

        for (let i = 0; i < this.sequence.length; i++) {
          const tile = this.sequence[i];
          let texture = this.texturing.textures[tile];
          let recreate;

          // init texture

          if (!texture) {
            texture = this.texturing.textures[tile] = new plusplusImageDrawing({
              width: textureWidth,
              height: textureHeight,
            });

            recreate = true;
          }
          // resize existing texture
          else if (sizeMismatch) {
            texture.setDimensions(textureWidth, textureHeight);

            recreate = true;
          }

          // create texture

          if (recreate) {
            // isolate specific frame from sheet

            const frame = ig.$new("canvas") as HTMLCanvasElement;
            frame.width = tileWidth;
            frame.height = tileHeight;
            frame.style.width = tileWidth + "px";
            frame.style.height = tileHeight + "px";
            const frameContext = frame.getContext("2d");
            igSystem.scaleMode(frame, frameContext);

            frameContext.drawImage(
              sheetData,
              -Math.floor(tile * tileWidth) % sheetData.width,
              -Math.floor((tile * tileHeight) / sheetData.width) * tileHeight
            );

            // fill texture with pattern from frame

            texture.dataContext.fillStyle = texture.dataContext.createPattern(frame, "repeat");
            texture.dataContext.fillRect(0, 0, textureWidth, textureHeight);
            texture.finalize();
          }
        }

        this.textureWidth = textureWidth;
        this.textureHeight = textureHeight;
      }
    }
  }

  _texturizeDeferred(): void {
    this.texturize(this._texturingDeferred);

    this._texturingDeferred = undefined;
  }

  detexturize(): void {
    if (this.texturing) {
      // decrement counter

      this.texturing.texturedAnimsCount = Math.max(0, this.texturing.texturedAnimsCount - 1);

      if (!this.texturing.texturedAnimsCount) {
        this.texturing.textures = undefined;
      }

      // clear properties

      (this.sheet.image as plusplusImage).onLoaded.remove(this._texturizeDeferred, this);

      this.texturing = this.textureWidth = this.textureHeight = this._texturingDeferred = undefined;
    }
  }

  playFromStart(once?: boolean, reverse?: boolean): void {
    this.stop = false;
    this.rewind(once, reverse);
  }

  override rewind(once?: boolean, reverse?: boolean): this {
    this.once = once || this.once;
    this.reverse = reverse || this.reverse;

    return super.rewind();
  }

  override gotoFrame(f: number): void {
    const stopped = this.stop;
    this.stop = false;

    super.gotoFrame(f);

    this.stop = stopped;
  }

  override update(): void {
    if (!this.stop) {
      const loopCount = this.loopCount;
      const numFrames = this.sequence.length;
      const frameTotal = Math.floor(this.timer.delta() / this.frameTime);
      this.loopCount = Math.floor(frameTotal / numFrames);

      if (this.reverse) {
        this.frame = this.sequence.length - 1 - (frameTotal % numFrames);
      } else {
        this.frame = frameTotal % numFrames;
      }

      // check if completed

      if (this.loopCount > loopCount) {
        if (this.once) {
          this.once = false;
          this.stop = true;

          this.frame = numFrames - 1;
        }

        this.onCompleted.dispatch();
      }

      const tile = this.tile;
      this.tile = this.sequence[this.frame];

      this.changed = numFrames > 1 && this.tile !== tile;
    }
  }

  override draw(targetX: number, targetY: number, scale?: number, texturing?: plusplusEntityExtended): void {
    if (ig.editor) {
      this.wmDraw();
      scale = undefined;
      texturing = undefined;
    }

    // no need to check if animation is on screen
    // entity handles visible check

    if (this.alpha !== 1) {
      ig.system.context.globalAlpha = this.alpha;
    }

    // texture draw

    texturing = texturing || this.texturing;

    if (texturing) {
      if (
        this.texturing !== texturing ||
        this.textureWidth !== this.texturing.sizeDraw.x ||
        this.textureHeight !== this.texturing.sizeDraw.y
      ) {
        this.texturize(texturing);
      }

      const texture = this.texturing && this.texturing.textures && this.texturing.textures[this.tile];

      if (texture) {
        texture.draw(targetX, targetY, undefined, undefined, undefined, undefined, scale);
      } else {
        return this.draw(targetX, targetY, scale);
      }
    }
    // default draw
    else {
      if (this.angle === 0) {
        (this.sheet.image as plusplusImage).drawTile(
          targetX,
          targetY,
          this.tile,
          this.sheet.width,
          this.sheet.height,
          this.flip.x,
          this.flip.y,
          scale
        );
      } else {
        ig.system.context.save();

        ig.system.context.translate(
          ig.system.getDrawPos(targetX + this.pivot.x),
          ig.system.getDrawPos(targetY + this.pivot.y)
        );

        ig.system.context.rotate(this.angle);

        (this.sheet.image as plusplusImage).drawTile(
          -this.pivot.x,
          -this.pivot.y,
          this.tile,
          this.sheet.width,
          this.sheet.height,
          this.flip.x,
          this.flip.y,
          scale
        );

        ig.system.context.restore();
      }
    }

    if (this.alpha !== 1) {
      ig.system.context.globalAlpha = 1;
    }
  }

  wmDraw(): void {
    // recompute textures when size changed

    if (this.texturing) {
      if (this.computeDrawCount >= this.computeDrawCountMax) {
        this.computeDrawCount = 0;
        this.texturing.recordChanges(true);

        if (
          this.textureWidth * ig.system.scale !== this.texturing.getSizeDrawX() * ig.system.scale ||
          this.textureHeight * ig.system.scale !== this.texturing.getSizeDrawY() * ig.system.scale
        ) {
          this.texturize(this.texturing);
        }
      } else {
        this.computeDrawCount++;
      }
    }
  }
}
