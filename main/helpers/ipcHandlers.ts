import { ipcMain } from 'electron';
import { store } from './store';
import { defaultUserConfig } from './utils';
import { getAndInitializeProviders } from './providerManager';
import { logMessage } from './logger';
import { LogEntry } from './store/types';

export function setupStoreHandlers() {
  // 启动时初始化服务商配置
  getAndInitializeProviders().then(() => {
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
  ipcMain.handle('addLog', async (event, logEntry: Omit<LogEntry, 'timestamp'>) => {
    const logs = store.get('logs');
    const newLog = {
      ...logEntry,
      timestamp: Date.now(),
    };
    store.set('logs', [...logs, newLog]);
    event.sender.send('newLog', newLog);
  });

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