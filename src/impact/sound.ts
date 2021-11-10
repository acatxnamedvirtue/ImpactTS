import { ig } from "./impact";
import { erase, limit, rangeMap } from "./util";
import { igTimer } from "./timer";
import { LoadCallback } from "./loader";

type Format = { ext: string; mime: string };

type Formats = {
  MP3: Format;
  M4A: Format;
  OGG: Format;
  WEBM: Format;
  CAF: Format;
};

export class igSoundManager {
  clips: Record<string, (igWebAudioSource | HTMLAudioElement[]) | HTMLAudioElement> = {};
  volume = 1;
  format: Format = null;
  audioContext: AudioContext = null;

  constructor() {
    // Quick sanity check if the Browser supports the Audio tag
    if (!igSound.enabled || !window.Audio) {
      igSound.enabled = false;
      return;
    }

    // Probe sound formats and determine the file extension to load
    const probe = new Audio();
    for (const format of igSound.use) {
      if (probe.canPlayType(format.mime)) {
        this.format = format;
        break;
      }
    }

    // No compatible format found? -> Disable sound
    if (!this.format) {
      igSound.enabled = false;
    }

    // Create WebAudio Context
    if (igSound.enabled && igSound.useWebAudio) {
      this.audioContext = new AudioContext();
      ig.system.canvas.addEventListener("touchstart", this.unlockWebAudio.bind(this), false);
      ig.system.canvas.addEventListener("mousedown", this.unlockWebAudio.bind(this), false);
    }
  }

  unlockWebAudio(): void {
    ig.system.canvas.removeEventListener("touchstart", this.unlockWebAudio, false);
    ig.system.canvas.removeEventListener("mousedown", this.unlockWebAudio, false);

    if (!this.audioContext) {
      return;
    }

    // create empty buffer
    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    source.connect(this.audioContext.destination);
    source.start(0);
  }

  load(
    path: string,
    multiChannel: boolean,
    loadCallback?: LoadCallback
  ): (HTMLAudioElement[] | igWebAudioSource) | HTMLAudioElement {
    if (multiChannel && igSound.useWebAudio) {
      // Requested as Multichannel and we're using WebAudio?
      return this.loadWebAudio(path, multiChannel, loadCallback);
    } else {
      // Oldschool HTML5 Audio - always used for Music
      return this.loadHTML5Audio(path, multiChannel, loadCallback);
    }
  }

  loadWebAudio(
    path: string,
    _multiChannel: boolean,
    loadCallback?: LoadCallback
  ): (igWebAudioSource | HTMLAudioElement[]) | HTMLAudioElement {
    // Path to the soundfile with the right extension (.ogg or .mp3)
    const realPath = path.replace(/[^.]+$/, this.format?.ext || "") + ig.nocache;

    if (this.clips[path]) {
      return this.clips[path] as igWebAudioSource & HTMLAudioElement[];
    }

    const audioSource = new igWebAudioSource();
    this.clips[path] = audioSource;

    const request = new XMLHttpRequest();
    request.open("GET", realPath, true);
    request.responseType = "arraybuffer";

    request.onload = (ev) => {
      this.audioContext.decodeAudioData(
        request.response,
        (buffer: AudioBuffer) => {
          audioSource.buffer = buffer;
          if (loadCallback) {
            loadCallback(path, true, ev);
          }
        },
        (ev: Error) => {
          if (loadCallback) {
            loadCallback(path, false, ev);
          }
        }
      );
    };
    request.onerror = function (ev) {
      if (loadCallback) {
        loadCallback(path, false, ev);
      }
    };
    request.send();

    return audioSource;
  }

