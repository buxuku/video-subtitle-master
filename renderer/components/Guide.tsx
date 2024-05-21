import React, { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Models from "@/components/Models";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
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
  const [model, setModel] = useState<string>("");
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
  const handleInstallWhisper = () => {
    setLoading(true);
    try {
      window?.ipc?.send("installWhisper", null);
    } catch (e) {
      setLoading(false);
    }
  };
  const handleDownModel = () => {
    setDownModelLoading(true);
    window?.ipc?.send("downModel", model);
  };
  return (
    <Dialog open={showGuide}>
      <DialogContent className="w-[500px]">
        <div className="grid gap-4 py-4">
          <h1 className="text-2xl text-center">准备， 开始！</h1>
          <p className="text-center">第一步</p>
          <div className="grid gap-4 w-1/2 m-auto">
            <Button
              variant="outline"
              className=""
              onClick={handleInstallWhisper}
              disabled={loading || installComplete}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {installComplete ? "已经完成安装" : "安装 whisper"}
            </Button>
          </div>
          <p className="text-center mt-4">第二步：选择一个模型下载</p>
          <div className="grid w-[272px] grid-cols-2 gap-3 m-auto grid-cols-auto-min">
            <Models
              onValueChange={setModel}
              modelsInstalled={modelsInstalled}
            />
            <Button
              variant="outline"
              onClick={handleDownModel}
              disabled={downModelLoading || loading || !installComplete}
              className="w-24"
            >
              {downModelLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              下载
            </Button>
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
