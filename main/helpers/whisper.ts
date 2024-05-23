import { exec } from "child_process";
import { app } from "electron";
import path from "path";
import fs from "fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import replaceModelSource from "./model-source";

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
    .clone({ fs, http, dir: whisperPath, url: repoUrl })
    .then(() => {
      console.log(`仓库已经被克隆到: ${whisperPath}`);
      event.sender.send("installWhisperComplete", true);
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

export const downModel = async (
  event,
  whisperModel,
  source = "hf-mirror.com",
) => {
  const { modelsPath } = getPath();
  const modelName = whisperModel?.toLowerCase();
  const modelPath = path.join(modelsPath, `ggml-${modelName}.bin`);
  if (fs.existsSync(modelPath)) return;
  if (!checkWhisperInstalled()) {
    event.sender.send("message", "whisper.cpp 未下载，请先下载 whisper.cpp");
  }
  try {
    await replaceModelSource(`${modelsPath}/download-ggml-model.sh`, source);
    console.log("完成模型下载地址替换", modelName);
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
  } catch (error) {
    event.sender.send("message", error);
  }
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
