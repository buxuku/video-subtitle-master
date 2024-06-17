import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BotIcon, FileVideo2, Github, MonitorPlay } from "lucide-react";
import { openUrl } from "lib/utils";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const Layout = ({ children }) => {
  const { asPath } = useRouter();
  useEffect(() => {
    window?.ipc?.on("message", (res: string) => {
      toast("消息通知", {
        description: res,
      });
      console.log(res);
    });
  }, []);

  return (
    <div className="grid h-screen w-full pl-[56px]">
      <aside className="inset-y fixed  left-0 z-20 flex h-full flex-col border-r">
        <div className="border-b p-2">
          <Link href="/home">
            <Button aria-label="Home" size="icon" variant="outline">
              <FileVideo2 className="size-5" />
            </Button>
          </Link>
        </div>
        <nav className="grid gap-1 p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/home">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-lg ${
                      asPath.includes("home") ? "bg-muted" : ""
                    }`}
                    aria-label="Playground"
                  >
                    <MonitorPlay className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                任务
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/modelsControl">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-lg ${
                      asPath.includes("modelsControl") ? "bg-muted" : ""
                    }`}
                    aria-label="Models"
                  >
                    <BotIcon className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                模型管理
              </TooltipContent>
            </Tooltip>
            {/*<Tooltip>*/}
            {/*  <TooltipTrigger asChild>*/}
            {/*    <Button*/}
            {/*      variant="ghost"*/}
            {/*      size="icon"*/}
            {/*      className="rounded-lg"*/}
            {/*      aria-label="Settings"*/}
            {/*    >*/}
            {/*      <Settings2Icon className="size-5" />*/}
            {/*    </Button>*/}
            {/*  </TooltipTrigger>*/}
            {/*  <TooltipContent side="right" sideOffset={5}>*/}
            {/*    Settings*/}
            {/*  </TooltipContent>*/}
            {/*</Tooltip>*/}
          </TooltipProvider>
        </nav>
        <nav className="mt-auto grid gap-1 p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild className="w-10">
                <Github
                  onClick={() =>
                    openUrl("https://github.com/buxuku/video-subtitle-master")
                  }
                  className="inline-block cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Github
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
          <h1 className="text-xl font-semibold">
            批量为视频生成字幕，并可翻译成其它语言
          </h1>
        </header>
        <main className="">{children}</main>
        <Toaster />
      </div>
    </div>
  );
};

export default Layout;
