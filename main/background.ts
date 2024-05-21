import path from "path";
import { app, dialog, ipcMain, shell } from "electron";
import {  exec } from "child_process";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import {
  install,
  downModel,
  makeWhisper,
  checkWhisperInstalled,
  getModelsInstalled,
} from "./helpers/whisper";
import { extractAudio } from "./helpers/ffmpeg";
import translate from "./helpers/translate";
import { renderTemplate } from "./helpers/utils";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1400,
    height: 980,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});

ipcMain.on("openDialog", async (event, arg) => {
  dialog
    .showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Movies", extensions: ["mkv", "avi", "mp4"] }],
    })
    .then((result) => {
      try {
        event.sender.send("file-selected", result.filePaths);
      } catch (error) {
        event.sender.send("message", error);
      }
    });
});

ipcMain.on("handleTask", async (event, { files, formData }) => {
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
    for (const file of files) {
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
        `${renderTemplate(sourceSrtSaveFileName, templateData)}`,
      );
      const whisperModel = model?.toLowerCase();
      await extractAudio(filePath, audioFile);
      event.sender.send("extractAudio-completed", file);
      exec(
        `"${whisperPath}main" -m "${whisperPath}models/ggml-${whisperModel}.bin" -f "${audioFile}" -osrt -of "${srtFile}"`,
        async (error, stdout, stderr) => {
          if (error) {
            event.sender.send("message", error);
          }
          event.sender.send("extractSubtitle-completed", file);
          fs.unlink(audioFile, (err) => {
            if (err) {
              console.log(err);
            }
          });
          if (translateProvider !== -1) {
            await translate(
              event,
              directory,
              fileName,
              `${srtFile}.srt`,
              formData,
            );
            event.sender.send("translate-completed", file);
          }
          if (!saveSourceSrt) {
            fs.unlink(`${srtFile}.srt`, (err) => {
              console.log(err);
            });
          }
        },
      );
    }
  } catch (error) {
    event.sender.send("message", error);
  }
});

ipcMain.on("getSystemInfo", (event, key) => {
  const res = {
    whisperInstalled: checkWhisperInstalled(),
    modelsInstalled: getModelsInstalled(),
  };
  event.sender.send("getSystemInfoComplete", res);
});

ipcMain.on("installWhisper", (event) => {
  install(event);
});

ipcMain.on("makeWhisper", (event) => {
  makeWhisper(event);
});

ipcMain.on("downModel", (event, whisperModel) => {
  downModel(event, whisperModel);
});

ipcMain.on('openUrl', (event, url) => {
    shell.openExternal(url);
});
