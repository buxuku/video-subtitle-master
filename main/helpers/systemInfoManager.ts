import { ipcMain, BrowserWindow, dialog } from 'electron';
import {
  getModelsInstalled,
  getPath,
  deleteModel,
  downloadModelSync,
} from './whisper';
import fse from 'fs-extra';
import path from 'path';

let downloadingModels = new Set<string>();

export function setupSystemInfoManager(mainWindow: BrowserWindow) {
  ipcMain.handle('getSystemInfo', async () => {
    return {
      modelsInstalled: getModelsInstalled(),
      modelsPath: getPath('modelsPath'),
      downloadingModels: Array.from(downloadingModels),
    };
  });

  ipcMain.handle('deleteModel', async (event, modelName) => {
    await deleteModel(modelName?.toLowerCase());
    return true;
  });

  ipcMain.handle('downloadModel', async (event, { model, source }) => {
    if (downloadingModels.has(model)) {
      return false; // 如果模型已经在下载中，则返回 false
    }
    
    downloadingModels.add(model);
    const onProcess = (data) => {
      const match = data?.match?.(/(\d+)/);
      if (match) {
        event.sender.send('downloadProgress', model, +match[1]);
      }
      if (data?.includes?.('Done') || data?.includes?.('main')) {
        event.sender.send('downloadProgress', model, 100);
      }
    };
    try {
      await downloadModelSync(model?.toLowerCase(), source, onProcess);
      downloadingModels.delete(model);
      return true;
    } catch (error) {
      event.sender.send('message', 'download error, please try again');
      downloadingModels.delete(model);
      return false;
    }
  });

  ipcMain.handle('importModel', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Model Files', extensions: ['bin', 'mlmodelc'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      const fileName = path.basename(sourcePath);
      const destPath = path.join(getPath('modelsPath'), fileName);

      try {
        await fse.copy(sourcePath, destPath);
        return true;
      } catch (error) {
        console.error('导入模型失败:', error);
        return false;
      }
    }

    return false;
  });
}
