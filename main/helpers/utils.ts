import path from "path";
import { app } from "electron";
import os from "os";

// 将字符串转成模板字符串
export const renderTemplate = (template, data) => {
  const names = Object.keys(data);
  const values = Object.values(data);
  return new Function(...names, `return \`${template}\`;`)(...values);
};


export const isDarwin = () => os.platform() === 'darwin';

export const isWin32 = () => os.platform() === 'win32';


export const getExtraResourcesPath = () => {
  const isProd = process.env.NODE_ENV === "production";
  return isProd ? path.join(process.resourcesPath, 'extraResources') : path.join(app.getAppPath(), 'extraResources');
}