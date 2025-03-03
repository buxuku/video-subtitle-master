import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { store } from './store';
import { defaultUserConfig } from './utils';
import { getAndInitializeProviders } from './providerManager';
import { logMessage } from './logger';
import { LogEntry } from './store/types';

import { promisify } from 'util';

console.log(app.getVersion(), 'version');
export function setupStoreHandlers() {
  // 启动时初始化服务商配置
  getAndInitializeProviders().then(async () => {
    const appPath = app.getAppPath();
    console.log('appPath', appPath);
    const appaddon = path.join(appPath, 'main/addons/addon.node');
    console.log('文件存在:', fs.existsSync(appaddon));
    const { whisper } = await require('../addons/addon.node');
    const whisperParams = {
      language: 'en',
      model:
        '/Users/wukong/Library/Application Support/video-subtitle-master/whisper.cpp/models/ggml-tiny.bin',
      fname_inp:
        '/Users/wukong/Documents/code/VideoSubtitleGenerator/examples/demo1.wav',
      use_gpu: false,
      flash_attn: false,
      no_prints: true,
      comma_in_time: false,
      translate: true,
      no_timestamps: false,
      audio_ctx: 0,
      max_len: 0,
    };
    const whisperAsync = promisify(whisper);
    whisperAsync(whisperParams).then((res) => {
      console.log(res);
    });
    console.log(whisper, 'dd');
    logMessage('Translation providers initialized', 'info');
  });

  // Provider 相关处理
  ipcMain.on('setTranslationProviders', async (event, providers) => {
    store.set('translationProviders', providers);
  });

  ipcMain.handle('getTranslationProviders', async () => {
    return getAndInitializeProviders();
  });

  // 用户配置相关处理
  ipcMain.on('setUserConfig', async (event, config) => {
    store.set('userConfig', config);
  });

  ipcMain.handle('getUserConfig', async () => {
    const storedConfig = store.get('userConfig');
    return { ...defaultUserConfig, ...storedConfig };
  });

  // 设置相关处理
  ipcMain.handle('setSettings', async (event, settings) => {
    const preSettings = store.get('settings');
    store.set('settings', { ...preSettings, ...settings });
  });

  ipcMain.handle('getSettings', async () => {
    return store.get('settings');
  });

  // 日志相关处理
  ipcMain.handle(
    'addLog',
    async (event, logEntry: Omit<LogEntry, 'timestamp'>) => {
      const logs = store.get('logs');
      const newLog = {
        ...logEntry,
        timestamp: Date.now(),
      };
      store.set('logs', [...logs, newLog]);
      event.sender.send('newLog', newLog);
    }
  );

  ipcMain.handle('getLogs', async () => {
    return store.get('logs');
  });

  ipcMain.handle('clearLogs', async () => {
    store.set('logs', []);
    return true;
  });

  // 清理配置
  ipcMain.handle('clearConfig', async () => {
    store.clear();
    return true;
  });
}
