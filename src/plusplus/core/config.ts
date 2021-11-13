import { ig } from "../../impact/impact";
import { plusplusConfigUser } from "../config-user";
import { PathfindingTileDef } from "./pathfinding-map";

type Rank = {
  name: string;
  level: number;
};

type PlusPlusConfig = {
  AUTO_CRISP_SCALING: boolean;
  PRERENDER_MAPS: boolean;
  PARTICLE: { ANIM_AUTOMATIC: boolean };
  RANKS: Rank[];
  LOADER_BG_COLOR: string;
  LOADER_FADE_COLOR: string;
  RESIZE_DELAY: number;
  PRECISION_ZERO: number;
  STATIC: string;
  LOADER_BAR_SPACE_PCT: number;
  CREATURE: {
    NEEDS_LINE_OF_SIGHT_PREDATOR: boolean;
    CAN_BREAK_TETHER: boolean;
    TETHER_DISTANCE: number;
    REACTION_DELAY: number;
    DETECT_HIDDEN_PREY: boolean;
    MOVE_TO_PREY_SETTINGS: { avoidEntities: boolean };
    MOVE_TO_PREDATOR_SETTINGS: { avoidEntities: boolean };
    WANDER_SWITCH_CHANCE_STOPPED: number;
    CAN_FLEE: boolean;
    NEEDS_LINE_OF_SIGHT_PREY: boolean;
    WANDER_SWITCH_CHANCE: number;
    PREDATOR_FROM_DAMAGE: boolean;
    CAN_LEARN_PREDATORS: boolean;
    MOVE_TO_TETHER_SETTINGS: { avoidEntities: boolean };
    MOVE_TO_WANDER_SETTINGS: { simple: boolean; avoidUngrounded: boolean; avoidSlopes: boolean };
    FLEE_HEALTH_PCT: number;
    DETECT_HIDDEN_PREDATOR: boolean;
    REACTION_DISTANCE: number;
    CAN_WANDER_X: boolean;
    TETHER_TO_SPAWNER: boolean;
    CAN_WANDER_Y: boolean;
  };
  LOADER_BAR_WIDTH_PCT: number;
  Z_INDEX_BELOW_PLAYER: number;
  Z_INDEX_BELOW_ALL: number;
  IGNORE_PAUSE_OVERLAY_LAYER: boolean;
  CAMERA: {
    KEEP_INSIDE_LEVEL: boolean;
    BOUNDS_TRAP_PCT_MAXY: number;
    BOUNDS_TRAP_PCT_MAXX: number;
    BOUNDS_TRAP_MINX: number;
    BOUNDS_TRAP_MINY: number;
    AUTO_FOLLOW_PLAYER: boolean;
    TRANSITION_DURATION_MAX: number;
    TRANSITION_DISTANCE: number;
    CENTER_FIRST_FOLLOW: boolean;
    LERP: number;
    BOUNDS_TRAP_AS_PCT: boolean;
    KEEP_CENTERED: boolean;
    BOUNDS_TRAP_MAXX: number;
    SNAP_FIRST_FOLLOW: boolean;
    BOUNDS_TRAP_MAXY: number;
    TRANSITION_DURATION_MIN: number;
    BOUNDS_TRAP_PCT_MINY: number;
    TRANSITION_DURATION: number;
    BOUNDS_TRAP_PCT_MINX: number;
  };
  GAME_HEIGHT_PCT: number;
  Z_INDEX_ABOVE_ALL: number;
  TRANSITION_LEVELS: boolean;
  LOADER_MAX_HEIGHT_PCT: number;
  MIN_TIME_STEP: number;
  TRANSITIONER_LAYER: string;
  AUTO_SORT_OVERLAY_LAYER: boolean;
  FORCE_ENTITY_EXTENDED: boolean;
  DURATION_THROTTLE: number;
  CLEAR_COLOR: string;
  DIMMER_ALPHA: number;
  DURATION_THROTTLE_MEDIUM: number;
  IGNORE_PAUSE_UI_LAYER: boolean;
  TRANSITIONER_COLOR: string;
  RANKS_MAP: Record<string, number>;
  PATH_TO_MEDIA: string;
  Z_INDEX_PLAYER: number;
  BACKGROUNDS_PARALLAX_Y: boolean;
  Z_INDEX_TRANSITIONER: number;
  CHARACTER: {
    UNGROUNDED_FOR_AND_FALLING_THRESHOLD: number;
    REGEN_RATE_HEALTH: number;
    JUMP_STEPS: number;
    CAN_JUMP: boolean;
    JUMP_FORCE: number;
    CAN_JUMP_REPEATEDLY: boolean;
    EXPLODING_DEATH: boolean;
    SIZE_X: number;
    SIZE_EFFECTIVE_X: number;
    MAX_VEL_CLIMBING_X: number;
    SIZE_Y: number;
    SIZE_EFFECTIVE_Y: number;
    SIZE_EFFECTIVE_MIN: number;
    SIZE_EFFECTIVE_MAX: number;
    MAX_VEL_CLIMBING_Y: number;
    PATHFINDING_UPDATE_DELAY: number;
    ANIM_AUTOMATIC: boolean;
    SPEED_Y: number;
    SPEED_X: number;
    PATHFINDING_DELAY: number;
    EXPLODING_DAMAGE_PARTICLE_COUNT: number;
    CAN_PATHFIND: boolean;
    HEALTH: number;
    MAX_VEL_UNGROUNDED_Y: number;
    UNGROUNDED_FOR_THRESHOLD: number;
    CLIMBING_CONTROL: number;
    ENERGY: number;
    MAX_VEL_UNGROUNDED_X: number;
    EXPLODING_DAMAGE: boolean;
    CAN_CLIMB: boolean;
    MAX_VEL_GROUNDED_X: number;
    FRICTION_GROUNDED_X: number;
    MAX_VEL_GROUNDED_Y: number;
    FRICTION_GROUNDED_Y: number;
    EXPLODING_DEATH_PARTICLE_COUNT: number;
    PATHFINDING_SIMPLE_DELAY: number;
    STUCK_DELAY: number;
    FRICTION_UNGROUNDED_Y: number;
    JUMP_CONTROL: number;
    SIZE_OFFSET_Y: number;
    FRICTION_UNGROUNDED_X: number;
    SIZE_OFFSET_X: number;
    SLOPE_STICKING: boolean;
    REGEN_RATE_ENERGY: number;
  };
  BACKGROUNDS_PARALLAX_X: boolean;
  GAME_HEIGHT_VIEW: number;
  PRERENDER_BACKGROUND_LAYER: boolean;
  DIMMER_COLOR: string;
  LOADER_LOGO_SRC_MAIN: string;
  DURATION_TWEEN: number;
  LOADER_BAR: boolean;
  LOADER_SPACE_PCT: number;
  LOADER_MAX_WIDTH_PCT: number;
  GAME_WIDTH_VIEW: number;
  FONT: {
    MAIN_NAME: string;
    SCALE_MIN: number;
    SCALE_MAX: number;
    CHAT_PATH: string;
    ALT_PATH: string;
    MAIN_PATH: string;
    CHAT_NAME: string;
    SCALE: number;
    SCALE_OF_SYSTEM_SCALE: number;
    IGNORE_SYSTEM_SCALE: boolean;
    ALT_NAME: string;
  };
  DYNAMIC: string;
  PATHFINDING: {
    WEIGHT_AWAY_FROM: number;
    AVOID_ENTITIES: boolean;
    AWAY_FROM_MAX_NODES: number;
    TILE_DEF: PathfindingTileDef;
    WEIGHTED: boolean;
    ALLOW_DIAGONAL: boolean;
    AWAY_FROM_MIN_DISTANCE_PCT: number;
    STRICT_SLOPE_CHECK: boolean;
    BUILD_WITH_LEVEL: boolean;
    WEIGHT: number;
    AWAY_FROM_DISTANCE: number;
    DIAGONAL_REQUIRES_BOTH_DIRECT: boolean;
  };
  LOADER_BAR_HEIGHT_PCT: number;
  GESTURE: {
    HOLD_DELAY: number;
    HOLD_ACTIVATE_DISTANCE_PCT: number;
    SWIPE_DURATION_RESET: number;
    TARGET_TAP: boolean;
    DIRECTION_SWITCH_PCT: number;
    TARGET_SEARCH_RADIUS: number;
    HOLD_DELAY_BLOCK_TAP: number;
    TARGET_UP: boolean;
    SWIPE_DURATION_TRY: number;
    TAP_MULTI_DISTANCE_PCT: number;
    SWIPE_DISTANCE_PCT: number;
    RELEASE_DELAY: number;
    HOLD_DELAY_ACTIVATE: number;
    TARGET_DOWN: boolean;
    TARGET_DOWN_START: boolean;
  };
  GAME_HEIGHT: number;
  PLAYER_MANAGER: {
    SWIPE_TO_JUMP: boolean;
    TOUCH_DPAD_BOUNDS_PCT_MINX: number;
    TOUCH_DPAD_DEAD_ZONE_SIZE: number;
    TOUCH_DPAD_BOUNDS_PCT_MINY: number;
    TOUCH_DPAD_BOUNDS_PCT_MAXX: number;
    TOUCH_DPAD_BOUNDS_PCT_MAXY: number;
    HOLD_TO_MOVE: boolean;
    TOUCH_DPAD_ENABLED: boolean;
    AUTO_MANAGE_PLAYER: boolean;
    TOUCH_DPAD_SIZE: number;
  };
  AUTO_SORT_UI_LAYER: boolean;
  COLLISION: {
    TILE_CLIMBABLE_STAIRS: number;
    TILE_CLIMBABLE_WITH_TOP: number;
    TILE_CLIMBABLE_STAIRS_WITH_TOP: number;
    TILE_ONE_WAY_LEFT: number;
    ALLOW_FIXED: boolean;
    TILE_ONE_WAY_DOWN: number;
    TILE_CLIMBABLE: number;
    TILE_SOLID: number;
    TILE_ONE_WAY_UP: number;
    TILE_ONE_WAY_RIGHT: number;
    TILES_HASH_ONE_WAY: Record<number, boolean>;
    TILES_HASH_CLIMBABLE: Record<number, boolean>;
    TILES_HASH_CLIMBABLE_ONE_WAY: Record<number, boolean>;
    TILES_HASH_CLIMBABLE_STAIRS: Record<number, boolean>;
    TILES_HASH_WALKABLE: Record<number, boolean>;
    TILES_HASH_WALKABLE_STRICT: Record<number, boolean>;
    TILES_HASH_SLOPED: Record<number, boolean>;
  };
  TRANSITIONER_R: number;
  OVERLAY: { R: number; B: number; G: number; ALPHA: number; PIXEL_PERFECT: boolean };
  SCALE_MAX: number;
  UI: {
    MARGIN_SCALELESS: boolean;
    SCALE_MIN: number;
    POS_AS_PCT: boolean;
    SCALE_MAX: number;
    MARGIN_AS_PCT_SMALLEST: boolean;
    SCALE: number;
    SCALE_OF_SYSTEM_SCALE: number;
    IGNORE_SYSTEM_SCALE: boolean;
    CAN_FLIP_X: boolean;
    CAN_FLIP_Y: boolean;
  };
  LOADER_BAR_LINE_WIDTH: number;
  TRANSITIONER_G: number;
  DIMMED_PAUSE: boolean;
  GAME_WIDTH: number;
  NO_UPDATE_FOREGROUND_LAYER: boolean;
  TRANSITIONER_B: number;
  LEVEL_MAX: number;
  DURATION_FADE: number;
  SCALE: number;
  DIMMER_R: number;
  TOP_DOWN: boolean;
  SCALE_MIN: number;
  AUTO_SPAWN_PLAYER: boolean;
  DIMMER_G: number;
  MOVABLE: string;
  LIGHT: {
    CASTS_SHADOWS: boolean;
    R: number;
    B: number;
    G: number;
    DIFFUSE: number;
    ALPHA: number;
    SAMPLES: number;
    PIXEL_PERFECT: boolean;
    GRADIENT: boolean;
    CASTS_SHADOWS_MOVABLE: boolean;
  };
  DIMMER_B: number;
  GRAVITY: number;
  GAME_WIDTH_PCT: number;
  Z_INDEX_ABOVE_PLAYER: number;
  LOADER_LOGO_SRC_ALT: string;
  DURATION_THROTTLE_SHORT: number;
  FLIP_Y: boolean;
  TEXT_BUBBLE: {
    SIZE_AS_PCT: boolean;
    B: number;
    PADDING_Y: number;
    SHRINK_TO_TEXT: boolean;
    PADDING_X: number;
    G: number;
    ALPHA: number;
    SIZE_X: number;
    SIZE_Y: number;
    PIXEL_PERFECT: boolean;
    TRIANGLE_WIDTH: number;
    SIZE_PCT_X: number;
    R: number;
    SIZE_PCT_Y: number;
    TRIANGLE_LENGTH: number;
    CORNER_RADIUS: number;
    CORNER_RADIUS_AS_PCT: boolean;
  };
  PRECISION_PCT_ONE_SIDED: number;
  LOADER_BAR_COLOR: string;
  CLEAR_ON_LOAD_UI_LAYER: boolean;
  ENTITY: {
    MAX_VEL_Y: number;
    MAX_VEL_X: number;
    SIZE_X: number;
    SIZE_Y: number;
    SIZE_EFFECTIVE_MIN: number;
    SIZE_EFFECTIVE_MAX: number;
    SLOPE_STANDING_MIN: number;
    SLOPE_SPEED_MOD: number;
    SCALE_MAX: number;
    OPAQUE_OFFSET: { top: number; left: number; bottom: number; right: number };
    OPAQUE_FROM_VERTICES: boolean;
    BOUNCINESS: number;
    SIZE_EFFECTIVE_X: number;
    SIZE_EFFECTIVE_Y: number;
    SCALE: number;
    HEALTH: number;
    CAN_FLIP_X: boolean;
    CAN_FLIP_Y: boolean;
    OPAQUE_OFFSET_BOTTOM: number;
    SCALE_MIN: number;
    OPAQUE_OFFSET_TOP: number;
    MIN_BOUNCE_VEL: number;
    NEEDS_VERTICES: boolean;
    SCALE_OF_SYSTEM_SCALE: number;
    FRICTION_X: number;
    FRICTION_Y: number;
    OPAQUE: boolean;
    DIFFUSE: number;
    NEEDS_BOUNDS: boolean;
    SIZE_OFFSET_Y: number;
    SIZE_OFFSET_X: number;
    IGNORE_SYSTEM_SCALE: boolean;
    SLOPE_STANDING_MAX: number;
    SLOPE_STICKING: boolean;
    OPAQUE_OFFSET_RIGHT: number;
  };
  PRERENDER_FOREGROUND_LAYER: boolean;
  LAYERS_CUSTOM: Record<string, any>;
  NO_UPDATE_BACKGROUND_LAYER: boolean;
  PRECISION_ZERO_TWEEN: number;
  AUTO_SORT_LAYERS: boolean;
};

