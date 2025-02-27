import path from 'path';
import fs from 'fs';
import { getSrtFileName, renderTemplate } from './utils';
import volcTranslator from '../service/volc';
import baiduTranslator from '../service/baidu';
import deeplxTranslator from '../service/deeplx';
import ollamaTranslator from '../service/ollama';
import openaiTranslator from '../service/openai';
import azureTranslator from '../service/azure';
import azureOpenaiTranslator from '../service/azureOpenai';
import { logMessage } from './storeManager';
import { Provider } from '../../types';

const contentTemplate = {
  onlyTranslate: '${targetContent}\n\n',
  sourceAndTranslate: '${sourceContent}\n${targetContent}\n\n',
  translateAndSource: '${targetContent}\n${sourceContent}\n\n',
};

// 添加字幕解析函数
function parseSubtitles(data: string[]) {
  const subtitles = [];
  let currentSubtitle = null;
  
  for (let i = 0; i < data.length; i++) {
    const line = data[i]?.trim();
    if (!line) continue;
    
    if (/^\d+$/.test(line)) {
      if (currentSubtitle) {
        subtitles.push(currentSubtitle);
      }
      currentSubtitle = {
        id: line,
        startEndTime: '',
        content: []
      };
    } 
    else if (line.includes('-->')) {
      if (currentSubtitle) {
        currentSubtitle.startEndTime = line;
      }
    }
    else if (currentSubtitle) {
      currentSubtitle.content.push(line);
    }
  }
  
  if (currentSubtitle) {
    subtitles.push(currentSubtitle);
  }
  
  return subtitles;
}

// 定义翻译结果的接口
interface TranslationResult {
  id: string;
  startEndTime: string;
  sourceContent: string;
  targetContent: string;
}

// 定义字幕结构的接口
interface Subtitle {
  id: string;
  startEndTime: string;
  content: string[];
}

// 翻译服务的基础配置接口
interface TranslationConfig {
  sourceLanguage: string;
  targetLanguage: string;
  provider: Provider;
  translator: (text: string[], config: any, from: string, to: string) => Promise<string>;
}

/**
 * API 服务批量翻译处理
 */
async function handleAPIBatchTranslation(
  subtitles: Subtitle[],
  config: TranslationConfig,
  batchSize: number
): Promise<TranslationResult[]> {
  const { provider, sourceLanguage, targetLanguage, translator } = config;
  const results: TranslationResult[] = [];
  
  // 分批处理
  for (let i = 0; i < subtitles.length; i += batchSize) {
    const batch = subtitles.slice(i, i + batchSize);
    const batchContents = batch.map(s => s.content.join('\n'));

    try {
      // 调用 API 翻译服务
      const translatedContent = await translator(
        batchContents,
        provider,
        sourceLanguage,
        targetLanguage
      );

      // 处理翻译结果
      const translatedLines = Array.isArray(translatedContent) 
        ? translatedContent 
        : translatedContent.split('\n');

      if (translatedLines.length !== batch.length) {
        throw new Error('Translation result count does not match source count');
      }

      // 组装结果
      const batchResults = batch.map((subtitle, index) => ({
        id: subtitle.id,
        startEndTime: subtitle.startEndTime,
        sourceContent: subtitle.content.join('\n'),
        targetContent: translatedLines[index]
      }));

      results.push(...batchResults);
    } catch (error) {
      logMessage(`Batch translation error: ${error.message}`, 'error');
      throw error;
    }
  }

  return results;
}

/**
 * AI 服务单条翻译处理
 */
