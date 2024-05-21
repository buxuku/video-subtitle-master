export interface ISystemInfo {
    whisperInstalled?: boolean;
    modelsInstalled?: string[];
    [key: string]: any;
}

export interface IFiles {
    uuid: string;
    filePath: string;
    extractAudio?: boolean;
    extractSubtitle?: boolean;
    translateSubtitle?: boolean;
}
