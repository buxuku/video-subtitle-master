import React from 'react';
import { Info } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {Button} from "@/components/ui/button";

const SavePathNotice = () => {
    return (
        <Popover>
            <PopoverTrigger>
                <Info className="size-4 ml-4" />
            </PopoverTrigger>
            <PopoverContent className="w-[600px]">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">路径配置说明</h4>
                        <p className="text-sm text-muted-foreground">
                            如果你不太明白怎么配置，可以保持默认的即可！
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <p>路径配置中支持{'${fileName}'}, {'${sourceLanguage}'}, {'${targetLanguage}'} 三个变量</p>
                        <p>{'${fileName}'} 代表当前处理的文件的文件名</p>
                        <p>{'${sourceLanguage}'} 代表配置的视频源语言</p>
                        <p>{'${targetLanguage}'} 代表配置的翻译目标语言</p>
                        <p>如一个视频名为 demo.mp4 的文件，源语言为英文，翻译语言为中文，配置路径为 {'${fileName}'}.{'${targetLanguage}'}</p>
                        <p>则生成出来的字幕文件名为： demo.zh.srt</p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default SavePathNotice;
