import { ipcMain } from 'electron';
import Store from 'electron-store';
import { defaultUserConfig } from './utils';

type StoreType = {
  translationProviders: Record<string, any>[],
  userConfig: Record<string, any>,
  settings: {
    whisperCommand: any;
    language: string;
    useLocalWhisper: boolean;
    builtinWhisperCommand: string;
  },
  [key: string]: any
}

const defaultPrompt = 'Please translate the following content from ${sourceLanguage} to ${targetLanguage}, only return the translation result can be. \n ${content}';

const defaultTranslationProviders = [
  { id: 'baidu', name: '百度', type: 'api', apiKey: '', apiSecret: '' },
  { id: 'volc', name: '火山', type: 'api', apiKey: '', apiSecret: '' },
  { id: 'deeplx', name: 'DeepLX', type: 'api', apiKey: '', apiSecret: '' },
  { 
    id: 'ollama', 
    name: 'Ollama', 
    type: 'local', 
    apiUrl: 'http://localhost:11434',
    modelName: 'llama2',
    prompt: defaultPrompt
  },
  {
    id: 'deepseek',
    name: 'deepseek',
    type: 'openai',
    apiUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat',
    prompt: defaultPrompt
  },
];

export const store = new Store<StoreType>({
  defaults: {
    userConfig: defaultUserConfig,
    translationProviders: defaultTranslationProviders,
    settings: {
      language: 'zh',
      useLocalWhisper: false,
      whisperCommand: '',
      builtinWhisperCommand: '"${mainPath}" -m "${modelPath}" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}',
    }
  }
});

export function setupStoreHandlers() {
  ipcMain.on('setTranslationProviders', async (event, providers) => {
    store.set('translationProviders', providers);
  });

  ipcMain.handle('getTranslationProviders', async () => {
    let storedProviders = store.get('translationProviders');
    
    // 合并存储的提供商和默认提供商
    const mergedProviders = defaultTranslationProviders.map(defaultProvider => {
      const storedProvider = storedProviders.find(p => p.id === defaultProvider.id);
      if (storedProvider) {
        // 如果存储的提供商存在，合并默认值和存储的值
        return { ...defaultProvider, ...storedProvider };
      }
      // 如果存储中不存在该提供商，使用默认值
      return defaultProvider;
    });

    // 添加用户自定义的提供商（如OpenAI风格的API）
    const customProviders = storedProviders.filter(provider => 
      !defaultTranslationProviders.some(defaultProvider => defaultProvider.id === provider.id)
    );

    const allProviders = [...mergedProviders, ...customProviders];

    // 更新存储
    store.set('translationProviders', allProviders);
    
    return allProviders;
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
    store.set('settings', settings);
  });

  ipcMain.handle('getSettings', async () => {
    return store.get('settings');
  });

  ipcMain.handle('clearConfig', async () => {
    store.clear();
    return true;
  });
}
