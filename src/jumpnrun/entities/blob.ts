import { igEntity, igEntityCollides, igEntityType } from "../../impact/entity";
import { igAnimationSheet } from "../../impact/animation";
import { igSound } from "../../impact/sound";
import { ig } from "../../impact/impact";
import { TraceResult } from "../../impact/collision-map";

export class EntityBlob extends igEntity {
  name = "blob";
  size = { x: 40, y: 28 };
  offset = { x: 24, y: 0 };
  maxVel = { x: 100, y: 100 };
  friction = { x: 150, y: 0 };

  type = igEntityType.B; // Evil enemy group
  checkAgainst = igEntityType.A; // Check against friendly
  collides = igEntityCollides.PASSIVE;

  health = 1;

  speed = 36;
  flip = false;

  animSheet = new igAnimationSheet("media/blob.png", 64, 28);
  sfxDie = new igSound("media/sounds/blob-die.*");

  constructor(x: number, y: number, settings: Record<string, any>) {
    super(x, y, settings);

    this.addAnim("crawl", 0.2, [0, 1]);
    this.addAnim("dead", 1, [2]);
  }

  override update(): void {
    // Near an edge? return!
    if (!ig.game.collisionMap.getTile(this.pos.x + (this.flip ? +4 : this.size.x - 4), this.pos.y + this.size.y + 1)) {
      this.flip = !this.flip;

      // We have to move the offset.x around a bit when going
      // in reverse direction, otherwise the blob's hitbox will
      // be at the tail end.
      this.offset.x = this.flip ? 0 : 24;
    }

    const xdir = this.flip ? -1 : 1;
    this.vel.x = this.speed * xdir;

    if (this.currentAnim) {
      this.currentAnim.flip.x = !this.flip;
    }

    super.update();
  }

  override kill(): void {
    this.sfxDie.play();
    super.kill();
  }

  override handleMovementTrace(res: TraceResult): void {
    super.handleMovementTrace(res);

    // Collision with a wall? return!
    if (res.collision.x) {
      this.flip = !this.flip;
      this.offset.x = this.flip ? 0 : 24;
    }
  }

  override check(other: igEntity): void {
    other.receiveDamage(1, this);
  }
}
