import { ipcMain, BrowserWindow } from 'electron';
import { processFile } from './fileProcessor';
import { checkOpenAiWhisper } from './whisper';
import { store } from './storeManager';

let processingQueue = [];
let isProcessing = false;
let isPaused = false;
let shouldCancel = false;
let maxConcurrentTasks = 3;
let hasOpenAiWhisper = false;

export function setupTaskProcessor(mainWindow: BrowserWindow) {
  ipcMain.on("handleTask", async (event, { files, formData }) => {
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
    await Promise.all(tasks.map(task => processFile(event, task.file, task.formData, hasOpenAiWhisper, translationProviders)));
  } catch (error) {
    event.sender.send("message", error);
  }

  processNextTasks(event);
}