import React, { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Models from "@/components/Models";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ISystemInfo } from "../types";

interface IProps {
  systemInfo: ISystemInfo;
}

const Guide: FC<IProps> = ({ systemInfo }) => {
  const { whisperInstalled, modelsInstalled } = systemInfo;
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (!whisperInstalled && !showGuide) {
      setShowGuide(true);
    }
  }, [whisperInstalled, showGuide]);
  const [loading, setLoading] = useState(false);
  const [installComplete, setInstallComplete] = useState(false);
  const [model, setModel] = useState<string>("tiny");
  const [downModelLoading, setDownModelLoading] = useState(false);
  useEffect(() => {
    window?.ipc?.on("installWhisperComplete", () => {
      window?.ipc?.send("makeWhisper", null);
    });
    window?.ipc?.on("makeWhisperComplete", () => {
      setLoading(false);
      setInstallComplete(true);
    });
    window?.ipc?.on("downModelComplete", () => {
      setDownModelLoading(false);
    });
  }, []);
  console.log(installComplete, "installComplete");
  const handleInstallWhisper = (source: "github" | "gitee") => {
    setLoading(true);
    try {
      window?.ipc?.send("installWhisper", source);
    } catch (e) {
      setLoading(false);
    }
  };
  const handleDownModel = (source: "huggingface" | "hf-mirror") => {
    setDownModelLoading(true);
    window?.ipc?.send("downModel", { model, source });
  };
  return (
    <Dialog open={showGuide}>
      <DialogContent className="w-[500px]">
        <div className="grid gap-4 py-4">
          <h1 className="text-2xl text-center">准备， 开始！</h1>
          <p className="text-center">第一步</p>
          <div className="grid gap-4 w-1/2 m-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className=""
                  disabled={loading || installComplete}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {installComplete ? "已经完成安装" : "安装 whisper"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[225px]">
                <DropdownMenuLabel>请选择安装源</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleInstallWhisper("gitee")}
                >
                  国内镜像源(较快)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleInstallWhisper("github")}
                >
                  github官方源(较慢)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-center mt-4">第二步：选择一个模型下载</p>
          <div className="grid w-[272px] grid-cols-2 gap-3 m-auto grid-cols-auto-min">
            <Models
              onValueChange={setModel}
              modelsInstalled={modelsInstalled}
              defaultValue={model}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={downModelLoading || loading || !installComplete}
                  className="w-24"
                >
                  {downModelLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  下载
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[225px]">
                <DropdownMenuLabel>请选择下载源</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleDownModel("hf-mirror")}
                >
                  国内镜像源(较快)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleDownModel("huggingface")}
                >
                  huggingface官方源(较慢)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setShowGuide(false)}
                >
                  稍后下载
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-center mt-4">完成以上两步</p>
          <div className="grid gap-4 w-1/2 m-auto">
            <Button
              variant="outline"
              disabled={loading || !whisperInstalled}
              onClick={() => setShowGuide(false)}
            >
              尽享开始吧
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Guide;