export const plusplusConfig: PlusPlusConfig = {
  FORCE_ENTITY_EXTENDED: true,
  AUTO_CRISP_SCALING: true,
  MIN_TIME_STEP: (ig.ua.mobile ? 1000 / 30 : 1000 / 60) / 1000,
  PATH_TO_MEDIA: "media/",
  DURATION_THROTTLE: 500,
  DURATION_THROTTLE_MEDIUM: 250,
  DURATION_THROTTLE_SHORT: 60,
  DURATION_TWEEN: 500,
  DURATION_FADE: 300,
  GAME_WIDTH: ig.ua.viewport.width,
  GAME_HEIGHT: ig.ua.viewport.height,
  GAME_WIDTH_PCT: 0,
  GAME_HEIGHT_PCT: 0,
  GAME_WIDTH_VIEW: 0,
  GAME_HEIGHT_VIEW: 0,
  TOP_DOWN: false,
  FLIP_Y: false,
  SCALE: 1,
  SCALE_MIN: 1,
  SCALE_MAX: Infinity,
  RESIZE_DELAY: 500,
  GRAVITY: 400,
  AUTO_SORT_LAYERS: false,
  AUTO_SORT_OVERLAY_LAYER: true,
  AUTO_SORT_UI_LAYER: true,
  PRERENDER_MAPS: true,
  PRERENDER_BACKGROUND_LAYER: true,
  PRERENDER_FOREGROUND_LAYER: true,
  CLEAR_ON_LOAD_UI_LAYER: false,
  IGNORE_PAUSE_UI_LAYER: true,
  IGNORE_PAUSE_OVERLAY_LAYER: false,
  NO_UPDATE_BACKGROUND_LAYER: true,
  NO_UPDATE_FOREGROUND_LAYER: true,
  BACKGROUNDS_PARALLAX_X: true,
  BACKGROUNDS_PARALLAX_Y: false,
  LOADER_MAX_WIDTH_PCT: 0.5,
  LOADER_MAX_HEIGHT_PCT: 0.5,
  LOADER_BG_COLOR: "#111111",
  LOADER_FADE_COLOR: "#DDDDDD",
  LOADER_BAR: true,
  LOADER_BAR_COLOR: "#DDDDDD",
  LOADER_BAR_WIDTH_PCT: 0.25,
  LOADER_BAR_HEIGHT_PCT: 0.025,
  LOADER_BAR_LINE_WIDTH: 3,
  LOADER_BAR_SPACE_PCT: 0.005,
  LOADER_SPACE_PCT: 0.02,
  LOADER_LOGO_SRC_MAIN:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP8AAAAtCAYAAABh/r3uAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QUTEQcqYSZEBgAAAVtJREFUeNrt3MGNwjAQBVC8oqPctpxtYevYFiiHm2tiryARKdaMjcHv3UCBOA5f/oGIctqxbdvtBLy9Wmt59vyXqYE1CT8sqqj6sOYlgJUf1H5gqdqv6oOVHxB+QPgB4QeEHxB+QPgB4Qfmds56o+vfz9Pnv38v6YPe29eR/baO8377I8eyt31kzK1zEhln1lxlnZfZ5qd1nJHtsz6TVn5A+IFg7R9ZUSLvkzXOSBXsfSmUNc6suerx2pFzlVXRW7e38gPCD0xY+2cw8leGIxWutVr3GHPWOFc4p+/42bbyA8IPvLD2v6pGZlXuyH5HvnbkvmY4pyuL3BBl5QeEH+hU+3tXlKxvqnuPM1KnZ6u7kbmKHGOP+Wn9BaT12Ge7gcfKDwg/8Mj/9oOVHxB+QPgB4QeEHxB+QPgB4QcmV+4fuOEHPluttVj5Qe0Hlq/9LgHgs6u+lR8QfljVP9Eqv3CR+x/VAAAAAElFTkSuQmCC",
  LOADER_LOGO_SRC_ALT:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QUGFCwN01BpQgAAACZpVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVAgb24gYSBNYWOV5F9bAAADT0lEQVR42u3du27UQBiG4VlkUSCuIRU9QhuKpMpFUFOkTcl1bElLTcFFUCUFsai4EwqEEFAkGwkL4zE+zeF5qxw2m43z/+98Y896dmGA/X7/KyBb2rbd/ev7jxyiulEACgA1szPm150JGMAQAAWAejOAMZ8BoACgACZwe9aG27PW0WQAVB0CuxY4vdk7wgyA6qaBTMAAyIRmjV/CCAyAmjJAX+d3YQIGQMkGiDUBIzAASjYAEzAAFMA4U7i6yAAoLQOMzQKyAQOgRAMwwbjjseTfywCV05TQKbIBAyDHDDA1C+SeDVLIQAxgCCgrRad8BvH6cBmuD5cKAGYBRc8Sjl1+/ubdH1/vfs4AqGMWkMq4nPos4Xicvr96G0II4fGHq8VfNwMwQHorglI3Qt8Yv9TxYQCUYYDSTFACDMAA+a0HKNUES2ULBkCaBkjVBDVlAwaoHAUwYKbS35+gAGSAdG4Vm0u3zZUNtkj9DIB0DVCrCWQAMAATMAA2oHEI5jdVnxFSSP0MgHwyQG5ZIMdswAAMkM+mUUuZ4OuPuz64+PRi1M99fPk5hBDC0+ZntiZgAAbIb9u4uU0wtUP7Xs+a6/sZAPUYYC4TzN2R759/CSGE8OzJt2yyAANUThZnAuc+g7ZUJ568Ptx9cD/m9xkrJRMwgAyQ/+bRY7PA0h2Y004pDFA5RRTA6c1+k65K8Z4/DIB8ZwFT0/7RAmtdPUzxnj8MgHwNkGpHpbiShwHgPEBq8/Ecd0VjAAbYzgBrja2xJvjf15PzfogMwADlZoDYDl16TSADgAFiOnKtq3TdtXpL4X0BSJ6q3hv4cK0gXPnPMwBWywBb7Y4VO69P7X0GDAAZYA5iz+hNXUfgDiFggC2Z65pCjfsGMIBZQHpnAvs6uuSVOQwABqh57x4GQD0GAANAAUABQAFAAUABQAFAAaCiAsj19iol3BaGAfBAMqeCh7qq79Lw0OPGPr77uOP3x/780OtI5ZI2A1ROs3XHdzuh23F9n8d24NDiktjOnPp8Y38fA6BsA5RGrKlkADDAkrOHoc6L7eDY5xvKJLGzFAZA3ecB5ppFgAGgAKAAEJcBul+wTLxs2rbdMQAUABQA/pYBZIKyx3wGgAKAAsA9vwE+PY+Xd5MPtQAAAABJRU5ErkJggg==",
  CLEAR_COLOR: "#000000",
  STATIC: "static",
  MOVABLE: "movable",
  DYNAMIC: "dynamic",
  AUTO_SPAWN_PLAYER: true,
  Z_INDEX_BELOW_ALL: -1,
  Z_INDEX_BELOW_PLAYER: 0,
  Z_INDEX_PLAYER: 100,
  Z_INDEX_ABOVE_PLAYER: 200,
  Z_INDEX_ABOVE_ALL: 9999,
  TRANSITION_LEVELS: true,
  TRANSITIONER_COLOR: "#333333",
  TRANSITIONER_R: 51,
  TRANSITIONER_G: 51,
  TRANSITIONER_B: 51,
  TRANSITIONER_LAYER: "ui",
  Z_INDEX_TRANSITIONER: 200,
  DIMMED_PAUSE: true,
  DIMMER_COLOR: "#333333",
  DIMMER_R: 51,
  DIMMER_G: 51,
  DIMMER_B: 51,
  DIMMER_ALPHA: 0.75,
  LAYERS_CUSTOM: {},
  LEVEL_MAX: 4,
  RANKS_MAP: {
    NONE: 0,
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    IMPOSSIBLE: 0,
  },
  RANKS: [] as Rank[],
  PRECISION_ZERO: 0.01,
  PRECISION_ZERO_TWEEN: 0.1,
  PRECISION_PCT_ONE_SIDED: 0.01,
  FONT: {
    MAIN_NAME: "font_04b03_white_8.png",
    MAIN_PATH: "",
    ALT_NAME: "",
    ALT_PATH: "",
    CHAT_NAME: "",
    CHAT_PATH: "",
    SCALE: 1,
    SCALE_OF_SYSTEM_SCALE: 1,
    SCALE_MIN: 1,
    SCALE_MAX: Infinity,
    IGNORE_SYSTEM_SCALE: false,
  },
  UI: {
    POS_AS_PCT: true,
    SCALE: 1,
    SCALE_OF_SYSTEM_SCALE: 1,
    SCALE_MIN: 1,
    SCALE_MAX: Infinity,
    IGNORE_SYSTEM_SCALE: false,
    MARGIN_AS_PCT_SMALLEST: true,
    MARGIN_SCALELESS: true,
    CAN_FLIP_X: true,
    CAN_FLIP_Y: false,
  },
  GESTURE: {
    RELEASE_DELAY: 0.3,
    DIRECTION_SWITCH_PCT: 0.03,
    HOLD_DELAY: 0.15,
    HOLD_DELAY_BLOCK_TAP: 0.3,
    HOLD_DELAY_ACTIVATE: 0.5,
    HOLD_ACTIVATE_DISTANCE_PCT: 0.01,
    SWIPE_DISTANCE_PCT: 0.05,
    SWIPE_DURATION_TRY: 0.3,
    SWIPE_DURATION_RESET: 0.1,
    TAP_MULTI_DISTANCE_PCT: 0.05,
    TARGET_UP: false,
    TARGET_DOWN: false,
    TARGET_DOWN_START: true,
    TARGET_TAP: true,
    TARGET_SEARCH_RADIUS: 10,
  },
  CAMERA: {
    AUTO_FOLLOW_PLAYER: true,
    SNAP_FIRST_FOLLOW: true,
    CENTER_FIRST_FOLLOW: true,
    KEEP_CENTERED: true,
    KEEP_INSIDE_LEVEL: false,
    LERP: 1,
    BOUNDS_TRAP_AS_PCT: false,
    BOUNDS_TRAP_MINX: 0,
    BOUNDS_TRAP_MINY: 0,
    BOUNDS_TRAP_MAXX: 0,
    BOUNDS_TRAP_MAXY: 0,
    BOUNDS_TRAP_PCT_MINX: 0,
    BOUNDS_TRAP_PCT_MINY: 0,
    BOUNDS_TRAP_PCT_MAXX: 0,
    BOUNDS_TRAP_PCT_MAXY: 0,
    TRANSITION_DURATION: 1,
    TRANSITION_DURATION_MIN: 0.2,
    TRANSITION_DURATION_MAX: 2,
    TRANSITION_DISTANCE: 100,
  },
  ENTITY: {
    SIZE_X: 16,
    SIZE_EFFECTIVE_X: 16,
    SIZE_Y: 16,
    SIZE_EFFECTIVE_Y: 16,
    SIZE_EFFECTIVE_MIN: 16,
    SIZE_EFFECTIVE_MAX: 16,
    SIZE_OFFSET_X: 0,
    SIZE_OFFSET_Y: 0,
    SCALE: 1,
    SCALE_OF_SYSTEM_SCALE: 1,
    SCALE_MIN: 1,
    SCALE_MAX: Infinity,
    IGNORE_SYSTEM_SCALE: false,
    CAN_FLIP_X: true,
    CAN_FLIP_Y: false,
    FRICTION_X: 0,
    FRICTION_Y: 0,
    MAX_VEL_X: 100,
    MAX_VEL_Y: 100,
    BOUNCINESS: 0,
    MIN_BOUNCE_VEL: 40,
    NEEDS_BOUNDS: false,
    NEEDS_VERTICES: false,
    HEALTH: 1,
    SLOPE_STICKING: false,
    SLOPE_SPEED_MOD: 0.75,
    SLOPE_STANDING_MIN: -136,
    SLOPE_STANDING_MAX: -44,
    OPAQUE: false,
    OPAQUE_OFFSET: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    OPAQUE_OFFSET_RIGHT: 0,
    OPAQUE_OFFSET_TOP: 0,
    OPAQUE_OFFSET_BOTTOM: 0,
    OPAQUE_FROM_VERTICES: false,
    DIFFUSE: 0.8,
  },
  LIGHT: {
    PIXEL_PERFECT: false,
    GRADIENT: true,
    CASTS_SHADOWS: false,
    CASTS_SHADOWS_MOVABLE: false,
    R: 1,
    G: 1,
    B: 1,
    ALPHA: 0.25,
    DIFFUSE: 0.8,
    SAMPLES: 1,
  },
  CHARACTER: {
    ANIM_AUTOMATIC: true,
    SIZE_X: 32,
    SIZE_EFFECTIVE_X: 32,
    SIZE_Y: 32,
    SIZE_EFFECTIVE_Y: 32,
    SIZE_EFFECTIVE_MIN: 32,
    SIZE_EFFECTIVE_MAX: 32,
    SIZE_OFFSET_X: 0,
    SIZE_OFFSET_Y: 0,
    MAX_VEL_UNGROUNDED_X: 100,
    MAX_VEL_UNGROUNDED_Y: 200,
    MAX_VEL_GROUNDED_X: 100,
    MAX_VEL_GROUNDED_Y: 100,
    MAX_VEL_CLIMBING_X: 75,
    MAX_VEL_CLIMBING_Y: 75,
    FRICTION_UNGROUNDED_X: 0,
    FRICTION_UNGROUNDED_Y: 0,
    FRICTION_GROUNDED_X: 1600,
    FRICTION_GROUNDED_Y: 1600,
    SPEED_X: 750,
    SPEED_Y: 750,
    CAN_JUMP: true,
    JUMP_STEPS: 4,
    JUMP_FORCE: 10,
    JUMP_CONTROL: 0.75,
    CAN_JUMP_REPEATEDLY: false,
    SLOPE_STICKING: true,
    UNGROUNDED_FOR_THRESHOLD: 0.1,
    UNGROUNDED_FOR_AND_FALLING_THRESHOLD: 0.25,
    CAN_CLIMB: true,
    CLIMBING_CONTROL: 1,
    CAN_PATHFIND: true,
    PATHFINDING_DELAY: 1,
    PATHFINDING_UPDATE_DELAY: 0.2,
    PATHFINDING_SIMPLE_DELAY: 0.075,
    STUCK_DELAY: 0.1,
    HEALTH: 1,
    ENERGY: 1,
    REGEN_RATE_HEALTH: 0,
    REGEN_RATE_ENERGY: 0,
    EXPLODING_DAMAGE: true,
    EXPLODING_DAMAGE_PARTICLE_COUNT: 3,
    EXPLODING_DEATH: true,
    EXPLODING_DEATH_PARTICLE_COUNT: 10,
  },
  PLAYER_MANAGER: {
    AUTO_MANAGE_PLAYER: true,
    HOLD_TO_MOVE: true,
    SWIPE_TO_JUMP: true,
    TOUCH_DPAD_ENABLED: false,
    TOUCH_DPAD_DEAD_ZONE_SIZE: 6,
    TOUCH_DPAD_SIZE: 32,
    TOUCH_DPAD_BOUNDS_PCT_MINX: 0,
    TOUCH_DPAD_BOUNDS_PCT_MINY: 0,
    TOUCH_DPAD_BOUNDS_PCT_MAXX: 1,
    TOUCH_DPAD_BOUNDS_PCT_MAXY: 1,
  },

  CREATURE: {
    REACTION_DISTANCE: 100,
    REACTION_DELAY: 0.2,
    PREDATOR_FROM_DAMAGE: false,
    CAN_LEARN_PREDATORS: false,
    NEEDS_LINE_OF_SIGHT_PREY: true,
    DETECT_HIDDEN_PREY: false,
    MOVE_TO_PREY_SETTINGS: {
      avoidEntities: true,
      // searchDistance: CREATURE.REACTION_DISTANCE
    },
    NEEDS_LINE_OF_SIGHT_PREDATOR: true,
    DETECT_HIDDEN_PREDATOR: false,
    MOVE_TO_PREDATOR_SETTINGS: {
      avoidEntities: true,
      // searchDistance: CREATURE.REACTION_DISTANCE
    },
    CAN_FLEE: true,
    FLEE_HEALTH_PCT: 0.15,
    CAN_BREAK_TETHER: false,
    TETHER_TO_SPAWNER: false,
    TETHER_DISTANCE: 100,
    MOVE_TO_TETHER_SETTINGS: {
      avoidEntities: true,
    },
    CAN_WANDER_X: true,
    CAN_WANDER_Y: false,
    WANDER_SWITCH_CHANCE: 0,
    WANDER_SWITCH_CHANCE_STOPPED: 0,
    MOVE_TO_WANDER_SETTINGS: {
      simple: true,
      avoidUngrounded: true,
      avoidSlopes: true,
    },
  },
  PARTICLE: {
    ANIM_AUTOMATIC: true,
  },
  COLLISION: {
    ALLOW_FIXED: false,
    TILE_SOLID: 1,
    TILE_ONE_WAY_UP: 12,
    TILE_ONE_WAY_DOWN: 23,
    TILE_ONE_WAY_RIGHT: 34,
    TILE_ONE_WAY_LEFT: 45,
    TILE_CLIMBABLE_WITH_TOP: 46,
    TILE_CLIMBABLE: 47,
    TILE_CLIMBABLE_STAIRS_WITH_TOP: 48,
    TILE_CLIMBABLE_STAIRS: 49,
    TILES_HASH_ONE_WAY: {},
    TILES_HASH_CLIMBABLE: {},
    TILES_HASH_CLIMBABLE_ONE_WAY: {},
    TILES_HASH_CLIMBABLE_STAIRS: {},
    TILES_HASH_WALKABLE: {
      0: true,
      50: true,
      51: true,
    },
    TILES_HASH_WALKABLE_STRICT: {
      0: true,
      50: true,
      51: true,
    },
    TILES_HASH_SLOPED: {
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true,
      8: true,
      9: true,
      10: true,
      11: true,
      13: true,
      14: true,
      15: true,
      16: true,
      17: true,
      18: true,
      19: true,
      20: true,
      21: true,
      22: true,
      24: true,
      25: true,
      26: true,
      27: true,
      28: true,
      29: true,
      30: true,
      31: true,
      32: true,
      33: true,
      35: true,
      36: true,
      37: true,
      38: true,
      39: true,
      40: true,
      41: true,
      42: true,
      43: true,
      44: true,
      52: true,
      53: true,
      54: true,
      55: true,
    },
  },
  PATHFINDING: {
    BUILD_WITH_LEVEL: true,
    WEIGHTED: true,
    ALLOW_DIAGONAL: true,
    DIAGONAL_REQUIRES_BOTH_DIRECT: true,
    AVOID_ENTITIES: true,
    WEIGHT: 10,
    WEIGHT_AWAY_FROM: 2,
    AWAY_FROM_DISTANCE: 100,
    AWAY_FROM_MIN_DISTANCE_PCT: 0.4,
    AWAY_FROM_MAX_NODES: 40,
    STRICT_SLOPE_CHECK: false,
    TILE_DEF: {
      0: { weightPct: 1 },
      1: { weightPct: 0, walkable: true },
      2: { weightPct: 0.25, walkable: true },
      3: { weightPct: 0.75, walkable: true },
      4: { walkable: false },
    },
  },
  OVERLAY: {
    R: 0,
    G: 0,
    B: 0,
    ALPHA: 0.8,
    PIXEL_PERFECT: false,
  },
  TEXT_BUBBLE: {
    SIZE_X: 120,
    SIZE_Y: 70,
    SIZE_AS_PCT: true,
    SIZE_PCT_X: 0.5,
    SIZE_PCT_Y: 0.5,
    CORNER_RADIUS: 5,
    CORNER_RADIUS_AS_PCT: false,
    PIXEL_PERFECT: false,
    R: 0.9,
    G: 0.9,
    B: 0.9,
    ALPHA: 1,
    TRIANGLE_LENGTH: 10,
    TRIANGLE_WIDTH: 12,
    PADDING_X: 6,
    PADDING_Y: 6,
    SHRINK_TO_TEXT: true,
  },
};

plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[plusplusConfig.COLLISION.TILE_ONE_WAY_UP] = true;
plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[plusplusConfig.COLLISION.TILE_ONE_WAY_DOWN] = true;
plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[plusplusConfig.COLLISION.TILE_ONE_WAY_RIGHT] = true;
plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[plusplusConfig.COLLISION.TILE_ONE_WAY_LEFT] = true;
plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[plusplusConfig.COLLISION.TILE_CLIMBABLE_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_ONE_WAY[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS_WITH_TOP] = true;

plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE] = true;
plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS] = true;

plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_ONE_WAY[plusplusConfig.COLLISION.TILE_CLIMBABLE_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_ONE_WAY[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS_WITH_TOP] = true;

plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_STAIRS[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_CLIMBABLE_STAIRS[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS] = true;

plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_ONE_WAY_UP] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_ONE_WAY_DOWN] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_ONE_WAY_RIGHT] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_ONE_WAY_LEFT] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS_WITH_TOP] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS] = true;

plusplusConfig.COLLISION.TILES_HASH_WALKABLE_STRICT[plusplusConfig.COLLISION.TILE_CLIMBABLE] = true;
plusplusConfig.COLLISION.TILES_HASH_WALKABLE_STRICT[plusplusConfig.COLLISION.TILE_CLIMBABLE_STAIRS] = true;

