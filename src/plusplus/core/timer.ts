import { igTimer } from "../../impact/timer";
import { plusplusConfig } from "./config";

export class plusplusTimer extends igTimer {
  static minStep = plusplusConfig.MIN_TIME_STEP;
  static overflow = 0;
  static stepped = false;

  static override step(): void {
    const current = Date.now();
    // add frame time to overflow
    // if overflow is above minimum step time
    // game should step forward
    // this way we can keep a maximum framerate

    plusplusTimer.overflow += Math.min((current - plusplusTimer._last) / 1000, plusplusTimer.maxStep);

    if (plusplusTimer.overflow >= plusplusTimer.minStep) {
      plusplusTimer.overflow -= plusplusTimer.minStep;
      plusplusTimer.time += plusplusTimer.minStep * plusplusTimer.timeScale;
      plusplusTimer.stepped = true;
    } else {
      plusplusTimer.stepped = false;
    }

    plusplusTimer._last = current;
  }
}
