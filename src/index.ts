const width = 2000;
const height = 2000;

const openGame = () => {
  nw.Window.open("./dist/index.html", {}, (window) => {
    // window.width = width;
    // window.height = height;
    window.showDevTools();
  });
};

const openWeltmeister = () => {
  nw.Window.open("./dist/weltmeister.html", {}, (window) => {
    // window.width = width;
    // window.height = height;
    window.showDevTools();
  });
};

const registerShortcuts = () => {
  const weltmeisterOption = {
    key: "Shift+W",
    active: openWeltmeister,
    failed: () => {},
  };

  const gameOption = {
    key: "Shift+G",
    active: openGame,
    failed: () => {},
  };

  const game = new nw.Shortcut(gameOption);
  const weltmeister = new nw.Shortcut(weltmeisterOption);

  nw.App.registerGlobalHotKey(game);
  nw.App.registerGlobalHotKey(weltmeister);
};

registerShortcuts();

openWeltmeister();

// TODO: Fix zooming in on WM
// It messes up sprite sheets for some reason

// TODO: Update NW.JS when SourceMaps are fixed
