import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import * as fs from 'fs';
import { createMessageSender } from './messageHandler';

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
      createMessageSender(event.sender).send('message', {
        type: 'error',
        message: error.message
      });
    }
  });

  ipcMain.on("openUrl", (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('getDroppedFiles', async (event, files) => {
    // 验证文件是否存在和可访问
    const validPaths = await Promise.all(
      files.map(async (filePath) => {
        try {
          await fs.promises.access(filePath);
          return filePath;
        } catch {
          return null;
        }
      })
    );

    return validPaths.filter(Boolean);
  });

  ipcMain.handle('selectDirectory', async () => {
    return dialog.showOpenDialog({
      properties: ['openDirectory']
    });
  });
}