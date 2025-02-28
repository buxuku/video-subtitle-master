export type ProviderField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'url' | 'number' | 'switch';
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
  tips?: string;
  depends?: string;
};

export type ProviderType = {
  id: string;
  name: string;
  fields: ProviderField[];
  isBuiltin?: boolean;
  icon?: string;
  isAi?: boolean;
};

export type Provider = {
  id: string;
  name: string;
  type: string;
  isAi: boolean;
  [key: string]: any;
};

export const defaultUserPrompt =
  'Please translate the following content from ${sourceLanguage} to ${targetLanguage}, only return the translation result can be. \n ${content}';
export const defaultSystemPrompt = 'You are a helpful assistant.';

export const defaultBatchPrompt = `**Characterization**
You are a professional subtitle translator who specializes in batch translation while maintaining context and consistency.

**Task description**
I will provide you with multiple subtitle lines (wrapped in <source></source> tags) in srt subtitle format, which you will need to:
1. translate each line while maintaining the context and consistency
2. output only the translations, separated by newlines
3. maintain the exact same number of lines as the input
4. adopt a colloquial language style that is in line with the target language

**Format specification**
- Each line of translation must correspond exactly to the input line
- Special formatting (e.g., proper nouns) should be retained as is
- Do not combine or split lines
- The language of the original subtitle content is \${sourceLanguage}
- Target translation language is \${targetLanguage}
- Return only the translations, separated by newlines
- The returned content should be wrapped in <result></result> tags

<source>
\${content}
</source>`;

