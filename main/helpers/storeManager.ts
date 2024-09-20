import { ipcMain } from 'electron';
import Store from 'electron-store';
import { defaultUserConfig } from './utils';

type StoreType = {
  translationProviders: Record<string, any>[],
  userConfig: Record<string, any>,
  [key: string]: any
}

const defaultTranslationProviders = [
  { id: 'baidu', name: '百度', apiKey: '', apiSecret: '' },
  { id: 'volc', name: '火山', apiKey: '', apiSecret: '' },
  { id: 'deeplx', name: 'DeepLX', apiKey: '', apiSecret: '' },
];

export const store = new Store<StoreType>({
  defaults: {
    userConfig: defaultUserConfig,
    translationProviders: defaultTranslationProviders
  }
});

export function setupStoreHandlers() {
  ipcMain.on('setTranslationProviders', async (event, providers) => {
    store.set('translationProviders', providers);
  });

  ipcMain.handle('getTranslationProviders', async () => {
    let providers = store.get('translationProviders');
    if (!providers || providers.length === 0) {
      providers = defaultTranslationProviders;
      store.set('translationProviders', providers);
    }
    console.log(providers, 'translationProviders');
    return providers;
  });

  ipcMain.on('setUserConfig', async (event, config) => {
    store.set('userConfig', config);
  });

  ipcMain.handle('getUserConfig', async () => {
    return store.get('userConfig');
  });
}