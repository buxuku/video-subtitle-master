import fse from 'fs-extra';
import { ipcMain, BrowserWindow } from 'electron';
import { processFile } from './fileProcessor';
import { checkOpenAiWhisper, getPath } from './whisper';
import { logMessage, store } from './storeManager';
import path from 'path';
import { isAppleSilicon } from './utils';

let processingQueue = [];
let isProcessing = false;
let isPaused = false;
let shouldCancel = false;
let maxConcurrentTasks = 3;
let hasOpenAiWhisper = false;

export function setupTaskProcessor(mainWindow: BrowserWindow) {
  ipcMain.on("handleTask", async (event, { files, formData }) => {
    logMessage(`handleTask start`, 'info');
    logMessage(`formData: \n ${JSON.stringify(formData, null, 2)}`, 'info');
    processingQueue.push(...files.map(file => ({ file, formData })));
    if (!isProcessing) {
      isProcessing = true;
      isPaused = false;
      shouldCancel = false;
      hasOpenAiWhisper = await checkOpenAiWhisper();
      maxConcurrentTasks = formData.maxConcurrentTasks || 3;
      processNextTasks(event);
    }
  });

  ipcMain.on("pauseTask", () => {
    isPaused = true;
  });

  ipcMain.on("resumeTask", () => {
    isPaused = false;
  });

  ipcMain.on("cancelTask", () => {
    shouldCancel = true;
    isPaused = false;
    processingQueue = [];
  });
  ipcMain.handle('checkMlmodel', async (event, modelName) => {
    // 如果不是苹果芯片，不需要该文件，直接返回true
    if(!isAppleSilicon()){
      return true
    }
    // 判断模型目录下是否存在 `ggml-${modelName}-encoder.mlmodelc` 文件或者目录
    const modelsPath = getPath("modelsPath");
    const modelPath = path.join(modelsPath, `ggml-${modelName}-encoder.mlmodelc`);
    const exists = await fse.pathExists(modelPath);
    return exists
  });
}


async function processNextTasks(event) {
  if (shouldCancel) {
    isProcessing = false;
    event.sender.send("taskComplete", "cancelled");
    return;
  }

  if (isPaused) {
    setTimeout(() => processNextTasks(event), 1000);
    return;
  }

  if (processingQueue.length === 0) {
    isProcessing = false;
    event.sender.send("taskComplete", "completed");
    return;
  }

  const tasks = processingQueue.splice(0, maxConcurrentTasks);
  const translationProviders = store.get('translationProviders');

  try {
    await Promise.all(tasks.map(task => {
      const provider = translationProviders.find(p => p.id === task.formData.translateProvider);
      return processFile(event, task.file, task.formData, hasOpenAiWhisper, provider);
    }));
  } catch (error) {
    event.sender.send("message", error);
  }

  processNextTasks(event);
}