export const PROVIDER_TYPES: ProviderType[] = [
  {
    id: 'baidu',
    name: 'baidu',
    isBuiltin: true,
    isAi: false,
    icon: '🔤',
    fields: [
      { key: 'apiKey', label: 'APP ID', type: 'password', required: true },
      {
        key: 'apiSecret',
        label: 'Secret Key',
        type: 'password',
        required: true,
      },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        required: true,
        defaultValue: 18,
        tips: 'batchSizeBaiduTips',
      },
    ],
  },
  {
    id: 'volc',
    name: 'volc',
    isBuiltin: true,
    isAi: false,
    icon: '🌋',
    fields: [
      {
        key: 'apiKey',
        label: 'Access Key ID',
        type: 'password',
        required: true,
      },
      {
        key: 'apiSecret',
        label: 'Secret Access Key',
        type: 'password',
        required: true,
      },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        required: true,
        defaultValue: 15,
        tips: 'batchSizeVolcTips',
      },
    ],
  },
  {
    id: 'deeplx',
    name: 'DeepLX',
    isBuiltin: true,
    isAi: false,
    icon: '🌐',
    fields: [
      {
        key: 'apiUrl',
        label: 'ApiUrl',
        type: 'url',
        required: true,
        defaultValue: 'http://localhost:1188/translate',
      },
    ],
  },
  {
    id: 'azure',
    name: 'azure',
    isBuiltin: true,
    isAi: false,
    icon: '☁️',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'Region', type: 'password', required: true },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        required: true,
        defaultValue: 20,
        tips: 'batchSizeAzureTips',
      },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    isBuiltin: true,
    isAi: true,
    icon: '🤖',
    fields: [
      {
        key: 'apiUrl',
        label: 'ApiUrl',
        type: 'url',
        required: true,
        placeholder: 'http://localhost:11434/api/generate',
        defaultValue: 'http://localhost:11434/api/generate',
      },
      {
        key: 'modelName',
        label: 'modelName',
        type: 'text',
        required: true,
        placeholder: 'llama2',
        defaultValue: 'llama2',
      },

      {
        key: 'prompt',
        label: 'prompt',
        type: 'textarea',
        defaultValue: defaultUserPrompt,
        tips: 'userPromptTips',
      },
      {
        key: 'useBatchTranslation',
        label: 'useBatchTranslation',
        type: 'switch',
        defaultValue: false,
      },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        defaultValue: 10,
        tips: 'batchSizeTip',
        depends: 'useBatchTranslation',
      },
      {
        key: 'batchPrompt',
        label: 'batchPrompt',
        type: 'textarea',
        defaultValue: defaultBatchPrompt,
        tips: 'batchPromptTips',
        depends: 'useBatchTranslation',
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    isBuiltin: true,
    isAi: true,
    icon: '🧠',
    fields: [
      {
        key: 'apiUrl',
        label: 'Base url',
        type: 'url',
        required: true,
        placeholder: 'https://api.deepseek.com/v1',
        defaultValue: 'https://api.deepseek.com/v1',
      },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      {
        key: 'modelName',
        label: 'modelName',
        type: 'text',
        required: true,
        placeholder: 'deepseek-chat',
        defaultValue: 'deepseek-chat',
      },
      {
        key: 'systemPrompt',
        label: 'systemPrompt',
        type: 'textarea',
        defaultValue: defaultSystemPrompt,
      },
      {
        key: 'prompt',
        label: 'prompt',
        type: 'textarea',
        defaultValue: defaultUserPrompt,
        tips: 'userPromptTips',
      },
      {
        key: 'useBatchTranslation',
        label: 'useBatchTranslation',
        type: 'switch',
        defaultValue: false,
      },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        defaultValue: 10,
        tips: 'batchSizeTip',
        depends: 'useBatchTranslation',
      },
      {
        key: 'batchPrompt',
        label: 'batchPrompt',
        type: 'textarea',
        defaultValue: defaultBatchPrompt,
        tips: 'batchPromptTips',
        depends: 'useBatchTranslation',
      },
    ],
  },
  {
    id: 'azureopenai',
    name: 'Azure OpenAI',
    isBuiltin: true,
    isAi: true,
    icon: '☁️',
    fields: [
      {
        key: 'apiUrl',
        label: 'ApiUrl',
        type: 'url',
        required: true,
        placeholder:
          'https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}',
      },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      {
        key: 'systemPrompt',
        label: 'systemPrompt',
        type: 'textarea',
        defaultValue: defaultSystemPrompt,
      },
      {
        key: 'prompt',
        label: 'prompt',
        type: 'textarea',
        defaultValue: defaultUserPrompt,
        tips: 'userPromptTips',
      },
      {
        key: 'useBatchTranslation',
        label: 'useBatchTranslation',
        type: 'switch',
        defaultValue: false,
      },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        defaultValue: 10,
        tips: 'batchSizeTip',
        depends: 'useBatchTranslation',
      },
      {
        key: 'batchPrompt',
        label: 'batchPrompt',
        type: 'textarea',
        defaultValue: defaultBatchPrompt,
        tips: 'batchPromptTips',
        depends: 'useBatchTranslation',
      },
    ],
  },
];

export const CONFIG_TEMPLATES: Record<string, ProviderType> = {
  openai: {
    id: 'openai_template',
    name: 'OpenAI API',
    isAi: true,
    fields: [
      { key: 'apiUrl', label: 'Base url', type: 'url', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'modelName', label: 'modelName', type: 'text', required: true },
      {
        key: 'systemPrompt',
        label: 'systemPrompt',
        type: 'textarea',
        defaultValue: defaultSystemPrompt,
      },
      {
        key: 'prompt',
        label: 'prompt',
        type: 'textarea',
        defaultValue: defaultUserPrompt,
        tips: 'userPromptTips',
      },
      {
        key: 'useBatchTranslation',
        label: 'useBatchTranslation',
        type: 'switch',
        defaultValue: false,
      },
      {
        key: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        defaultValue: 10,
        tips: 'batchSizeTip',
        depends: 'useBatchTranslation',
      },
      {
        key: 'batchPrompt',
        label: 'batchPrompt',
        type: 'textarea',
        defaultValue: defaultBatchPrompt,
        tips: 'batchPromptTips',
        depends: 'useBatchTranslation',
      },
    ],
  },
};
