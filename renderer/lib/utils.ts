import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const models = [
  {
    name: 'Tiny',
    desc: {
      key: 'modelDesc.tiny',
      size: '77.7 MB'
    },
  },
  {
    name: 'Base',
    desc: {
      key: 'modelDesc.base',
      size: '148 MB'
    },
  },
  {
    name: 'Small',
    desc: {
      key: 'modelDesc.small',
      size: '488 MB'
    },
  },
  {
    name: 'Medium',
    desc: {
      key: 'modelDesc.medium',
      size: '1.53 GB'
    },
  },
  {
    name: 'Large-v1',
    desc: {
      key: 'modelDesc.large',
      size: '3.09 GB'
    },
  },
  {
    name: 'Large-v2',
    desc: {
      key: 'modelDesc.large',
      size: '3.09 GB'
    },
  },
  {
    name: 'Large-v3',
    desc: {
      key: 'modelDesc.large',
      size: '3.09 GB'
    },
  },
  {
    name: 'Large-v3-turbo',
    desc: {
      key: 'modelDesc.largeTurbo',
      size: '1.62 GB'
    }
  },
  {
    name: 'Tiny.en',
    desc: {
      key: 'modelDesc.tinyEn',
      size: '77.7 MB'
    },
  },
  {
    name: 'Base.en',
    desc: {
      key: 'modelDesc.baseEn',
      size: '148 MB'
    },
  },
  {
    name: 'Small.en',
    desc: {
      key: 'modelDesc.smallEn',
      size: '488 MB'
    },
  },
  {
    name: 'Medium.en',
    desc: {
      key: 'modelDesc.mediumEn',
      size: '1.53 GB'
    },
  },
];

export const supportedLanguage = [
  { name: '中文', value: 'zh' },
  { name: '英语', value: 'en' },
  { name: '粤语', value: 'yue' },
  { name: '文言文', value: 'wyw' },
  { name: '日语', value: 'jp' },
  { name: '韩语', value: 'kor' },
  { name: '法语', value: 'fra' },
  { name: '西班牙语', value: 'spa' },
  { name: '泰语', value: 'th' },
  { name: '阿拉伯语', value: 'ara' },
  { name: '俄语', value: 'ru' },
  { name: '葡萄牙语', value: 'pt' },
  { name: '德语', value: 'de' },
  { name: '意大利语', value: 'it' },
  { name: '希腊语', value: 'el' },
  { name: '荷兰语', value: 'nl' },
  { name: '波兰语', value: 'pl' },
  { name: '保加利亚语', value: 'bul' },
  { name: '爱沙尼亚语', value: 'est' },
  { name: '丹麦语', value: 'dan' },
  { name: '芬兰语', value: 'fin' },
  { name: '捷克语', value: 'cs' },
  { name: '罗马尼亚语', value: 'rom' },
  { name: '斯洛文尼亚语', value: 'slo' },
  { name: '瑞典语', value: 'swe' },
  { name: '匈牙利语', value: 'hu' },
  { name: '繁体中文', value: 'cht' },
  { name: '越南语', value: 'vie' },
];

export const openUrl = (url) => {
  window?.ipc?.send('openUrl', url);
};

export const gitCloneSteps = {
  'Compressing objects': '打包文件',
  'Receiving objects': '下载文件',
  'Resolving deltas': '解压文件',
  'Updating workdir': '更新文件',
};

export const isSubtitleFile = (filePath) => {
  return (
    filePath?.endsWith('.srt') ||
    filePath?.endsWith('.ass') ||
    filePath?.endsWith('.ssa') ||
    filePath?.endsWith('.vtt')
  );
};

export const getModelDownloadUrl = (modelName: string, source: 'hf-mirror' | 'huggingface') => {
  const domain = source === 'hf-mirror' ? 'hf-mirror.com' : 'huggingface.co';
  return `https://${domain}/ggerganov/whisper.cpp/resolve/main/ggml-${modelName.toLowerCase()}.bin?download=true`;
};
