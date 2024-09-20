import path from "path";
import { app } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers/create-window";
import { setupIpcHandlers } from './helpers/ipcHandler';
import { setupTaskProcessor } from './helpers/taskProcessor';
import { setupSystemInfoManager } from './helpers/systemInfoManager';
import { setupStoreHandlers } from './helpers/storeManager';

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")}-dev`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1400,
    height: 1040,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
  setupStoreHandlers();
  setupIpcHandlers(mainWindow);
  setupTaskProcessor(mainWindow);
  setupSystemInfoManager(mainWindow);
})();

app.on("window-all-closed", () => {
  app.quit();
});

