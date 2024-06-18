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
import { gitCloneSteps } from "lib/utils";
import DownModel from "@/components/DownModel";
import DownModelDropdown from "@/components/DownModelDropdown";

interface IProps {
  systemInfo: ISystemInfo;
  updateSystemInfo: () => Promise<void>;
}

const Guide: FC<IProps> = ({ systemInfo, updateSystemInfo }) => {
  const { whisperInstalled, modelsInstalled } = systemInfo;
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    console.log(whisperInstalled, showGuide, "whisperInstalled, showGuide");
    if (!whisperInstalled && !showGuide) {
      setShowGuide(true);
    }
  }, [whisperInstalled, showGuide]);
  const [loading, setLoading] = useState(false);
  const [installComplete, setInstallComplete] = useState(false);
  const [model, setModel] = useState<string>("tiny");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [beginMakeWhisper, setBeginMakeWhisper] = useState(false);
  useEffect(() => {
    window?.ipc?.on("installWhisperComplete", (res) => {
      if (res) {
        window?.ipc?.send("makeWhisper", null);
      } else {
        setInstallComplete(false);
        setLoading(false);
      }
    });
    window?.ipc?.on(
      "installWhisperProgress",
      (step: string, progressRes: number) => {
        setStep(step);
        setProgress(progressRes);
      },
    );
    window?.ipc?.on("makeWhisperComplete", (res) => {
      if (res) {
        setInstallComplete(true);
        setBeginMakeWhisper(false);
        updateSystemInfo();
      }
      setLoading(false);
    });
    window?.ipc?.on("beginMakeWhisper", () => {
      setBeginMakeWhisper(true);
    });
  }, []);
  const handleInstallWhisper = (source: "github" | "gitee") => {
    setLoading(true);
    try {
      window?.ipc?.send("installWhisper", source);
    } catch (e) {
      setLoading(false);
    }
  };
  const renderInstallText = () => {
    if (installComplete) {
      return "已经完成安装";
    }
    if (beginMakeWhisper) {
      return "正在编译 whisper";
    }
    if (loading) {
      return `${gitCloneSteps[step] || ""}${(progress * 100).toFixed(0)}%`;
    }
    return "安装 whisper";
  };
  return (
    <Dialog open={showGuide} onOpenChange={setShowGuide}>
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
                  {(loading || beginMakeWhisper) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {renderInstallText()}
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
            <DownModel modelName={model} callBack={updateSystemInfo}>
              <DownModelDropdown
                setShowGuide={setShowGuide}
                installComplete={installComplete}
                whisperLoading={loading}
              />
            </DownModel>
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
