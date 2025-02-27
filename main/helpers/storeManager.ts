import { ipcMain } from 'electron';
import Store from 'electron-store';
import { defaultUserConfig, isAppleSilicon } from './utils';
import { BrowserWindow } from 'electron';
import { Provider, PROVIDER_TYPES } from '../../types';

type LogEntry = {
  timestamp: number;
  message: string;
  type?: 'info' | 'error' | 'warning';
};

type StoreType = {
  translationProviders: Provider[],
  userConfig: Record<string, any>,
  settings: {
    whisperCommand: string;
    language: string;
    useLocalWhisper: boolean;
    builtinWhisperCommand: string;
  },
  logs: LogEntry[],
  [key: string]: any
}


const defaultWhisperCommand = isAppleSilicon()
  ? 'whisper "${audioFile}" --model ${whisperModel} --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}'
  : 'whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}';


export const store = new Store<StoreType>({
  defaults: {
    userConfig: defaultUserConfig,
    translationProviders: [], // 不再需要默认值
    settings: {
      language: 'zh',
      useLocalWhisper: false,
      whisperCommand: defaultWhisperCommand,
      builtinWhisperCommand: '"${mainPath}" -m "${modelPath}" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}',

    },
    logs: []
  }
});

// 将获取服务商的逻辑抽取为独立函数
async function getAndInitializeProviders(): Promise<Provider[]> {
  try {
    // 获取用户保存的服务商配置
    const savedProviders: Provider[] = store.get('translationProviders') || [];
    
    // 获取所有内置服务商的ID
    const builtinProviderIds = PROVIDER_TYPES
      .filter(type => type.isBuiltin)
      .map(type => type.id);
    
    // 找出已保存的内置服务商ID
    const savedBuiltinIds = savedProviders
      .filter(p => builtinProviderIds.includes(p.type))
      .map(p => p.type);
    
    // 找出缺失的内置服务商
    const missingBuiltinProviders = PROVIDER_TYPES
      .filter(type => 
        type.isBuiltin && 
        !savedBuiltinIds.includes(type.id)
      )
      .map(type => {
        const provider: Provider = {
          type: type.id,
          id: type.id,
          name: type.name,
          isAi: type.isAi,
          ...Object.fromEntries(
            type.fields
              .filter(field => field.defaultValue !== undefined)
              .map(field => [field.key, field.defaultValue])
          )
        };
        return provider;
      });

    // 合并和排序服务商
    const customProviders = savedProviders.filter(p => p.type === 'openai');
    const builtinProviders = [
      ...savedProviders.filter(p => builtinProviderIds.includes(p.type)),
      ...missingBuiltinProviders
    ];

    const sortedBuiltinProviders = builtinProviders.sort((a, b) => {
      const aIndex = builtinProviderIds.indexOf(a.type);
      const bIndex = builtinProviderIds.indexOf(b.type);
      return aIndex - bIndex;
    });

    const allProviders = [...sortedBuiltinProviders, ...customProviders];
    
    // 更新存储
    store.set('translationProviders', allProviders);
    
    return allProviders;
  } catch (error) {
    logMessage(`Error initializing providers: ${error.message}`, 'error');
    return [];
  }
}

export function setupStoreHandlers() {
  // 启动时初始化服务商配置
  getAndInitializeProviders().then(() => {
    logMessage('Translation providers initialized', 'info');
  });

  // 更新现有的 IPC 处理函数
  ipcMain.on('setTranslationProviders', async (event, providers) => {
    store.set('translationProviders', providers);
  });

  ipcMain.handle('getTranslationProviders', async () => {
    return getAndInitializeProviders();
  });

  ipcMain.on('setUserConfig', async (event, config) => {
    store.set('userConfig', config);
  });

  ipcMain.handle('getUserConfig', async () => {
    const storedConfig = store.get('userConfig');
    // 合并默认配置和存储的配置
    const mergedConfig = { ...defaultUserConfig, ...storedConfig };
    return mergedConfig;
  });

  ipcMain.handle('setSettings', async (event, settings) => {
    const preSettings = store.get('settings');
    store.set('settings', { ...preSettings, ...settings });
  });

  ipcMain.handle('getSettings', async () => {
    return store.get('settings');
  });

  ipcMain.handle('clearConfig', async () => {
    store.clear();
    return true;
  });

  ipcMain.handle('addLog', async (event, logEntry: Omit<LogEntry, 'timestamp'>) => {
    const logs = store.get('logs');
    const newLog = {
      ...logEntry,
      timestamp: Date.now()
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
}

export function logMessage(message: string | Error, type: 'info' | 'error' | 'warning' = 'info') {
  const logs = store.get('logs');
  const messageStr = message instanceof Error ? message.message : String(message);
  
  const newLog = {
    message: messageStr,
    type,
    timestamp: Date.now()
  };
  store.set('logs', [...logs, newLog]);
  
  // 确保所有窗口都能收到新日志
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('newLog', newLog);
  });
}

logMessage('app start', 'info');
// store.set('logs', []);