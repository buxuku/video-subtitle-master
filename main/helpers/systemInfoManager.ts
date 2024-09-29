import { ipcMain, BrowserWindow, dialog } from 'electron';
import {
  checkWhisperInstalled,
  getModelsInstalled,
  getPath,
  deleteModel,
  downloadModelSync,
  install,
  makeWhisper,
} from './whisper';
import fs from 'fs';
import path from 'path';

let downloadingModels = new Set<string>();

export function setupSystemInfoManager(mainWindow: BrowserWindow) {
  ipcMain.handle('getSystemInfo', async () => {
    return {
      whisperInstalled: checkWhisperInstalled(),
      modelsInstalled: getModelsInstalled(),
      modelsPath: getPath('modelsPath'),
      downloadingModels: Array.from(downloadingModels),
    };
  });

  ipcMain.handle('deleteModel', async (event, modelName) => {
    await deleteModel(modelName);
    return true;
  });

  ipcMain.handle('downloadModel', async (event, { model, source }) => {
    downloadingModels.add(model);
    const onProcess = (data) => {
      const match = data?.match(/(\d+)%/);
      if (match) {
        event.sender.send('downloadProgress', model, +match[1]);
      }
      if (data?.includes('Done') || data?.includes('main')) {
        event.sender.send('downloadProgress', model, 100);
      }
    };
    try {
      await downloadModelSync(model?.toLowerCase(), source, onProcess);
      downloadingModels.delete(model);
    } catch (error) {
      event.sender.send('message', '下载失败，请切换下载源重试');
      downloadingModels.delete(model);
      return false;
    }
    return true;
  });

  ipcMain.on('installWhisper', (event, source) => {
    install(event, source);
  });

  ipcMain.on('makeWhisper', (event) => {
    makeWhisper(event);
  });

  ipcMain.handle('importModel', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Model Files', extensions: ['bin'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      const fileName = path.basename(sourcePath);
      const destPath = path.join(getPath('modelsPath'), fileName);

      try {
        await fs.promises.copyFile(sourcePath, destPath);
        return true;
      } catch (error) {
        console.error('导入模型失败:', error);
        return false;
      }
    }

    return false;
  });
}
