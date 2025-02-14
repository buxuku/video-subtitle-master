import { ipcMain } from 'electron';
import Store from 'electron-store';
import { defaultUserConfig, isAppleSilicon } from './utils';

type StoreType = {
  translationProviders: Record<string, any>[],
  userConfig: Record<string, any>,
  settings: {
    whisperCommand: string;
    language: string;
    useLocalWhisper: boolean;
    builtinWhisperCommand: string;
    useBatchTranslation: boolean;
    aiPrompt: string;
    batchTranslationSize: number;
  },
  [key: string]: any
}

const DEFAULT_AI_PROMPT = `**Characterization**
You are a professional subtitle translator who specializes in line-by-line cross-referencing and preserving the original formatting.

**Task description**
I will provide you with subtitle content (wrapped in <source></source> tags) in srt subtitle format, which you will need to:
1. maintain strict line-by-line correspondence between the original and the translated text (timeline, line numbers, line breaks, list symbols are identical)
2. output only the result of the translation, no summarization, annotation or formatting is allowed
3. adopt a colloquial language style that is in line with the target language.

**Format specification***
- Preserve the structure of the original subtitle content (including timeline, line breaks, indentation levels, blank lines)
- Each line of translation must correspond exactly to the line number of the original.
- Special formatting (e.g., timecode, proper nouns) is retained as is.
- Whenever you encounter untranslatable content, leave it as it is.
- Multiple lines are not allowed to be combined; each line of the output must correspond to a separate line.
- The language of the original subtitle content is \${sourceLanguage}

**The original subtitle content is in the language \${targetLanguage}
Only the translated subtitle file content should be returned, do not include:
1. any additional explanatory or summarizing text
2. additional blank lines or formatting
3. unsolicited style changes
4. target translation language is \${targetLanguage}
5. the returned subtitle content is wrapped in <result></result> tags

<source>
\${content}
</source>`;

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

const defaultWhisperCommand = isAppleSilicon()
  ? 'whisper "${audioFile}" --model ${whisperModel} --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}'
  : 'whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}';

export const store = new Store<StoreType>({
  defaults: {
    userConfig: defaultUserConfig,
    translationProviders: defaultTranslationProviders,
    settings: {
      language: 'zh',
      useLocalWhisper: false,
      whisperCommand: defaultWhisperCommand,
      builtinWhisperCommand: '"${mainPath}" -m "${modelPath}" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}',
      useBatchTranslation: false,
      aiPrompt: DEFAULT_AI_PROMPT,
      batchTranslationSize: 10
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
}
