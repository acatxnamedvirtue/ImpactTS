import { igDebugPanel } from "./menu";
import { ig } from "../impact";

type Clock = {
  description: string;
  color: string;
  current: number;
  start: number;
  avg: number;
  html: HTMLSpanElement;
};

export class igDebugGraphPanel extends igDebugPanel {
  clocks: Record<string, Clock> = {};
  marks: { msg: string; color: string }[] = [];
  textY = 0;
  height = 128;
  ms = 64;
  timeBeforeRun = 0;
  mark16ms: number;
  mark33ms: number;
  msHeight: number;
  graph: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(name: string, label: string) {
    super(name, label);

    this.mark16ms = Math.round(this.height - (this.height / this.ms) * 16);
    this.mark33ms = Math.round(this.height - (this.height / this.ms) * 33);
    this.msHeight = this.height / this.ms;

    this.graph = ig.$new("canvas") as HTMLCanvasElement;
    this.graph.width = window.innerWidth;
    this.graph.height = this.height;
    this.container.appendChild(this.graph);
    this.ctx = this.graph.getContext("2d");

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(0, this.mark16ms, this.graph.width, 1);
    this.ctx.fillRect(0, this.mark33ms, this.graph.width, 1);

    this.addGraphMark("16ms", this.mark16ms);
    this.addGraphMark("33ms", this.mark33ms);

    this.addClock("draw", "Draw", "#13baff");
    this.addClock("update", "Entity Update", "#bb0fff");
    this.addClock("checks", "Entity Checks & Collisions", "#a2e908");
    this.addClock("lag", "System Lag", "#f26900");

    ig.mark = this.mark.bind(this);
    ig.graph = this;
  }

  addGraphMark(name: string, height: number): void {
    const span: HTMLSpanElement = ig.$new("span");
    span.className = "ig_debug_graph_mark";
    span.textContent = name;
    span.style.top = Math.round(height) + "px";
    this.container.appendChild(span);
  }

  addClock(name: string, description: string, color: string): void {
    const mark = ig.$new("span");
    mark.className = "ig_debug_legend_color";
    mark.style.backgroundColor = color;

    const number = ig.$new("span");
    number.className = "ig_debug_legend_number";
    number.appendChild(document.createTextNode("0"));

    const legend = ig.$new("span");
    legend.className = "ig_debug_legend";
    legend.appendChild(mark);
    legend.appendChild(document.createTextNode(description + " ("));
    legend.appendChild(number);
    legend.appendChild(document.createTextNode("ms)"));

    this.container.appendChild(legend);

    this.clocks[name] = {
      description: description,
      color: color,
      current: 0,
      start: Date.now(),
      avg: 0,
      html: number,
    };
  }

  beginClock(name: string, offset = 0): void {
    this.clocks[name].start = Date.now() + offset;
  }

  endClock(name: string): void {
    const c = this.clocks[name];
    c.current = Math.round(Date.now() - c.start);
    c.avg = c.avg * 0.8 + c.current * 0.2;
  }

  mark(msg: string, color = "#FFF"): void {
    if (this.active) {
      this.marks.push({ msg, color });
    }
  }

  beforeRun(): void {
    this.endClock("lag");
    this.timeBeforeRun = Date.now();
  }

  afterRun(): void {
    const frameTime = Date.now() - this.timeBeforeRun;
    const nextFrameDue = 1000 / ig.system.fps - frameTime;
    this.beginClock("lag", Math.max(nextFrameDue, 0));

    const x = this.graph.width - 1;
    let y = this.height;

    this.ctx.drawImage(this.graph, -1, 0);

    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(x, 0, 1, this.height);

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(x, this.mark16ms, 1, 1);

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(x, this.mark33ms, 1, 1);

    for (const ci in this.clocks) {
      const c = this.clocks[ci];
      c.html.textContent = c.avg.toFixed(2);

      if (c.color && c.current > 0) {
        this.ctx.fillStyle = c.color;
        const h = c.current * this.msHeight;
        y -= h;
        this.ctx.fillRect(x, y, 1, h);
        c.current = 0;
      }
    }

    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    this.ctx.globalAlpha = 0.5;

    for (let i = 0; i < this.marks.length; i++) {
      const m = this.marks[i];
      this.ctx.fillStyle = m.color;
      this.ctx.fillRect(x, 0, 1, this.height);
      if (m.msg) {
        this.ctx.fillText(m.msg, x - 1, this.textY);
        this.textY = (this.textY + 8) % 32;
      }
    }
    this.ctx.globalAlpha = 1;
    this.marks = [];
  }
}
