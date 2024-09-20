import { ipcMain, BrowserWindow, dialog, shell } from 'electron';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on("message", async (event, arg) => {
    event.reply("message", `${arg} World!`);
  });

  ipcMain.on("openDialog", async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Movies", extensions: ["mkv", "avi", "mp4"] }],
    });
    
    try {
      event.sender.send("file-selected", result.filePaths);
    } catch (error) {
      event.sender.send("message", error);
    }
  });

  ipcMain.on("openUrl", (event, url) => {
    shell.openExternal(url);
  });
}