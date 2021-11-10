import { ig } from "../impact";
import { igImage } from "../image";
import { igEntity } from "../entity";
import { igBackgroundMap } from "../background-map";

export type PanelDefinition = {
  type: typeof igDebugPanel;
  name: string;
  label: string;
  options?: { name: string; object: typeof igEntity; property: string }[];
};

export class igDebug {
  options = {};
  panels: Record<string, igDebugPanel> = {};
  numbers: Record<string, HTMLSpanElement> = {};
  container: HTMLDivElement;
  panelMenu: HTMLDivElement;
  numberContainer: HTMLDivElement;
  activePanel: igDebugPanel = null;

  debugTime = 0;
  debugTickAvg = 0.016;
  debugRealTime = Date.now();

  constructor() {
    const body = (ig.$("body") as HTMLCollectionOf<HTMLBodyElement>)[0];

    // Inject the Stylesheet
    const style = ig.$new("link") as HTMLLinkElement;
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = "impact/debug/debug.css";
    body.appendChild(style);

    // Create the Debug Container
    this.container = ig.$new("div") as HTMLDivElement;
    this.container.className = "ig_debug";
    body.appendChild(this.container);

    // Create and add the Menu Container
    this.panelMenu = ig.$new("div") as HTMLDivElement;
    this.panelMenu.innerHTML = '<div class="ig_debug_head">Impact.Debug:</div>';
    this.panelMenu.className = "ig_debug_panel_menu";

    this.container.appendChild(this.panelMenu);

    // Create and add the Stats Container
    this.numberContainer = ig.$new("div") as HTMLDivElement;
    this.numberContainer.className = "ig_debug_stats";
    this.panelMenu.appendChild(this.numberContainer);

    // Set ig.log(), ig.assert() and ig.show()
    if (window.console && window.console.log && window.console.assert) {
      // Can't use .bind() on native functions in IE9 :/
      ig.log = console.log.bind ? console.log.bind(console) : console.log;
      ig.assert = console.assert.bind ? console.assert.bind(console) : console.assert;
    }
    ig.show = this.showNumber.bind(this);
  }

  addNumber(name: string): void {
    const number = ig.$new("span");
    this.numberContainer.appendChild(number);
    this.numberContainer.appendChild(document.createTextNode(name));

    this.numbers[name] = number;
  }

  showNumber(name: string, number: string): void {
    if (!this.numbers[name]) {
      this.addNumber(name);
    }

    this.numbers[name].textContent = number;
  }

