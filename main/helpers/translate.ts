import path from 'path';
import fs from 'fs';
import { getSrtFileName, renderTemplate } from './utils';
import volcTranslator from '../service/volc';
import baiduTranslator from '../service/baidu';
import deeplxTranslator from '../service/deeplx';
import ollamaTranslator from '../service/ollama';
import openaiTranslator from '../service/openai';

const contentTemplate = {
  onlyTranslate: '${targetContent}\n\n',
  sourceAndTranslate: '${sourceContent}\n${targetContent}\n\n',
  translateAndSource: '${targetContent}\n${sourceContent}\n\n',
};

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
          translator = (text) => ollamaTranslator(text, proof, sourceLanguage, targetLanguage);
          break;
        case 'openai':
          translator = (text) => openaiTranslator(text, proof, sourceLanguage, targetLanguage);
          break;
        default:
          throw new Error(`未知的翻译提供商类型: ${proof.type}`);
      }

      for (var i = 0; i < data.length; i += 4) {
        const sourceContent = data[i + 2];
        if (!sourceContent) continue;
        let targetContent;
        try {
          targetContent = await translator(sourceContent, proof);
        } catch (translationError) {
          throw new Error(`翻译失败: ${translationError.message}`);
        }
        items.push({
          id: data[i],
          startEndTime: data[i + 1],
          targetContent,
          sourceContent,
        });
      }

      const templateData = { fileName, sourceLanguage, targetLanguage };
      const targetSrtFileName = getSrtFileName(
        targetSrtSaveOption,
        fileName,
        targetLanguage,
        customTargetSrtFileName,
        templateData
      );

      const fileSave = path.join(folder, `${targetSrtFileName}.srt`);

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
