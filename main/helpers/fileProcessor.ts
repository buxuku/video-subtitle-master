import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { extractAudio } from './ffmpeg';
import translate from './translate';
import { renderTemplate, isWin32, getExtraResourcesPath } from './utils';

export async function processFile(event, file, formData, hasOpenAiWhisper, translationProviders) {
  const {
    model,
    sourceLanguage,
    targetLanguage,
    sourceSrtSaveFileName,
    translateProvider,
    saveSourceSrt,
  } = formData || {};
  const userPath = app.getPath("userData");
  const whisperPath = path.join(userPath, "whisper.cpp/");

  try {
    const { filePath } = file;
    let directory = path.dirname(filePath);
    let fileName = path.basename(filePath, path.extname(filePath));
    const audioFile = path.join(directory, `${fileName}.wav`);
    const templateData = {
      fileName,
      sourceLanguage,
      targetLanguage,
    };
    const srtFile = path.join(
      directory,
      `${renderTemplate(
        saveSourceSrt ? sourceSrtSaveFileName : "${fileName}-temp",
        templateData,
      )}`,
    );
    const whisperModel = model?.toLowerCase();

    // 提取音频
    event.sender.send("taskStatusChange", file, "extractAudio", "loading");
    await extractAudio(filePath, audioFile);
    event.sender.send("taskStatusChange", file, "extractAudio", "done");

    // 生成字幕
    let mainPath = `${whisperPath}main`;
    if (isWin32()) {
      mainPath = path.join(
        getExtraResourcesPath(),
        "whisper-bin-x64",
        "main.exe",
      );
    }
    let runShell = `"${mainPath}" -m "${whisperPath}models/ggml-${whisperModel}.bin" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}`;
    if (hasOpenAiWhisper) {
      runShell = `whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir ${directory} --language ${sourceLanguage}`;
    }
    event.sender.send("taskStatusChange", file, "extractSubtitle", "loading");
    
    await new Promise((resolve, reject) => {
      exec(runShell, async (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        event.sender.send("taskStatusChange", file, "extractSubtitle", "done");
        fs.unlink(audioFile, (err) => {
          if (err) {
            console.log(err);
          }
        });
        resolve(1);
      });
    });

    // 翻译字幕
    if (translateProvider !== "-1") {
      event.sender.send(
        "taskStatusChange",
        file,
        "translateSubtitle",
        "loading",
      );
      const provider = translationProviders.find(p => p.id === translateProvider);
      await translate(
        event,
        directory,
        fileName,
        `${srtFile}.srt`,
        formData,
        provider
      );
      event.sender.send(
        "taskStatusChange",
        file,
        "translateSubtitle",
        "done",
      );
    }

    // 清理临时文件
    if (!saveSourceSrt) {
      fs.unlink(`${srtFile}.srt`, (err) => {
        if (err) console.log(err);
      });
    }
  } catch (error) {
    event.sender.send("message", error);
  }
}