import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { extractAudio } from './ffmpeg';
import translate from '../translate';
import { getSrtFileName, isWin32, getExtraResourcesPath } from './utils';
import { logMessage, store } from './storeManager';
import { createMessageSender } from './messageHandler';
import { promisify } from 'util';
import { getPath } from './whisper';
import { execSync } from 'child_process';

async function extractAudioFromVideo(event, file, filePath, audioFile) {
  event.sender.send('taskStatusChange', file, 'extractAudio', 'loading');
  await extractAudio(filePath, audioFile);
  event.sender.send('taskStatusChange', file, 'extractAudio', 'done');
}

function checkCudaSupport() {
  if (process.platform !== 'win32') return false;
  
  try {
    // 检查 nvcc 是否存在（CUDA Toolkit 的编译器）
    execSync('nvcc --version', { encoding: 'utf8' });
    
    // 检查 nvidia-smi 是否存在（NVIDIA 驱动程序）
    const nsmiResult = execSync('nvidia-smi', { encoding: 'utf8' });
    logMessage(`nsmiResult: ${nsmiResult}`, 'info');
    // 从 nvidia-smi 输出中提取 CUDA 版本
    const cudaVersionMatch = nsmiResult.match(/CUDA Version: (\d+\.\d+)/);
    logMessage(`cudaVersionMatch: ${JSON.stringify(cudaVersionMatch, null, 2)}`, 'info');
    if (cudaVersionMatch) {
      const cudaVersion = parseFloat(cudaVersionMatch[1]);
      logMessage(`cudaVersion: ${cudaVersion}`, 'info');
      // 根据 CUDA 版本选择合适的 addon
      if (cudaVersion >= 12.0) {
        return '12.8.1';
      } else if (cudaVersion >= 11.8) {
        return '11.8.0';
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

function loadWhisperAddon() {
  const platform = process.platform;
  const arch = process.arch;
  const settings = store.get('settings') || { useCuda: false };
  const useCuda = settings.useCuda || false;
  let addonPath;

  if (platform === 'darwin') {
    if (arch === 'arm64') {
      addonPath = path.join(getExtraResourcesPath(), 'addons/darwin-arm64/addon.node');
    } else {
      addonPath = path.join(getExtraResourcesPath(), 'addons/darwin-x64/addon.node');
    }
  } else if (platform === 'win32') {
    // 只有当用户设置启用 CUDA 且系统支持时才使用 CUDA 版本
    if (useCuda) {
      const cudaSupport = checkCudaSupport();
      logMessage(`cudaSupport: ${cudaSupport}`, 'info');
      if (cudaSupport) {
        // 根据检测到的 CUDA 版本选择对应的 addon
        addonPath = path.join(getExtraResourcesPath(), 'addons/win-x64-cuda/addon.node');
        logMessage(`Using CUDA ${cudaSupport} addon`, 'info');
      } else {
        // 如果不支持 CUDA，回退到 CPU 版本
        addonPath = path.join(getExtraResourcesPath(), 'addons/win-x64/addon.node');
        logMessage('CUDA not supported or not properly installed, falling back to CPU version', 'warning');
      }
    } else {
      addonPath = path.join(getExtraResourcesPath(), 'addons/win-x64/addon.node');
    }
  }

  if (!addonPath) {
    throw new Error('Unsupported platform or architecture');
  }

  const module = { exports: { whisper: null } };
  process.dlopen(module, addonPath);
  return module.exports.whisper as (params: any, callback: (error: Error | null, result?: any) => void) => void;
}

function formatSrtContent(subtitles: [string, string, string][]) {
  return subtitles
    .map((subtitle, index) => {
      const [startTime, endTime, text] = subtitle;
      // SRT 格式：序号 + 时间码 + 文本 + 空行
      return `${index + 1}\n${startTime} --> ${endTime}\n${text.trim()}\n`;
    })
    .join('\n');
}

async function generateSubtitle(
  event,
  file,
  audioFile,
  srtFile,
  formData,
  hasOpenAiWhisper
) {
  const { model, sourceLanguage } = formData;
  const whisperModel = model?.toLowerCase();
  const modelPath = `${getPath('modelsPath')}/ggml-${whisperModel}.bin`;

  const settings = store.get('settings');
  const useLocalWhisper = settings?.useLocalWhisper;
  const whisperCommand = settings?.whisperCommand;

  if (hasOpenAiWhisper && useLocalWhisper && whisperCommand) {
    let runShell = whisperCommand
      .replace(/\${audioFile}/g, audioFile)
      .replace(/\${whisperModel}/g, whisperModel)
      .replace(/\${srtFile}/g, srtFile)
      .replace(/\${sourceLanguage}/g, sourceLanguage || 'auto')
      .replace(/\${outputDir}/g, path.dirname(srtFile));

    runShell = runShell.replace(/("[^"]*")|(\S+)/g, (match, quoted, unquoted) => {
      if (quoted) return quoted;
      if (unquoted && (unquoted.includes('/') || unquoted.includes('\\'))) {
        return `"${unquoted}"`;
      }
      return unquoted || match;
    });
    console.log(runShell, 'runShell');
    logMessage(`run shell ${runShell}`, 'info');
    event.sender.send('taskStatusChange', file, 'extractSubtitle', 'loading');

    await new Promise((resolve, reject) => {
      exec(runShell, (error, stdout, stderr) => {
        if (error) {
          logMessage(`generate subtitle error: ${error}`, 'error');
          reject(error);
          return;
        }
        if (stderr) {
          logMessage(`generate subtitle stderr: ${stderr}`, 'warning');
        }
        if (stdout) {
          logMessage(`generate subtitle stdout: ${stdout}`, 'info');
        }
        logMessage(`generate subtitle done!`, 'info');
        event.sender.send('taskStatusChange', file, 'extractSubtitle', 'done');
        resolve(1);
      });
    });

    return `${srtFile}.srt`;
  } else {
    event.sender.send('taskStatusChange', file, 'extractSubtitle', 'loading');
    
    try {
      const whisper = loadWhisperAddon();
      const whisperAsync = promisify(whisper);
      const settings = store.get('settings') || { useCuda: false };
      const useCuda = settings.useCuda || false;
      const platform = process.platform;
      const arch = process.arch;
      
      // 确定是否使用 GPU
      const shouldUseGpu = platform === 'darwin' && arch === 'arm64' || (platform === 'win32' && useCuda);
      
      const whisperParams = {
        language: sourceLanguage || 'auto',
        model: modelPath,
        fname_inp: audioFile,
        use_gpu: shouldUseGpu,
        flash_attn: false,
        no_prints: true,
        comma_in_time: false,
        translate: false,
        no_timestamps: false,
        audio_ctx: 0,
        max_len: 0,
      };
      logMessage(`whisperParams: ${JSON.stringify(whisperParams, null, 2)}`, 'info');

      const result = await whisperAsync(whisperParams);
      console.log(result, 'result');
      
      // 格式化字幕内容
      const formattedSrt = formatSrtContent(result);
      
      // 写入格式化后的内容
      await fs.promises.writeFile(srtFile + '.srt', formattedSrt);
      
      event.sender.send('taskStatusChange', file, 'extractSubtitle', 'done');
      logMessage(`generate subtitle done!`, 'info');
      
      return `${srtFile}.srt`;
    } catch (error) {
      logMessage(`generate subtitle error: ${error}`, 'error');
      throw error;
    }
  }
}

async function translateSubtitle(
  event,
  file,
  directory,
  fileName,
  srtFile,
  formData,
  provider
) {
  event.sender.send('taskStatusChange', file, 'translateSubtitle', 'loading');
  await translate(event, directory, fileName, srtFile, formData, provider);
  event.sender.send('taskStatusChange', file, 'translateSubtitle', 'done');
}

export async function processFile(
  event,
  file,
  formData,
  hasOpenAiWhisper,
  provider
) {
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

    const isSubtitleFile = ['.srt', '.vtt', '.ass', '.ssa'].includes(
      fileExtension
    );
    let srtFile = filePath;
    logMessage(`begin process ${fileName}`, 'info');

    if (!isSubtitleFile) {
      const templateData = { fileName, sourceLanguage, targetLanguage };

      const sourceSrtFileName = getSrtFileName(
        sourceSrtSaveOption,
        fileName,
        sourceLanguage,
        customSourceSrtFileName,
        templateData
      );
      const audioFile = path.join(directory, `${sourceSrtFileName}.wav`);

      srtFile = path.join(directory, `${sourceSrtFileName}`);

      logMessage(`extract audio ${audioFile}`, 'info');
      await extractAudioFromVideo(event, file, filePath, audioFile);
      logMessage(`generate subtitle ${srtFile}`, 'info');
      srtFile = await generateSubtitle(
        event,
        file,
        audioFile,
        `${srtFile}`,
        formData,
        hasOpenAiWhisper
      );
      logMessage(`delete audio ${audioFile}`, 'info');
      fs.unlink(audioFile, (err) => {
        if (err) console.log(err);
      });
    } else {
      // 如果是字幕文件，可能需要进行格式转换
      event.sender.send('taskStatusChange', file, 'prepareSubtitle', 'loading');
      // 这里可以添加字幕格式转换的逻辑，如果需要的话
      event.sender.send('taskStatusChange', file, 'prepareSubtitle', 'done');
    }

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
