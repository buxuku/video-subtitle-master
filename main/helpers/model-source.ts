import { promises as fs } from 'fs';

export  default async function replaceModelSource(filePath, target) {
    // 读取文件
    const data = await fs.readFile(filePath, 'utf8');
    let result = target === 'hf-mirror.com' ? data.replace(/huggingface\.co/g, 'hf-mirror.com') : data.replace(/hf-mirror\.com/g, 'hf-mirror.com');
    // 写入文件
    await fs.writeFile(filePath, result, 'utf8');
}

