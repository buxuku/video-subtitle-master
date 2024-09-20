import path from 'path';
import fs from 'fs';
import { renderTemplate } from './utils';

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
    translateProvider,
    targetSrtSaveFileName,
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
      switch (translateProvider) {
        case 'volc':
          translator = (await import('../service/volc')).default;
          break;
        case 'baidu':
          translator = (await import('../service/baidu')).default;
          break;
        case 'deeplx':
          translator = (await import('../service/deeplx')).default;
          break;
        default:
          translator = (val) => val;
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
      const fileSave = path.join(
        folder,
        `${renderTemplate(targetSrtSaveFileName, {
          fileName,
          sourceLanguage,
          targetLanguage,
        })}.srt`
      );
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