  loadHTML5Audio(
    path: string,
    multiChannel: boolean,
    loadCallback?: LoadCallback
  ): (HTMLAudioElement[] | igWebAudioSource) | HTMLAudioElement {
    // Path to the soundfile with the right extension (.ogg or .mp3)
    const realPath = path.replace(/[^.]+$/, this.format?.ext ?? "") + ig.nocache;

    // igSound file already loaded?
    if (this.clips[path]) {
      // Loaded as WebAudio, but now requested as HTML5 Audio? Probably Music?
      if (this.clips[path] instanceof igWebAudioSource) {
        return this.clips[path] as igWebAudioSource;
      }

      // Only loaded as single channel and now requested as multichannel?
      if (multiChannel && (this.clips[path] as HTMLAudioElement[]).length < igSound.channels) {
        for (let i = (this.clips[path] as HTMLAudioElement[]).length; i < igSound.channels; i++) {
          const a = new Audio(realPath);
          a.load();
          (this.clips[path] as HTMLAudioElement[]).push(a);
        }
      }
      return (this.clips[path] as HTMLAudioElement[])[0];
    }

    const clip = new Audio(realPath);

    if (loadCallback) {
      // The canplaythrough event is dispatched when the browser determines
      // that the sound can be played without interuption, provided the
      // download rate doesn't change.
      // Mobile browsers stubbornly refuse to preload HTML5, so we simply
      // ignore the canplaythrough event and immediately "fake" a successful
      // load callback
      if (ig.ua.mobile) {
        setTimeout(function () {
          loadCallback(path, true, null);
        }, 0);
      } else {
        clip.addEventListener(
          "canplaythrough",
          function cb(ev) {
            clip.removeEventListener("canplaythrough", cb, false);
            loadCallback(path, true, ev);
          },
          false
        );

        clip.addEventListener(
          "error",
          function (ev) {
            loadCallback(path, false, ev);
          },
          false
        );
      }
    }
    clip.preload = "auto";
    clip.load();

    this.clips[path] = [clip];

    if (multiChannel) {
      for (let i = 1; i < igSound.channels; i++) {
        const a = new Audio(realPath);
        a.load();
        (this.clips[path] as HTMLAudioElement[]).push(a);
      }
    }

    return clip;
  }

  get(path: string): (HTMLAudioElement[] | igWebAudioSource) | HTMLAudioElement {
    // Find and return a channel that is not currently playing
    const channels = this.clips[path] as HTMLAudioElement[];

    // Is this a WebAudio source? We only ever have one for each igSound
    if (channels && channels instanceof igWebAudioSource) {
      return channels;
    }

    // Oldschool HTML5 Audio - find a channel that's not currently
    // playing or, if all are playing, rewind one
    for (let i = 0, clip; (clip = channels[i++]); ) {
      if (clip.paused || clip.ended) {
        if (clip.ended) {
          clip.currentTime = 0;
        }
        return clip;
      }
    }

    // Still here? Pause and rewind the first channel
    channels[0].pause();
    channels[0].currentTime = 0;
    return channels[0];
  }
}

export class igMusic {
  tracks: HTMLAudioElement[] = [];
  namedTracks: Record<string, HTMLAudioElement> = {};
  currentTrack: HTMLAudioElement = null;
  currentIndex = 0;
  random = false;

  _volume = 1;
  _loop = false;
  _fadeInterval: NodeJS.Timeout;
  _fadeTimer: igTimer = null;

  constructor() {
    Object.defineProperty(this, "volume", {
      get: this.getVolume.bind(this),
      set: this.setVolume.bind(this),
    });

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });
  }

  add(music: igSound | string, name: string): void {
    if (!igSound.enabled) {
      return;
    }

    const path = music instanceof igSound ? music.path : music;

    const track = ig.soundManager.load(path, false) as HTMLAudioElement;

    // Did we get a WebAudio Source? This is suboptimal; Music should be loaded
    // as HTML5 Audio so it can be streamed
    if (track instanceof igWebAudioSource) {
      // Since this error will likely occur at game start, we stop the game
      // to not produce any more errors.
      ig.system.stopRunLoop();
      throw (
        "igSound '" +
        path +
        "' loaded as Multichannel but used for Music. " +
        "Set the multiChannel param to false when loading, e.g.: new igSound(path, false)"
      );
    }

    track.loop = this._loop;
    track.volume = this._volume;
    track.addEventListener("ended", this._endedCallback.bind(this), false);
    this.tracks.push(track);

    if (name) {
      this.namedTracks[name] = track;
    }

    if (!this.currentTrack) {
      this.currentTrack = track;
    }
  }

  next(): void {
    if (!this.tracks.length) {
      return;
    }

    this.stop();
    this.currentIndex = this.random
      ? Math.floor(Math.random() * this.tracks.length)
      : (this.currentIndex + 1) % this.tracks.length;
    this.currentTrack = this.tracks[this.currentIndex];
    this.play();
  }

  pause(): void {
    if (!this.currentTrack) return;
    this.currentTrack.pause();
  }

  stop(): void {
    if (!this.currentTrack) return;
    this.currentTrack.pause();
    this.currentTrack.currentTime = 0;
  }

  play(name?: string): void {
    // If a name was provided, stop playing the current track (if any)
    // and play the named track
    if (name && this.namedTracks[name]) {
      const newTrack = this.namedTracks[name];
      if (newTrack !== this.currentTrack) {
        this.stop();
        this.currentTrack = newTrack;
      }
    } else if (!this.currentTrack) {
      return;
    }
    this.currentTrack.play();
  }

  getLooping(): boolean {
    return this._loop;
  }

  setLooping(l: boolean): void {
    this._loop = l;
    this.tracks.forEach((track) => {
      track.loop = l;
    });
  }

  getVolume(): number {
    return this._volume;
  }

  setVolume(v: number): void {
    this._volume = limit(v, 0, 1);
    this.tracks.forEach((track) => {
      track.volume = this._volume;
    });
  }

  fadeOut(time: number): void {
    if (!this.currentTrack) return;

    clearInterval(this._fadeInterval);
    this._fadeTimer = new igTimer(time);
    this._fadeInterval = setInterval(this._fadeStep.bind(this), 50);
  }

  private _fadeStep() {
    const v =
      limit(rangeMap(this._fadeTimer?.delta() ?? 0, -(this._fadeTimer?.target ?? 0), 0, 1, 0), 0, 1) * this._volume;

    if (v <= 0.01) {
      this.stop();
      this.currentTrack.volume = this._volume;
      clearInterval(this._fadeInterval);
    } else {
      this.currentTrack.volume = v;
    }
  }

  private _endedCallback() {
    if (this._loop) {
      this.play();
    } else {
      this.next();
    }
  }
}

