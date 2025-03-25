import path from 'path';
import fs from 'fs';
import { logMessage, store } from './storeManager';
import { createMessageSender } from './messageHandler';
import { getSrtFileName } from './utils';
import { extractAudioFromVideo } from './audioProcessor';
import { generateSubtitleWithLocalWhisper, generateSubtitleWithBuiltinWhisper } from './subtitleGenerator';
import translate from '../translate';

/**
 * 生成字幕
 */
async function generateSubtitle(event, file, audioFile, srtFile, formData, hasOpenAiWhisper) {
  const settings = store.get('settings');
  const useLocalWhisper = settings?.useLocalWhisper;
  
  if (hasOpenAiWhisper && useLocalWhisper && settings?.whisperCommand) {
    return generateSubtitleWithLocalWhisper(event, file, audioFile, srtFile, formData);
  } else {
    return generateSubtitleWithBuiltinWhisper(event, file, audioFile, srtFile, formData);
  }
}

/**
 * 翻译字幕
 */
async function translateSubtitle(event, file, directory, fileName, srtFile, formData, provider) {
  event.sender.send('taskStatusChange', file, 'translateSubtitle', 'loading');
  
  const onProgress = (progress) => {
    event.sender.send('taskProgressChange', file, 'translateSubtitle', Math.min(progress, 100));
  };
  
  await translate(event, directory, fileName, srtFile, formData, provider, onProgress);
  event.sender.send('taskStatusChange', file, 'translateSubtitle', 'done');
}

/**
 * 处理文件
 */
export async function processFile(event, file, formData, hasOpenAiWhisper, provider) {
  const {
    sourceLanguage,
    targetLanguage,
    sourceSrtSaveOption,
    customSourceSrtFileName,
    translateProvider,
  } = formData || {};
  
  try {
    const { filePath } = file;
    let directory = path.dirname(filePath);
    let fileName = path.basename(filePath, path.extname(filePath));
    const fileExtension = path.extname(filePath).toLowerCase();

    const isSubtitleFile = ['.srt', '.vtt', '.ass', '.ssa'].includes(fileExtension);
    let srtFile = filePath;
    logMessage(`begin process ${fileName}`, 'info');

    // 处理非字幕文件
    if (!isSubtitleFile) {
      const templateData = { fileName, sourceLanguage, targetLanguage };

      const sourceSrtFileName = getSrtFileName(
        sourceSrtSaveOption,
        fileName,
        sourceLanguage,
        customSourceSrtFileName,
        templateData
      );

      srtFile = path.join(directory, `${sourceSrtFileName}`);

      // 提取音频
      logMessage(`extract audio for ${fileName}`, 'info');
      const tempAudioFile = await extractAudioFromVideo(event, file, filePath);

      // 生成字幕
      logMessage(`generate subtitle ${srtFile}`, 'info');
      srtFile = await generateSubtitle(
        event,
        file,
        tempAudioFile,
        srtFile,
        formData,
        hasOpenAiWhisper
      );
    } else {
      // 处理字幕文件
      event.sender.send('taskStatusChange', file, 'prepareSubtitle', 'loading');
      // 这里可以添加字幕格式转换的逻辑，如果需要的话
      event.sender.send('taskStatusChange', file, 'prepareSubtitle', 'done');
    }

    // 翻译字幕
    if (translateProvider !== '-1') {
      logMessage(`translate subtitle ${srtFile}`, 'info');
      await translateSubtitle(
        event,
        file,
        directory,
        fileName,
        srtFile,
        formData,
        provider
      );
    }

    // 清理临时文件
    if (!isSubtitleFile && sourceSrtSaveOption === 'noSave') {
      logMessage(`delete temp subtitle ${srtFile}`, 'warning');
      fs.unlink(srtFile, (err) => {
        if (err) console.log(err);
      });
    }
    
    logMessage(`process file done ${fileName}`, 'info');
  } catch (error) {
    createMessageSender(event.sender).send('message', {
      type: 'error',
      message: error,
    });
  }
}
