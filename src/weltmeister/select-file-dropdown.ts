import { browse, BrowseResult } from "./api/browse";

export class wmSelectFileDropdown {
  input: JQuery<HTMLInputElement> = null;
  div: JQuery<HTMLDivElement> = null;
  filetype = "";

  constructor(elementId: string, filetype = "") {
    this.filetype = filetype;
    this.input = $(elementId);
    this.input.on("focus", this.show.bind(this));

    this.div = $("<div/>", { class: "selectFileDialog" });
    this.input.after(this.div);
    this.div.on("mousedown", this.noHide.bind(this));

    this.loadDir(".");
  }

  loadDir(dir: string): void {
    const result = browse(dir, "scripts");
    this.showFiles(result);
  }

  selectDir(event: Event): boolean {
    this.loadDir($(event.target).attr("href"));
    return false;
  }

  selectFile(event: Event): boolean {
    this.input.val($(event.target).attr("href"));
    this.input.trigger("blur");
    this.hide();
    return false;
  }

  showFiles(data: BrowseResult): void {
    this.div.empty();
    if (data.parent !== false) {
      const parentDir = $("<a/>", {
        class: "dir",
        href: data.parent,
        html: "&hellip;parent directory",
      });
      parentDir.on("click", this.selectDir.bind(this));
      this.div.append(parentDir);
    }
    for (let i = 0; i < data.dirs.length; i++) {
      const name = data.dirs[i].match(/[^/]*$/)[0] + "/";
      const dir = $("<a/>", {
        class: "dir",
        href: data.dirs[i],
        html: name,
        title: name,
      });
      dir.on("click", this.selectDir.bind(this));
      this.div.append(dir);
    }
    for (let i = 0; i < data.files.length; i++) {
      const name = data.files[i].match(/[^/]*$/)[0];
      const file = $("<a/>", {
        class: "file",
        href: data.files[i],
        html: name,
        title: name,
      });
      file.on("click", this.selectFile.bind(this));
      this.div.append(file);
    }
  }

  noHide(event: Event): void {
    event.stopPropagation();
  }

  show(_event: Event): void {
    const inputPos = this.input.position(); //this.input.getPosition(this.input.getOffsetParent());
    const inputHeight = this.input.innerHeight() + parseInt(this.input.css("margin-top"));
    const inputWidth = this.input.innerWidth();
    $(document).on("mousedown", this.hide.bind(this));
    this.div
      .css({
        top: inputPos.top + inputHeight + 1,
        left: inputPos.left,
        width: inputWidth,
      })
      .slideDown(100);
  }

  hide(): void {
    $(document).off("mousedown", this.hide.bind(this));
    this.div.slideUp(100);
  }
}
