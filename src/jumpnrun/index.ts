import { ig, main } from "../impact/impact";
import { MyTitle } from "./main";
import { ImpactSplashLoader } from "./plugins/impact-splash-loader";

// If our screen is smaller than 640px in width (that's CSS pixels), we scale the
// internal resolution of the canvas by 2. This gives us a larger viewport and
// also essentially enables retina resolution on the iPhone and other devices
// with small screens.
const scale = window.innerWidth < 640 ? 2 : 1;
// We want to run the game in "fullscreen", so let's use the window's size
// directly as the canvas' style size.
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";

// Listen to the window's 'resize' event and set the canvas' size each time
// it changes.
window.addEventListener(
  "resize",
  function () {
    // If the game hasn't started yet, there's nothing to do here
    if (!ig.system) {
      return;
    }

    // Resize the canvas style and tell Impact to resize the canvas itself;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ig.system.resize(window.innerWidth * scale, window.innerHeight * scale);

    // Re-center the camera - it's dependent on the screen size.
    if (ig.game && ig.game.setupCamera) {
      ig.game.setupCamera();
    }
  },
  false
);

// Finally, start the game into MyTitle and use the ImpactSplashLoader plugin
// as our loading screen
const width = window.innerWidth * scale;
const height = window.innerHeight * scale;

main("#canvas", MyTitle, 60, width, height, scale, ImpactSplashLoader, true);
