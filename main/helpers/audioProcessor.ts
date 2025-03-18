import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { logMessage } from './storeManager';
import { getMd5, ensureTempDir } from './fileUtils';

// 设置ffmpeg路径
const ffmpegPath = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * 使用ffmpeg提取音频
 */
export const extractAudio = (videoPath, audioPath) => {
    return new Promise((resolve, reject) => {
        try{
            ffmpeg(`${videoPath}`)
                .audioFrequency(16000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .outputOptions('-y')
                .on('start', function (str) {
                    logMessage(`extract audio start ${str}`, 'info');
                })
                .on('progress', function (progress) {
                    logMessage(`extract audio progress ${progress.percent || 0}%`, 'info');
                })
                .on('end', function (str) {
                    logMessage(`extract audio done!`, 'info');
                    resolve(true);
                })
                .on('error', function (err) {
                    logMessage(`extract audio error: ${err}`, 'error');
                    reject(err);
                })
                .save(`${audioPath}`);
        } catch (err) {
            logMessage(`ffmpeg extract audio error: ${err}`, 'error'); 
            reject(`${err}: ffmpeg extract audio error!`);
        }
    });
};

/**
 * 从视频中提取音频
 */
export async function extractAudioFromVideo(event, file, filePath) {
  event.sender.send('taskStatusChange', file, 'extractAudio', 'loading');
  const tempDir = ensureTempDir();
  
  logMessage(`tempDir: ${tempDir}`, 'info');
  const md5FileName = getMd5(filePath);
  const tempAudioFile = path.join(tempDir, `${md5FileName}.wav`);

  if (fs.existsSync(tempAudioFile)) {
    logMessage(`Using existing audio file: ${tempAudioFile}`, 'info');
    event.sender.send('taskStatusChange', file, 'extractAudio', 'done');
    return tempAudioFile;
  }

  await extractAudio(filePath, tempAudioFile);
  event.sender.send('taskStatusChange', file, 'extractAudio', 'done');

  return tempAudioFile;
}