plusplusConfig.Z_INDEX_TRANSITIONER = plusplusConfig.Z_INDEX_ABOVE_PLAYER;

plusplusConfig.RANKS_MAP = {
  NONE: 0,
  EASY: Math.round(plusplusConfig.LEVEL_MAX * 0.25),
  MEDIUM: Math.round(plusplusConfig.LEVEL_MAX * 0.5),
  HARD: Math.round(plusplusConfig.LEVEL_MAX * 0.75),
  IMPOSSIBLE: plusplusConfig.LEVEL_MAX,
};

// merge in user config over this config

ig.merge(plusplusConfig, plusplusConfigUser);

plusplusConfig.ENTITY.CAN_FLIP_Y = plusplusConfig.ENTITY.CAN_FLIP_Y || plusplusConfig.FLIP_Y;
// finish calculating values that are based only on other config values

plusplusConfig.FONT.MAIN_PATH = plusplusConfig.FONT.MAIN_NAME
  ? plusplusConfig.PATH_TO_MEDIA + plusplusConfig.FONT.MAIN_NAME
  : "";

plusplusConfig.FONT.ALT_PATH = plusplusConfig.FONT.ALT_NAME
  ? plusplusConfig.PATH_TO_MEDIA + plusplusConfig.FONT.ALT_NAME
  : "";

