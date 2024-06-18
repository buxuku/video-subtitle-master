import path from "path";
import { app, dialog, ipcMain, shell } from "electron";
import { exec } from "child_process";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import {
  install,
  makeWhisper,
  checkWhisperInstalled,
  getModelsInstalled,
  deleteModel,
  downloadModelSync,
  getPath,
  checkOpenAiWhisper,
} from "./helpers/whisper";
import { extractAudio } from "./helpers/ffmpeg";
import translate from "./helpers/translate";
import {
  getExtraResourcesPath,
  isWin32,
  renderTemplate,
} from "./helpers/utils";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")}-dev`);
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
        `${renderTemplate(
          saveSourceSrt ? sourceSrtSaveFileName : "${fileName}-temp",
          templateData,
        )}`,
      );
      const whisperModel = model?.toLowerCase();
      event.sender.send("taskStatusChange", file, "extractAudio", "loading");
      await extractAudio(filePath, audioFile);
      event.sender.send("taskStatusChange", file, "extractAudio", "done");
      let mainPath = `${whisperPath}main`;
      if (isWin32()) {
        mainPath = path.join(
          getExtraResourcesPath(),
          "whisper-bin-x64",
          "main.exe",
        );
      }
      let runShell = `"${mainPath}" -m "${whisperPath}models/ggml-${whisperModel}.bin" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}`;
      const hasOpenAiWhiaper = await checkOpenAiWhisper();
      if (hasOpenAiWhiaper) {
        runShell = `whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir ${directory} --language ${sourceLanguage}`;
      }
      event.sender.send("taskStatusChange", file, "extractSubtitle", "loading");
      exec(runShell, async (error, stdout, stderr) => {
        if (error) {
          event.sender.send("message", error);
          return;
        }
        event.sender.send("taskStatusChange", file, "extractSubtitle", "done");
        fs.unlink(audioFile, (err) => {
          if (err) {
            console.log(err);
          }
        });
        if (translateProvider !== "-1") {
          event.sender.send(
            "taskStatusChange",
            file,
            "translateSubtitle",
            "loading",
          );

          await translate(
            event,
            directory,
            fileName,
            `${srtFile}.srt`,
            formData,
          );
          event.sender.send(
            "taskStatusChange",
            file,
            "translateSubtitle",
            "done",
          );
        }
        if (!saveSourceSrt) {
          fs.unlink(`${srtFile}.srt`, (err) => {
            console.log(err);
          });
        }
      });
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

ipcMain.on("installWhisper", (event, source) => {
  install(event, source);
});

ipcMain.on("makeWhisper", (event) => {
  makeWhisper(event);
});


ipcMain.on("openUrl", (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle("deleteModel", async (event, modelName) => {
  await deleteModel(modelName);
  return true;
});

let downloadingModels = new Set<string>();

ipcMain.handle("getSystemInfo", async (event, key) => {
  const res = {
    whisperInstalled: checkWhisperInstalled(),
    modelsInstalled: getModelsInstalled(),
    modelsPath: getPath("modelsPath"),
    downloadingModels: Array.from(downloadingModels),
  };
  return res;
});

ipcMain.handle("downloadModel", async (event, { model, source }) => {
  downloadingModels.add(model);
  const onProcess = (data) => {
    const match = data?.match(/(\d+)%/);
    if (match) {
      event.sender.send("downloadProgress", model, +match[1]);
    }
    if(data?.includes("Done") || data?.includes("main")) {
        event.sender.send("downloadProgress", model, 100);
    }
  };
  try {
    await downloadModelSync(model?.toLowerCase(), source, onProcess);
    downloadingModels.delete(model);
  } catch (error) {
    event.sender.send("message", "下载失败，请切换下载源重试");
    downloadingModels.delete(model);
    return false;
  }
  return true;
});
