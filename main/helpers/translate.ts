import path from 'path';
import fs from 'fs';
import { getSrtFileName, renderTemplate } from './utils';
import volcTranslator from '../service/volc';
import baiduTranslator from '../service/baidu';
import deeplxTranslator from '../service/deeplx';
import ollamaTranslator from '../service/ollama';
import openaiTranslator from '../service/openai';
import { store } from './storeManager';

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

      // 直接从 store 获取设置
      const settings = store.get('settings');
      const useBatchTranslation = settings?.useBatchTranslation;

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
            translatedContent = await translator(fullPrompt, proof);
            translatedContent = translatedContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            console.log(fullPrompt, '\n\n', translatedContent, translatedContent);
          } catch (translationError) {
            throw new Error(`批次 ${i + 1} 翻译失败: ${translationError.message}`);
          }

          // 提取 <result> 标签中的内容
          const pattern = /result[>\]\)]([\s\S]*?)[\[<\(]\/result/;
          const sourceMatch = translatedContent.match(pattern);
          if (!sourceMatch) {
            // 直接追加写入这一批的翻译结果
            fs.appendFileSync(fileSave, translatedContent + '\n\n');
          } else {
            // 直接追加写入这一批的翻译结果
            fs.appendFileSync(fileSave, sourceMatch[1].trim() + '\n\n');
          }
        }

        resolve(true);
        return;
      } else {
        // 使用相同的解析方法处理逐行翻译
        const subtitles = parseSubtitles(data);

        // 逐条翻译
        for (const subtitle of subtitles) {
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
            targetContent = await translator(
              sourceContent,
              proof,
              sourceLanguage,
              targetLanguage
            );

            items.push({
              id: subtitle.id,
              startEndTime: subtitle.startEndTime,
              targetContent,
              sourceContent,
            });
          } catch (translationError) {
            throw new Error(`${translationError.message}`);
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
        fs.appendFileSync(fileSave, content);
      }
      resolve(true);
    } catch (error) {
      event.sender.send('message', error);
      reject(error);
    }
  });
}
