import { ipcMain, BrowserWindow, dialog } from 'electron';
import {
  checkWhisperInstalled,
  getModelsInstalled,
  getPath,
  deleteModel,
  downloadModelSync,
  install,
  makeWhisper,
  reinstallWhisper,
} from './whisper';
import fs from 'fs';
import path from 'path';
import { IModelDownloadProgress } from '../types';

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
    await deleteModel(modelName?.toLowerCase());
    return true;
  });

  ipcMain.handle('downloadModel', async (event, { model, source }) => {
    if (downloadingModels.has(model)) {
      return false; // 如果模型已经在下载中，则返回 false
    }
    
    downloadingModels.add(model);
    const onProcess = (data: IModelDownloadProgress) => {
      if (data?.status === 'loading') {
        event.sender.send('downloadProgress', model, data?.percent);
      }
      if (data?.status === 'done') {
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

  ipcMain.handle('reinstallWhisper', async (event) => {
    try {
      await reinstallWhisper();
      return true;
    } catch (error) {
      console.error('删除 whisper.cpp 目录失败:', error);
      event.sender.send('message', `删除 whisper.cpp 目录失败: ${error.message}`);
      return false;
    }
  });

}