export class igSound {
  static FORMAT: Formats = {
    MP3: { ext: "mp3", mime: "audio/mpeg" },
    M4A: { ext: "m4a", mime: "audio/mp4; codecs=mp4a.40.2" },
    OGG: { ext: "ogg", mime: "audio/ogg; codecs=vorbis" },
    WEBM: { ext: "webm", mime: "audio/webm; codecs=vorbis" },
    CAF: { ext: "caf", mime: "audio/x-caf" },
  };

  static use = [igSound.FORMAT.OGG, igSound.FORMAT.MP3];
  static channels = 4;
  static enabled = true;
  static useWebAudio = !!window.AudioContext;

  path: string;
  volume = 1;
  currentClip: HTMLAudioElement = null;
  multiChannel = false;
  _loop = false;

  constructor(path: string, multiChannel?: boolean) {
    this.path = path;
    this.multiChannel = multiChannel !== false;

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });

    this.load();
  }

  getLooping(): boolean {
    return this._loop;
  }

  setLooping(loop: boolean): void {
    this._loop = loop;

    if (this.currentClip) {
      this.currentClip.loop = loop;
    }
  }

  load(loadCallback?: LoadCallback): void {
    if (!igSound.enabled) {
      if (loadCallback) {
        loadCallback(this.path, true);
      }
      return;
    }

    if (ig.ready) {
      ig.soundManager.load(this.path, this.multiChannel, loadCallback);
    } else {
      ig.addResource(this);
    }
  }

  play(): void {
    if (!igSound.enabled) {
      return;
    }

    this.currentClip = ig.soundManager.get(this.path) as HTMLAudioElement;

    if (this.currentClip) {
      this.currentClip.loop = this._loop;
      this.currentClip.volume = ig.soundManager.volume * this.volume;
      this.currentClip.play();
    }
  }

  stop(): void {
    if (this.currentClip) {
      this.currentClip.pause();
      this.currentClip.currentTime = 0;
    }
  }
}

export class igWebAudioSource {
  sources: AudioBufferSourceNode[] = [];
  gain: GainNode;
  buffer: AudioBuffer = null;
  _loop = false;

  constructor() {
    this.gain = ig.soundManager.audioContext.createGain();
    this.gain.connect(ig.soundManager.audioContext.destination);

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });

    Object.defineProperty(this, "volume", {
      get: this.getVolume.bind(this),
      set: this.setVolume.bind(this),
    });
  }

  play(): void {
    if (!this.buffer) return;

    const source = ig.soundManager.audioContext.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gain);
    source.loop = this._loop;

    // Add this new source to our sources array and remove it again
    // later when it has finished playing.
    this.sources.push(source);
    source.onended = () => {
      erase(this.sources, source);
    };

    source.start(0);
  }

  pause(): void {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch (err) {}
    });
  }

  getLooping(): boolean {
    return this._loop;
  }

  setLooping(loop: boolean): void {
    this._loop = loop;

    this.sources.forEach((source) => {
      source.loop = loop;
    });
  }

  getVolume(): number {
    return this.gain.gain.value;
  }

  setVolume(volume: number): void {
    this.gain.gain.value = volume;
  }
}
