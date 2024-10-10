import { exec, spawn } from "child_process";
import { app } from "electron";
import path from "path";
import fs from "fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { isWin32 } from "./utils";
import { BrowserWindow, DownloadItem } from 'electron';

export const getPath = (key?: string) => {
  const userDataPath = app.getPath("userData");
  const whisperPath = path.join(userDataPath, "whisper.cpp");
  const mainPath = path.join(userDataPath, "whisper.cpp/main");
  const modelsPath = path.join(userDataPath, "whisper.cpp/models");
  const res = {
    userDataPath,
    whisperPath,
    mainPath,
    modelsPath,
  };
  if (key) return res[key];
  return res;
};

export const getModelsInstalled = () => {
  const modelsPath = getPath("modelsPath");
  try {
    const models = fs
      .readdirSync(modelsPath)
      ?.filter((file) => file.startsWith("ggml-") && file.endsWith(".bin"));
    return models.map((model) =>
      model.replace("ggml-", "").replace(".bin", ""),
    );
  } catch (e) {
    return [];
  }
};

export const checkWhisperInstalled = () => {
  const whisperPath = getPath("modelsPath");
  return fs.existsSync(whisperPath);
};

const whisperRepos = {
  github: "https://github.com/ggerganov/whisper.cpp",
  gitee: "https://gitee.com/mirrors/whisper.cpp.git",
};

export const install = (event, source) => {
  const repoUrl = whisperRepos[source] || whisperRepos.github;
  const whisperPath = getPath("whisperPath");
  if (checkWhisperInstalled()) {
    event.sender.send("installWhisperComplete", true);
    return;
  }
  git
    .clone({
      fs,
      http,
      dir: whisperPath,
      url: repoUrl,
      singleBranch: true,
      depth: 1,
      onProgress: (res) => {
        if (res.total) {
          event.sender.send("installWhisperProgress", res.phase, res.loaded / res.total);
        }
      },
    })
    .then((res) => {
      if (checkWhisperInstalled()) {
        console.log(`仓库已经被克隆到: ${whisperPath}`);
        event.sender.send("installWhisperComplete", true);
      } else {
        install(event, source);
      }
    })
    .catch((err) => {
      console.error(`克隆仓库时出错: ${err}`);
      exec(`rm -rf "${whisperPath}"`, (err, stdout) => {
        console.log(err);
      });
      event.sender.send("message", err);
      event.sender.send("installWhisperComplete", false);
    });
};

export const makeWhisper = (event) => {
  const { whisperPath, mainPath } = getPath();
  if (fs.existsSync(mainPath) || isWin32()) {
    event.sender.send("makeWhisperComplete", true);
    return;
  }
  if (!checkWhisperInstalled()) {
    event.sender.send("message", "whisper.cpp 未下载，请先下载 whisper.cpp");
  }
  event.sender.send("beginMakeWhisper", true);
  exec(`make -C "${whisperPath}"`, (err, stdout) => {
    if (err) {
      event.sender.send("message", err);
    } else {
      event.sender.send("getSystemComplete", {
        whisperInstalled: checkWhisperInstalled(),
        modelsInstalled: getModelsInstalled(),
      });
    }
    event.sender.send("message", "编译完成");
    event.sender.send("makeWhisperComplete", !err);
  });
};

export const deleteModel = async (model) => {
  const modelsPath = getPath("modelsPath");
  const modelPath = path.join(modelsPath, `ggml-${model}.bin`);
  return new Promise((resolve, reject) => {
    if (fs.existsSync(modelPath)) {
      fs.unlinkSync(modelPath);
    }
    resolve("ok");
  });
};

export const downloadModelSync = async (model: string, source: string, onProcess: (message: string) => void) => {
  const modelsPath = getPath("modelsPath");
  const modelPath = path.join(modelsPath, `ggml-${model}.bin`);
  
  if (fs.existsSync(modelPath)) {
    return;
  }
  if (!checkWhisperInstalled()) {
    throw Error("whisper.cpp 未安装，请先安装 whisper.cpp");
  }

  const url = `https://${source === 'huggingface' ? 'huggingface.co' : 'hf-mirror.com'}/ggerganov/whisper.cpp/resolve/main/ggml-${model}.bin`;
  
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({ show: false });
    
    const willDownloadHandler = (event, item: DownloadItem) => {
      if (item.getFilename() !== `ggml-${model}.bin`) {
        return; // 忽略不匹配的下载项
      }

      item.setSavePath(modelPath);

      item.on('updated', (event, state) => {
        if (state === 'progressing' && !item.isPaused()) {
          const percent = item.getReceivedBytes() / item.getTotalBytes() * 100;
          onProcess(`${model}: ${percent.toFixed(2)}%`);
        }
      });

      item.once('done', (event, state) => {
        if (state === 'completed') {
          onProcess(`${model} 完成`);
          cleanup();
          resolve(1);
        } else {
          fs.unlink(modelPath, () => {});
          cleanup();
          reject(new Error(`${model} download error: ${state}`));
        }
      });
    };

    const cleanup = () => {
      win.webContents.session.removeListener('will-download', willDownloadHandler);
      win.destroy();
    };

    win.webContents.session.on('will-download', willDownloadHandler);
    win.webContents.downloadURL(url);
  });
};

export async function checkOpenAiWhisper(): Promise<boolean> {
  return new Promise((resolve) => {
    const command = isWin32() ? "whisper.exe" : "whisper";
    const env = { ...process.env, PYTHONIOENCODING: "UTF-8" };
    const childProcess = spawn(command, ["-h"], { env, shell: true });
    
    const timeout = setTimeout(() => {
      childProcess.kill();
      resolve(false);
    }, 5000);

    childProcess.on("error", (error) => {
      clearTimeout(timeout);
      console.log("spawn error: ", error);
      resolve(false);
    });

    childProcess.on("exit", (code) => {
      clearTimeout(timeout);
      console.log("exit code: ", code);
      resolve(code === 0);
    });
  });
}
