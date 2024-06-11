import ffmpegStatic from 'ffmpeg-static';

import ffmpeg from 'fluent-ffmpeg';

const ffmpegPath = ffmpegStatic.replace('app.asar',
    'app.asar.unpacked'
)

ffmpeg.setFfmpegPath(ffmpegPath);

export const extractAudio = (videoPath, audioPath) => {
    return new Promise((resolve, reject) => {
        try{
            ffmpeg(`${videoPath}`)
                .audioFrequency(16000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .outputOptions('-y')
                .on('start', function (str) {
                    console.log('转换任务开始~', str);
                })
                .on('progress', function (progress) {
                    console.log('进行中，完成' + (progress.percent || 0) + '%');
                })
                .on('end', function (str) {
                    console.log('转换任务完成!');
                    resolve(true);
                })
                .on('error', function (err) {
                    console.log('转换任务出错:', err);
                    reject(err);
                })
                .save(`${audioPath}`);
        } catch (err) {
            reject(`${err}: ffmpeg 转码出错！`);
        }
    });
};
