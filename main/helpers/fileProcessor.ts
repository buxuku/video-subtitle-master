import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { extractAudio } from './ffmpeg';
import translate from './translate';
import { renderTemplate, isWin32, getExtraResourcesPath } from './utils';

async function extractAudioFromVideo(event, file, filePath, audioFile) {
  event.sender.send("taskStatusChange", file, "extractAudio", "loading");
  await extractAudio(filePath, audioFile);
  event.sender.send("taskStatusChange", file, "extractAudio", "done");
}

async function generateSubtitle(event, file, audioFile, srtFile, formData, hasOpenAiWhisper) {
  const { model, sourceLanguage } = formData;
  const userPath = app.getPath("userData");
  const whisperPath = path.join(userPath, "whisper.cpp/");
  const whisperModel = model?.toLowerCase();

  let mainPath = `${whisperPath}main`;
  if (isWin32()) {
    mainPath = path.join(getExtraResourcesPath(), "whisper-bin-x64", "main.exe");
  }

  let runShell = `"${mainPath}" -m "${whisperPath}models/ggml-${whisperModel}.bin" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}`;
  if (hasOpenAiWhisper) {
    runShell = `whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir ${path.dirname(srtFile)} --language ${sourceLanguage}`;
  }

  event.sender.send("taskStatusChange", file, "extractSubtitle", "loading");
  
  await new Promise((resolve, reject) => {
    exec(runShell, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      event.sender.send("taskStatusChange", file, "extractSubtitle", "done");
      resolve(1);
    });
  });

  return `${srtFile}.srt`;
}

async function translateSubtitle(event, file, directory, fileName, srtFile, formData, provider) {
  event.sender.send("taskStatusChange", file, "translateSubtitle", "loading");
  await translate(event, directory, fileName, srtFile, formData, provider);
  event.sender.send("taskStatusChange", file, "translateSubtitle", "done");
}

export async function processFile(event, file, formData, hasOpenAiWhisper, provider) {
  const { sourceLanguage, targetLanguage, sourceSrtSaveFileName, translateProvider, saveSourceSrt } = formData || {};

  try {
    const { filePath } = file;
    let directory = path.dirname(filePath);
    let fileName = path.basename(filePath, path.extname(filePath));
    const fileExtension = path.extname(filePath).toLowerCase();

    const isSubtitleFile = ['.srt', '.vtt', '.ass', '.ssa'].includes(fileExtension);
    let srtFile = filePath;

    if (!isSubtitleFile) {
      const audioFile = path.join(directory, `${fileName}_temp.wav`);
      const templateData = { fileName, sourceLanguage, targetLanguage };
      srtFile = path.join(
        directory,
        `${renderTemplate(saveSourceSrt ? sourceSrtSaveFileName : "${fileName}-temp", templateData)}`,
      );

      await extractAudioFromVideo(event, file, filePath, audioFile);
      srtFile = await generateSubtitle(event, file, audioFile, srtFile, formData, hasOpenAiWhisper);
    } else {
      // 如果是字幕文件，可能需要进行格式转换
      event.sender.send("taskStatusChange", file, "prepareSubtitle", "loading");
      // 这里可以添加字幕格式转换的逻辑，如果需要的话
      event.sender.send("taskStatusChange", file, "prepareSubtitle", "done");
    }

    if (translateProvider !== "-1") {
      await translateSubtitle(event, file, directory, fileName, srtFile, formData, provider);
    }

    // 清理临时文件
    if (!isSubtitleFile && !saveSourceSrt) {
      fs.unlink(srtFile, (err) => {
        if (err) console.log(err);
      });
    }
  } catch (error) {
    event.sender.send("message", error);
  }
}