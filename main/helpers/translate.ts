import path from 'path';
import fs from 'fs';
import { getSrtFileName, renderTemplate } from './utils';
import volcTranslator from '../service/volc';
import baiduTranslator from '../service/baidu';
import deeplxTranslator from '../service/deeplx';
import ollamaTranslator from '../service/ollama';
import openaiTranslator from '../service/openai';
import azureTranslator from '../service/azure';
import { logMessage, store } from './storeManager';

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

export default async function translate(
  event,
  folder,
  fileName,
  absolutePath,
  formData,
  provider
) {
  const {
    translateContent,
    targetSrtSaveOption,
    customTargetSrtFileName,
    sourceLanguage,
    targetLanguage,
  } = formData || {};

  const renderContentTemplate = contentTemplate[translateContent];
  const proof = provider;

  return new Promise(async (resolve, reject) => {
    try {
      const result = fs.readFileSync(absolutePath, 'utf8');
      const data = result.split('\n');
      const items = [];
      const templateData = { fileName, sourceLanguage, targetLanguage };
      const targetSrtFileName = getSrtFileName(
        targetSrtSaveOption,
        fileName,
        targetLanguage,
        customTargetSrtFileName,
        templateData
      );
      let translator;

      // 根据提供商类型选择翻译器
      switch (proof.type) {
        case 'api':
          switch (proof.id) {
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
            default:
              throw new Error(`未知的API翻译提供商: ${proof.id}`);
          }
          break;
        case 'local':
          translator = (text) => ollamaTranslator(text, proof);
          break;
        case 'openai':
          translator = (text) => openaiTranslator(text, proof);
          break;
        default:
          throw new Error(`未知的翻译提供商类型: ${proof.type}`);
      }
      logMessage(`translate start, use ${proof.type} : ${proof.id}`, 'info');
      // 直接从 store 获取设置
      const settings = store.get('settings');
      const useBatchTranslation = settings?.useBatchTranslation;
      logMessage(`useBatchTranslation: ${useBatchTranslation}`, 'info');
      if (useBatchTranslation && (proof.type === 'openai' || proof.type === 'local')) {
        // 使用通用解析方法
        const allSubtitles = parseSubtitles(data);

        // 从设置中获取批量大小
        const batchSize = settings?.batchTranslationSize || 10;
        const batches = [];
        for (let i = 0; i < allSubtitles.length; i += batchSize) {
          batches.push(allSubtitles.slice(i, i + batchSize));
        }

        // 创建文件
        const fileSave = path.join(folder, `${targetSrtFileName}.srt`);
        // 确保文件是空的
        fs.writeFileSync(fileSave, '');

        // 逐批翻译
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          let result = '';
          batch.forEach(item => {
            const content = item.content.join('\n');
            result += `${item.id}\n${item.startEndTime}\n${content}\n\n`;
          });

          const fullPrompt = renderTemplate(settings?.aiPrompt, {
            content: result,
            sourceLanguage,
            targetLanguage,
          });

          // 执行批量翻译
          let translatedContent;
          try {
            logMessage(`translate start, batch ${i + 1}`, 'info'); 
            logMessage(`fullPrompt: ${fullPrompt}`, 'info');
            translatedContent = await translator(fullPrompt, proof);
            translatedContent = translatedContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            logMessage(`translate done, batch ${i + 1}`, 'info');
            logMessage(`translatedContent: ${translatedContent}`, 'info');
          } catch (translationError) {
            logMessage(`translate error, batch ${i + 1}: ${translationError.message || translationError}`, 'error');
            throw new Error(`批次 ${i + 1} 翻译失败: ${translationError.message || translationError}`);
          }

          // 提取 <result> 标签中的内容
          const pattern = /result[>\]\)]([\s\S]*?)[\[<\(]\/result/;
          const sourceMatch = translatedContent.match(pattern);
          if (!sourceMatch) {
            // 直接追加写入这一批的翻译结果
            logMessage(`appendFileSync: ${translatedContent}`, 'info');
            fs.appendFileSync(fileSave, translatedContent + '\n\n');
          } else {
            // 直接追加写入这一批的翻译结果
            logMessage(`appendFileSync: ${sourceMatch[1].trim()}`, 'info');
            fs.appendFileSync(fileSave, sourceMatch[1].trim() + '\n\n');
          }
        }

        resolve(true);
        return;
      } else {
        // 使用相同的解析方法处理翻译
        const subtitles = parseSubtitles(data);
        
        // 从设置中获取批量大小
        const batchSize = settings?.apiTranslationBatchSize || 1;
        
        // 根据提供商决定是否使用批量翻译
        const useApiBatch = ['volc', 'baidu', 'azure'].includes(proof.id) && batchSize > 1;
        logMessage(`useApiBatch: ${useApiBatch}, batchSize: ${batchSize}`, 'info');
        if (useApiBatch) {
          // 批量处理翻译
          for (let i = 0; i < subtitles.length; i += batchSize) {
            const batch = subtitles.slice(i, Math.min(i + batchSize, subtitles.length));
            const sourceContents = batch.map(subtitle => subtitle.content.join('\n'));
            
            try {
              logMessage(`translate start, batch ${i + 1}`, 'info');
              logMessage(`sourceContents: ${sourceContents}`, 'info');
              const translatedContents = await translator(
                sourceContents,
                proof,
                sourceLanguage,
                targetLanguage
              );
              logMessage(`translate done, batch ${i + 1}`, 'info');
              logMessage(`translatedContents: ${translatedContents}`, 'info');
              batch.forEach((subtitle, index) => {
                items.push({
                  id: subtitle.id,
                  startEndTime: subtitle.startEndTime,
                  targetContent: translatedContents[index],
                  sourceContent: sourceContents[index],
                });
              });
            } catch (translationError) {
              logMessage(`translate error, batch ${i + 1}: ${translationError.message || translationError}`, 'error');
              throw new Error(`批次 ${i + 1} 翻译失败: ${translationError.message || translationError}`);
            }
          }
        } else {
          // 原有的逐条翻译逻辑
          for (const subtitle of subtitles) {
            logMessage(`translate start, subtitle ${subtitle.id}`, 'info');
            let sourceContent = subtitle.content.join('\n');
            if (!sourceContent) continue;

            if (proof.prompt) {
              sourceContent = renderTemplate(proof.prompt, {
                sourceLanguage,
                targetLanguage,
                content: sourceContent,
              });
            }

            let targetContent;
            try {
              logMessage(`sourceContent: ${sourceContent}`, 'info');
              targetContent = await translator(
                sourceContent,
                proof,
                sourceLanguage,
                targetLanguage
              );
              logMessage(`translate done, subtitle ${subtitle.id}`, 'info');
              logMessage(`targetContent: ${targetContent}`, 'info');
              items.push({
                id: subtitle.id,
                startEndTime: subtitle.startEndTime,
                targetContent,
                sourceContent,
              });
            } catch (translationError) {
              logMessage(`translate error, subtitle ${subtitle.id}: ${translationError.message || translationError}`, 'error');
              throw new Error(`subtitle ${subtitle.id} 翻译失败: ${translationError.message || translationError}`);
            }
          }
        }
      }

      const fileSave = path.join(folder, `${targetSrtFileName}.srt`);

      // 写入翻译结果
      for (let i = 0; i <= items.length - 1; i++) {
        const item = items[i];
        const content = `${item.id}\n${item.startEndTime}\n${renderTemplate(
          renderContentTemplate,
          item
        )}`;
        logMessage(`write ${fileSave} content: ${content}`, 'info');
        fs.appendFileSync(fileSave, content);
      }
      resolve(true);
    } catch (error) {
      logMessage(`translate error: ${error.message || error}`, 'error');
      event.sender.send('message', error);
      reject(error);
    }
  });
}
