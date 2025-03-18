import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { logMessage } from './storeManager';

/**
 * 计算字符串的MD5哈希值
 */
export function getMd5(str: string) {
  return createHash('md5').update(str).digest('hex');
}

/**
 * 获取临时目录路径
 */
export function getTempDir() {
  return path.join(app.getPath('temp'), 'whisper-subtitles');
}

/**
 * 确保临时目录存在
 */
export function ensureTempDir() {
  const tempDir = getTempDir();
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * 格式化SRT内容
 */
export function formatSrtContent(subtitles: [string, string, string][]) {
  return subtitles
    .map((subtitle, index) => {
      const [startTime, endTime, text] = subtitle;
      // SRT格式：序号 + 时间码 + 文本 + 空行
      return `${index + 1}\n${startTime} --> ${endTime}\n${text.trim()}\n`;
    })
    .join('\n');
}

/**
 * 创建或清空文件
 */
export async function createOrClearFile(filePath: string): Promise<void> {
  try {
    await fs.promises.writeFile(filePath, '');
  } catch (error) {
    logMessage(`Failed to create/clear file: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 向文件追加内容
 */
export async function appendToFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.promises.appendFile(filePath, content);
  } catch (error) {
    logMessage(`Failed to append to file: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 读取文件内容并按行分割
 */
export async function readFileContent(filePath: string): Promise<string[]> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content.split('\n');
  } catch (error) {
    logMessage(`Failed to read file: ${error.message}`, 'error');
    throw error;
  }
} 