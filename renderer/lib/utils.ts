import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const models = [
  {
    name: "Tiny",
    desc: "输出文字速度快，转写文字质量一般。 (77.7 MB)",
  },
  {
    name: "Base",
    desc: "输出文字速度快，转写文字质量一般。 (148 MB)",
  },
  {
    name: "Small",
    desc: "输出文字速度适中，转写文字质量较好。 (488 MB)",
  },
  {
    name: "Medium",
    desc: "输出文字速度慢，转写文字质量最佳。 (1.53 GB)",
  },
  {
    name: "Large-v1",
    desc: "输出文字速度慢，转写文字质量最佳。 (3.09 GB)",
  },
  {
    name: "Large-v2",
    desc: "输出文字速度慢，转写文字质量最佳。 (3.09 GB)",
  },
  {
    name: "Large-v3",
    desc: "输出文字速度慢，转写文字质量最佳。 (3.09 GB)",
  },
  {
    name: "Tiny.en",
    desc: "仅支持英文，输出文字速度快，转写文字质量一般。 (77.7 MB)",
  },
  {
    name: "Base.en",
    desc: "仅支持英文，输出文字速度快，转写文字质量一般。 (148 MB)",
  },
  {
    name: "Small.en",
    desc: "仅支持英文，输出文字速度适中，转写文字质量较好。 (488 MB)",
  },
  {
    name: "Medium.en",
    desc: "仅支持英文，输出文字速度慢，转写文字质量最佳。 (1.53 GB)",
  },
];

export const supportedLanguage = [
  { name: "中文", value: "zh" },
  { name: "英语", value: "en" },
  { name: "粤语", value: "yue" },
  { name: "文言文", value: "wyw" },
  { name: "日语", value: "jp" },
  { name: "韩语", value: "kor" },
  { name: "法语", value: "fra" },
  { name: "西班牙语", value: "spa" },
  { name: "泰语", value: "th" },
  { name: "阿拉伯语", value: "ara" },
  { name: "俄语", value: "ru" },
  { name: "葡萄牙语", value: "pt" },
  { name: "德语", value: "de" },
  { name: "意大利语", value: "it" },
  { name: "希腊语", value: "el" },
  { name: "荷兰语", value: "nl" },
  { name: "波兰语", value: "pl" },
  { name: "保加利亚语", value: "bul" },
  { name: "爱沙尼亚语", value: "est" },
  { name: "丹麦语", value: "dan" },
  { name: "芬兰语", value: "fin" },
  { name: "捷克语", value: "cs" },
  { name: "罗马尼亚语", value: "rom" },
  { name: "斯洛文尼亚语", value: "slo" },
  { name: "瑞典语", value: "swe" },
  { name: "匈牙利语", value: "hu" },
  { name: "繁体中文", value: "cht" },
  { name: "越南语", value: "vie" },
];

export const defaultUserConfig = {
    sourceLanguage: 'en',
    targetLanguage: 'zh',
    targetSrtSaveFileName: '${fileName}.${targetLanguage}',
    sourceSrtSaveFileName: '${fileName}.${sourceLanguage}',
    model: 'tiny',
    apiKey: '',
    apiSecret: '',
    translateProvider: 'baidu',
    saveSourceSrt: false,
    translateContent: 'onlyTranslate',
    baidu: {
        apiKey: '',
        apiSecret: '',
    },
    volc: {
        apiKey: '',
        apiSecret: '',
    }
}

export const openUrl = (url) => {
    window?.ipc?.send('openUrl', url)
}

export const gitCloneSteps = {
    'Compressing objects': '打包文件',
    'Receiving objects': '下载文件',
    'Resolving deltas': '解压文件',
    'Updating workdir': '更新文件',
}