plusplusConfig.FONT.CHAT_PATH = plusplusConfig.FONT.CHAT_NAME
  ? plusplusConfig.PATH_TO_MEDIA + plusplusConfig.FONT.CHAT_NAME
  : "";

plusplusConfig.RANKS = (() => {
  const ranks: Rank[] = [];

  for (const rank in plusplusConfig.RANKS_MAP) {
    ranks.push({
      name: rank,
      level: plusplusConfig.RANKS_MAP[rank],
    });
  }

  ranks.sort(function (a, b) {
    return a.level - b.level;
  });

  return ranks;
})();

plusplusConfig.ENTITY.SIZE_EFFECTIVE_X = plusplusConfig.ENTITY.SIZE_X - plusplusConfig.ENTITY.SIZE_OFFSET_X * 2;
plusplusConfig.ENTITY.SIZE_EFFECTIVE_Y = plusplusConfig.ENTITY.SIZE_Y - plusplusConfig.ENTITY.SIZE_OFFSET_Y * 2;
plusplusConfig.ENTITY.SIZE_EFFECTIVE_MIN = Math.min(
  plusplusConfig.ENTITY.SIZE_EFFECTIVE_X,
  plusplusConfig.ENTITY.SIZE_EFFECTIVE_Y
);
plusplusConfig.ENTITY.SIZE_EFFECTIVE_MAX = Math.max(
  plusplusConfig.ENTITY.SIZE_EFFECTIVE_X,
  plusplusConfig.ENTITY.SIZE_EFFECTIVE_Y
);
plusplusConfig.CHARACTER.SIZE_EFFECTIVE_X = plusplusConfig.CHARACTER.SIZE_X - plusplusConfig.CHARACTER.SIZE_OFFSET_X * 2;
plusplusConfig.CHARACTER.SIZE_EFFECTIVE_Y = plusplusConfig.CHARACTER.SIZE_Y - plusplusConfig.CHARACTER.SIZE_OFFSET_Y * 2;
plusplusConfig.CHARACTER.SIZE_EFFECTIVE_MIN = Math.min(
  plusplusConfig.CHARACTER.SIZE_EFFECTIVE_X,
  plusplusConfig.CHARACTER.SIZE_EFFECTIVE_Y
);
plusplusConfig.CHARACTER.SIZE_EFFECTIVE_MAX = Math.max(
  plusplusConfig.CHARACTER.SIZE_EFFECTIVE_X,
  plusplusConfig.CHARACTER.SIZE_EFFECTIVE_Y
);