async function handleAISingleTranslation(
  subtitle: Subtitle,
  config: TranslationConfig
): Promise<TranslationResult> {
  const { provider, sourceLanguage, targetLanguage, translator } = config;
  const sourceContent = subtitle.content.join('\n');

  try {
    // 使用 prompt 格式化内容
    const translationContent = provider.prompt 
      ? renderTemplate(provider.prompt, {
          sourceLanguage,
          targetLanguage,
          content: sourceContent,
        })
      : sourceContent;

    const translationConfig = {
      ...provider,
      systemPrompt: provider.systemPrompt
    };

    // 调用 AI 翻译服务
    let targetContent = await translator(
      translationContent,
      translationConfig,
      sourceLanguage,
      targetLanguage
    );
    targetContent = targetContent.replace(/<think>[\s\S]*?<\/think>\n/g, '').trim();

    return {
      id: subtitle.id,
      startEndTime: subtitle.startEndTime,
      sourceContent,
      targetContent: targetContent.trim()
    };
  } catch (error) {
    logMessage(`Single translation error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * AI 服务批量翻译处理
 */
async function handleAIBatchTranslation(
  subtitles: Subtitle[],
  config: TranslationConfig,
  batchSize: number
): Promise<string[]> {
  const { provider, sourceLanguage, targetLanguage, translator } = config;
  const results: string[] = [];

  // 分批处理
  for (let i = 0; i < subtitles.length; i += batchSize) {
    const batch = subtitles.slice(i, i + batchSize);

    try {
      // 准备完整字幕内容
      const fullContent = batch.map(s => 
        `${s.id}\n${s.startEndTime}\n${s.content.join('\n')}`
      ).join('\n\n');

      // 使用批量翻译 prompt
      const translationContent = renderTemplate(provider.batchPrompt, {
        sourceLanguage,
        targetLanguage,
        content: fullContent,
      });

      const translationConfig = {
        ...provider,
        systemPrompt: provider.systemPrompt
      };

      // 调用 AI 翻译服务
      logMessage(`ai translate num: ${i}`, 'info');
      const responseOrigin = await translator(
        translationContent,
        translationConfig,
        sourceLanguage,
        targetLanguage
      );
      const response = responseOrigin.replace(/<think>[\s\S]*?<\/think>\n/g, '').trim();
      // 提取 <result> 标签中的内容
      const pattern = /<result[^>]*>([\s\S]*?)<\/result>/;
      const match = response.match(pattern);
      logMessage(`ai response: ${responseOrigin}`, 'info');
      results.push(match[1].trim() || response);
    } catch (error) {
      logMessage(`AI batch translation error: ${error.message}`, 'error');
      throw error;
    }
  }

  return results;
}

/**
 * 统一的翻译处理函数
 */
export async function translateWithProvider(
  provider: Provider,
  subtitles: Subtitle[],
  sourceLanguage: string,
  targetLanguage: string,
  translator: (text: string[], config: any, from: string, to: string) => Promise<string>
): Promise<TranslationResult[] | string[]> {
  const config: TranslationConfig = {
    provider,
    sourceLanguage,
    targetLanguage,
    translator
  };
  logMessage(`translateWithProvider start, use \n ${JSON.stringify(provider, null, 2)}`, 'info');
  if (provider.isAi) {
    // AI 翻译服务
    if (provider.useBatchTranslation) {
      // 批量翻译
      return handleAIBatchTranslation(
        subtitles,
        config,
        provider.batchTranslationSize || 10
      );
    } else {
      // 逐条翻译
      const results: TranslationResult[] = [];
      for (const subtitle of subtitles) {
        const result = await handleAISingleTranslation(subtitle, config);
        results.push(result);
      }
      return results;
    }
  } else {
    // API 翻译服务
    return handleAPIBatchTranslation(
      subtitles,
      config,
      provider.batchSize || 1
    );
  }
}

// 更新主翻译函数
export default async function translate(
  event,
  folder,
  fileName,
  absolutePath,
  formData,
  provider: Provider
) {
  const {
    translateContent,
    targetSrtSaveOption,
    customTargetSrtFileName,
    sourceLanguage,
    targetLanguage,
  } = formData || {};

  const renderContentTemplate = contentTemplate[translateContent];

  return new Promise(async (resolve, reject) => {
    try {
      const result = fs.readFileSync(absolutePath, 'utf8');
      const data = result.split('\n');
      // 获取对应的翻译器
      let translator;
      switch (provider.type) {
        case 'volc':
          translator = volcTranslator;
          break;
        case 'baidu':
          translator = baiduTranslator;
          break;
        case 'deeplx':
          translator = deeplxTranslator;
          break;
        case 'azure':
          translator = azureTranslator;
          break;
        case 'ollama':
          translator = ollamaTranslator;
          break;
        case 'azureopenai':
          translator = azureOpenaiTranslator;
          break;
        case 'openai':
        case 'deepseek':
          translator = openaiTranslator;
          break;
        default:
          throw new Error(`未知的翻译提供商: ${provider.type}`);
      }

      logMessage(`translate start, use ${provider.type}`, 'info');

      // 解析字幕
      const subtitles = parseSubtitles(data);

      // 获取文件名
      const templateData = { fileName, sourceLanguage, targetLanguage };
      const targetSrtFileName = getSrtFileName(
        targetSrtSaveOption,
        fileName,
        targetLanguage,
        customTargetSrtFileName,
        templateData
      );

      // 创建输出文件
      const fileSave = path.join(folder, `${targetSrtFileName}.srt`);
      fs.writeFileSync(fileSave, ''); // 清空或创建文件

      // 使用重构后的翻译函数进行翻译
      const results = await translateWithProvider(
        provider,
        subtitles,
        sourceLanguage,
        targetLanguage,
        translator
      );
      if(provider.isAi && provider.useBatchTranslation) {
        fs.appendFileSync(fileSave, results.join('\n'));
        resolve(true);
        return;
      }

      // 写入翻译结果
      for (const result of results as TranslationResult[]) {
        const content = `${result.id}\n${result.startEndTime}\n${renderTemplate(
          renderContentTemplate,
          {
            sourceContent: result.sourceContent,
            targetContent: result.targetContent
          }
        )}`;
        fs.appendFileSync(fileSave, content);
      }

      logMessage('translate complete', 'info');
      resolve(true);
    } catch (error) {
      // logMessage(`Translation error: ${error.message}`, 'error');
      event.sender.send('message', error.message || error);
      reject(error);
    }
  });
}