  addPanel(panelDef: PanelDefinition): void {
    // Create the panel and options
    const panel = new panelDef.type(panelDef.name, panelDef.label);
    if (panelDef.options) {
      for (let i = 0; i < panelDef.options.length; i++) {
        const opt = panelDef.options[i];
        panel.addOption(new igDebugOption(opt.name, opt.object, opt.property));
      }
    }

    this.panels[panel.name] = panel;
    panel.container.style.display = "none";
    this.container.appendChild(panel.container);

    // Create the menu item
    const menuItem = ig.$new("div") as HTMLDivElement;
    menuItem.className = "ig_debug_menu_item";
    menuItem.textContent = panel.label;
    menuItem.addEventListener("click", () => this.togglePanel(panel), false);
    panel.menuItem = menuItem;

    // Insert menu item in alphabetical order into the menu
    let inserted = false;
    for (let i = 1; i < this.panelMenu.childNodes.length; i++) {
      const cn = this.panelMenu.childNodes[i];
      if (cn.textContent > panel.label) {
        this.panelMenu.insertBefore(menuItem, cn);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      // Not inserted? Append at the end!
      this.panelMenu.appendChild(menuItem);
    }
  }

  showPanel(name: string): void {
    this.togglePanel(this.panels[name]);
  }

  togglePanel(panel: igDebugPanel): void {
    if (panel != this.activePanel && this.activePanel !== null) {
      this.activePanel.toggle(false);
      this.activePanel.menuItem.className = "ig_debug_menu_item";
      this.activePanel = null;
    }

    const dsp = panel.container.style.display;
    const active = dsp != "block";
    panel.toggle(active);
    panel.menuItem.className = "ig_debug_menu_item" + (active ? " active" : "");

    if (active) {
      this.activePanel = panel;
    }
  }

  ready(): void {
    for (const p in this.panels) {
      this.panels[p].ready();
    }
  }

  beforeRun(): void {
    const timeBeforeRun = Date.now();
    this.debugTickAvg = this.debugTickAvg * 0.8 + (timeBeforeRun - this.debugRealTime) * 0.2;
    this.debugRealTime = timeBeforeRun;

    if (this.activePanel) {
      this.activePanel.beforeRun();
    }
  }

  afterRun(): void {
    const frameTime = Date.now() - this.debugRealTime;

    this.debugTime = this.debugTime * 0.8 + frameTime * 0.2;

    if (this.activePanel) {
      this.activePanel.afterRun();
    }

    this.showNumber("ms", this.debugTime.toFixed(2));
    this.showNumber("fps", Math.round(1000 / this.debugTickAvg).toString(10));
    this.showNumber("draws", igImage.drawCount.toString(10));
    if (ig.game && ig.game.entities) {
      this.showNumber("entities", ig.game.entities.length);
    }
    igImage.drawCount = 0;
  }
}

export class igDebugPanel {
  active = false;
  container: HTMLDivElement;
  options: igDebugOption[] = [];
  panels: igDebugPanel[] = [];
  menuItem: HTMLDivElement = null;
  label = "";
  name = "";

  constructor(name: string, label: string) {
    this.name = name;
    this.label = label;
    this.container = ig.$new("div") as HTMLDivElement;
    this.container.className = "ig_debug_panel " + this.name;
  }

  toggle(active: boolean): void {
    this.active = active;
    this.container.style.display = active ? "block" : "none";
  }

  addPanel(panel: igDebugPanel): void {
    this.panels.push(panel);
    this.container.appendChild(panel.container);
  }

  addOption(option: igDebugOption): void {
    this.options.push(option);
    this.container.appendChild(option.container);
  }

  ready(): void {}

  beforeRun(): void {}

  afterRun(): void {}
}

type igEntityClassPropertyPair = {
  object: typeof igEntity;
  property: keyof typeof igEntity;
};

type igBackgroundMapPropertyPair = {
  object: igBackgroundMap;
  property: keyof igBackgroundMap;
};

export class igDebugOption {
  name = "";
  labelName = "";
  className = "ig_debug_option";
  label: HTMLSpanElement;
  mark: HTMLSpanElement;
  container: HTMLDivElement;
  active = false;
  object: any;
  property: any;

  colors = {
    enabled: "#FFF",
    disabled: "#444",
  };

  constructor(name: string, object: typeof igEntity | igBackgroundMap, property: string) {
    this.name = name;
    this.object = object;
    this.property = property;

    this.active = this.object[this.property];

    this.container = ig.$new("div") as HTMLDivElement;
    this.container.className = "ig_debug_option";

    this.label = ig.$new("span");
    this.label.className = "ig_debug_label";
    this.label.textContent = this.name;

    this.mark = ig.$new("span");
    this.mark.className = "ig_debug_label_mark";

    this.container.appendChild(this.mark);
    this.container.appendChild(this.label);
    this.container.addEventListener("click", this.click.bind(this), false);

    this.setLabel();
  }

  setLabel(): void {
    this.mark.style.backgroundColor = this.active ? this.colors.enabled : this.colors.disabled;
  }

  click(e: Event): boolean {
    this.active = !this.active;
    this.object[this.property] = this.active;
    this.setLabel();

    e.stopPropagation();
    e.preventDefault();
    return false;
  }
}
