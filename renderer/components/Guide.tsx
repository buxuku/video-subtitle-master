import React, { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Models from "@/components/Models";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Globe } from "lucide-react"; // 导入 Globe 图标
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
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router"; // 导入 useRouter

interface IProps {
  systemInfo: ISystemInfo;
  updateSystemInfo: () => Promise<void>;
}

const Guide: FC<IProps> = ({ systemInfo, updateSystemInfo }) => {
  const { whisperInstalled, modelsInstalled } = systemInfo;
  const [showGuide, setShowGuide] = useState(false);
  const { t } = useTranslation("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [installComplete, setInstallComplete] = useState(false);
  const [model, setModel] = useState<string>("tiny");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [beginMakeWhisper, setBeginMakeWhisper] = useState(false);

  useEffect(() => {
    if (!whisperInstalled && !showGuide) {
      setShowGuide(true);
    }
  }, [whisperInstalled, showGuide]);

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
      return t("installComplete");
    }
    if (beginMakeWhisper) {
      return t("compilingWhisper");
    }
    if (loading) {
      return `${gitCloneSteps[step] || ""}${(progress * 100).toFixed(0)}%`;
    }
    return t("installWhisper");
  };

  const changeLanguage = (lang: string) => {
    router.push(router.pathname, router.asPath, { locale: lang });
    window?.ipc?.invoke('setSettings', { language: lang });
  };

  return (
    <Dialog open={showGuide} onOpenChange={setShowGuide}>
      <DialogContent className="w-[500px]">
        <div className="grid gap-4 py-4">
          <h1 className="text-2xl text-center">{t("prepareToStart")}</h1>
          
          <p className="text-center">{t("firstStep")}</p>
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
                <DropdownMenuLabel>{t("pleaseSelectSource")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleInstallWhisper("gitee")}
                >
                  {t("domesticMirrorSource")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleInstallWhisper("github")}
                >
                  {t("officialHuggingFaceSource")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-center mt-4">{t("secondStep")}</p>
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
          <p className="text-center mt-4">{t("finishAboveTwoSteps")}</p>
          <div className="grid gap-4 w-1/2 m-auto">
            <Button
              variant="outline"
              disabled={loading || !whisperInstalled}
              onClick={() => setShowGuide(false)}
            >
              {t("startNow")}
            </Button>
          </div>

          <div className="absolute bottom-4 left-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeLanguage("zh")}>
                  中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Guide;
