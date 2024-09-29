import { ipcMain, BrowserWindow, dialog, shell } from 'electron';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on("message", async (event, arg) => {
    event.reply("message", `${arg} World!`);
  });

  ipcMain.on("openDialog", async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { 
          name: "音频、视频和字幕文件", 
          extensions: [
            // 视频格式
            "mp4", "avi", "mov", "mkv", "flv", "wmv", "webm",
            // 音频格式
            "mp3", "wav", "ogg", "aac", "wma", "flac", "m4a",
            "aiff", "ape", "opus", "ac3", "amr", "au", "mid",
            // 其他常见格式
            "3gp", "asf", "rm", "rmvb", "vob", "ts", "mts", "m2ts",
            // 字幕格式
            "srt", "vtt", "ass", "ssa"
          ]
        },
      ],
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