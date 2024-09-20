import { ipcMain, BrowserWindow } from 'electron';
import { checkWhisperInstalled, getModelsInstalled, getPath, deleteModel, downloadModelSync, install, makeWhisper } from './whisper';

let downloadingModels = new Set<string>();

export function setupSystemInfoManager(mainWindow: BrowserWindow) {
  ipcMain.handle("getSystemInfo", async () => {
    return {
      whisperInstalled: checkWhisperInstalled(),
      modelsInstalled: getModelsInstalled(),
      modelsPath: getPath("modelsPath"),
      downloadingModels: Array.from(downloadingModels),
    };
  });

  ipcMain.handle("deleteModel", async (event, modelName) => {
    await deleteModel(modelName);
    return true;
  });

  ipcMain.handle("downloadModel", async (event, { model, source }) => {
    downloadingModels.add(model);
    const onProcess = (data) => {
      const match = data?.match(/(\d+)%/);
      if (match) {
        event.sender.send("downloadProgress", model, +match[1]);
      }
      if(data?.includes("Done") || data?.includes("main")) {
        event.sender.send("downloadProgress", model, 100);
      }
    };
    try {
      await downloadModelSync(model?.toLowerCase(), source, onProcess);
      downloadingModels.delete(model);
    } catch (error) {
      event.sender.send("message", "下载失败，请切换下载源重试");
      downloadingModels.delete(model);
      return false;
    }
    return true;
  });

  ipcMain.on("installWhisper", (event, source) => {
    install(event, source);
  });

  ipcMain.on("makeWhisper", (event) => {
    makeWhisper(event);
  });
}