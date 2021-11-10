import { wmSelectFileDropdown } from "./select-file-dropdown";

export class wmModalDialog {
  onOk: (dialog: wmModalDialog, value?: string) => {} = null;
  onCancel: (dialog: wmModalDialog) => {} = null;

  text = "";
  okText = "";
  cancelText = "";

  background: JQuery<HTMLDivElement> = null;
  dialogBox: JQuery<HTMLDivElement> = null;
  buttonDiv: JQuery<HTMLDivElement> = null;

  constructor(text: string, okText = "OK", cancelText = "Cancel") {
    this.text = text;
    this.okText = okText;
    this.cancelText = cancelText;

    this.background = $("<div/>", { class: "modalDialogBackground" });
    this.dialogBox = $("<div/>", { class: "modalDialogBox" });
    this.background.append(this.dialogBox);
    $("body").append(this.background);

    this.initDialog();
  }

  initDialog(): void {
    this.buttonDiv = $("<div/>", { class: "modalDialogButtons" });
    const okButton = $("<input/>", {
      type: "button",
      class: "button",
      value: this.okText,
    });
    const cancelButton = $("<input/>", {
      type: "button",
      class: "button",
      value: this.cancelText,
    });

    okButton.on("click", this.clickOk.bind(this));
    cancelButton.on("click", this.clickCancel.bind(this));

    this.buttonDiv.append(okButton).append(cancelButton);

    this.dialogBox.html('<div class="modalDialogText">' + this.text + "</div>");
    this.dialogBox.append(this.buttonDiv);
  }

  clickOk(): void {
    if (this.onOk) {
      this.onOk(this);
    }
    this.close();
  }

  clickCancel(): void {
    if (this.onCancel) {
      this.onCancel(this);
    }
    this.close();
  }

  open(): void {
    this.background.fadeIn(100);
  }

  close(): void {
    this.background.fadeOut(100);
  }
}

export class wmModalDialogPathSelect extends wmModalDialog {
  pathDropdown: wmSelectFileDropdown;
  pathInput: JQuery<HTMLInputElement>;
  fileType = "";

  constructor(text: string, okText = "Select", type = "") {
    super(text, okText);
    this.fileType = type;
  }

  setPath(path: string): void {
    const dir = path.replace(/\/[^/]*$/, "");
    this.pathInput.val(path);
    this.pathDropdown.loadDir(dir);
  }

  override initDialog(): void {
    super.initDialog();
    this.pathInput = $("<input/>", { type: "text", class: "modalDialogPath" });
    this.buttonDiv.before(this.pathInput);
    this.pathDropdown = new wmSelectFileDropdown(this.pathInput as unknown as string, this.fileType);
  }

  clickOk(): void {
    if (this.onOk) {
      this.onOk(this, this.pathInput.val() as string);
    }
    this.close();
  }
}
