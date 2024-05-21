import { exec } from "child_process";
import { app } from "electron";
import path from "path";
import fs from "fs";

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
  const whisperPath = getPath("whisperPath");
  return fs.existsSync(whisperPath);
};
export const install = (event) => {
  const repoUrl = "https://github.com/ggerganov/whisper.cpp";
  const whisperPath = getPath("whisperPath");
  if (checkWhisperInstalled()) {
    event.sender.send("installWhisperComplete", true);
    return;
  }
  exec("git --version", (err, stdout, stderr) => {
    if (err) {
      // TODO: 如果 git 没有安装，下载并解压 zip 文件
      // https.get(zipUrl, (response) => {
      //     response.pipe(unzipper.Extract({ path: targetPath }));
      // });
    } else {
      // 如果 git 已经安装，克隆仓库
      exec(`git clone ${repoUrl} "${whisperPath}"`, (err, stdout, stderr) => {
        if (err) {
          console.error(`克隆仓库时出错: ${err}`);
          event.sender.send("message", err);
          event.sender.send("installWhisperComplete", false);
        } else {
          console.log(`仓库已经被克隆到: ${whisperPath}`);
          event.sender.send("installWhisperComplete", true);
        }
      });
    }
  });
};

export const downModel = (event, whisperModel) => {
  const { modelsPath, whisperPath } = getPath();
  const modelName = whisperModel?.toLowerCase();
  const modelPath = path.join(modelsPath, `ggml-${modelName}.bin`);
  if (fs.existsSync(modelPath)) return;
  if (!checkWhisperInstalled()) {
    event.sender.send("message", "whisper.cpp 未下载，请先下载 whisper.cpp");
  }
  exec(
    `bash "${modelsPath}/download-ggml-model.sh" ${modelName}`,
    (err, stdout) => {
      if (err) {
        event.sender.send("message", err);
      } else {
        event.sender.send("message", `模型 ${modelName} 下载完成`);
      }
      event.sender.send("downModelComplete", !err);
      event.sender.send("getSystemInfoComplete", {
        whisperInstalled: checkWhisperInstalled(),
        modelsInstalled: getModelsInstalled(),
      });
    },
  );
};

export const makeWhisper = (event) => {
  const { whisperPath, mainPath } = getPath();
  if (fs.existsSync(mainPath)) return;
  if (!checkWhisperInstalled()) {
    event.sender.send("message", "whisper.cpp 未下载，请先下载 whisper.cpp");
  }
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
