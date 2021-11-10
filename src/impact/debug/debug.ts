import { ig } from "../impact";
import { igEntity } from "../entity";
import { igDebug, igDebugPanel } from "./menu";
import { igDebugGraphPanel } from "./graph-panel";
import { igDebugMapsPanel } from "./maps-panel";

export class igDebugMode {
  constructor() {
    // Entities Panel

    const debug = ig.debug as igDebug;

    debug.addPanel({
      type: igDebugPanel,
      name: "entities",
      label: "Entities",
      options: [
        {
          name: "Checks & Collisions",
          object: igEntity,
          property: "_debugEnableChecks",
        },
        {
          name: "Show Collision Boxes",
          object: igEntity,
          property: "_debugShowBoxes",
        },
        {
          name: "Show Velocities",
          object: igEntity,
          property: "_debugShowVelocities",
        },
        {
          name: "Show Names & Targets",
          object: igEntity,
          property: "_debugShowNames",
        },
      ],
    });

    // Graph Panel

    debug.addPanel({
      type: igDebugGraphPanel,
      name: "graph",
      label: "Performance",
    });

    // Maps Panel
    debug.addPanel({
      type: igDebugMapsPanel,
      name: "maps",
      label: "Background Maps",
    });
  }
}
