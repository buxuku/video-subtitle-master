import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader, FileVideo2, Import, CircleCheck, Github } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import Models from "@/components/Models";
import Guide from "@/components/Guide";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { supportedLanguage, defaultUserConfig, openUrl } from "lib/utils";
import store from "lib/store";
import SavePathNotice from "@/components/SavePathNotice";
import { ISystemInfo, IFiles } from "../types";

export default function Component() {
  const [files, setFiles] = React.useState([]);
  const [systemInfo, setSystemInfo] = React.useState<ISystemInfo>({
    whisperInstalled: true,
    modelsInstalled: [],
  });
  const [downModelLoading, setDownModelLoading] = React.useState(false);
  const beginWatch = useRef(false);
  const filesRef = useRef(files);
  const form = useForm({
    defaultValues: defaultUserConfig,
  });
  const formData = form.watch();
  useEffect(() => {
    console.log(beginWatch, formData);
    if (beginWatch.current) {
      store.setItem("userConfig", formData);
    }
  }, [formData, beginWatch]);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    window?.ipc?.send("getSystemInfo", null);
    window?.ipc?.on("message", (res: string) => {
      toast("消息通知", {
        description: res,
      });
      console.log(res);
    });
    window?.ipc?.on("file-selected", (res: string[]) => {
      setFiles(
        res.map((file) => ({
          uuid: Math.random().toString(36).substring(2),
          filePath: file,
        })),
      );
    });
    window?.ipc?.on("extractAudio-completed", (res: IFiles) => {
      const finalFiles = filesRef.current.map((file) =>
        file.uuid === res?.uuid ? { ...file, extractAudio: true } : file,
      );
      setFiles(finalFiles);
    });
    window?.ipc?.on("extractSubtitle-completed", (res: IFiles) => {
      const finalFiles = filesRef.current.map((file) =>
        file.uuid === res?.uuid ? { ...file, extractSubtitle: true } : file,
      );
      setFiles(finalFiles);
    });
    window?.ipc?.on("translate-completed", (res: IFiles) => {
      const finalFiles = filesRef.current.map((file) =>
        file.uuid === res?.uuid ? { ...file, translateSubtitle: true } : file,
      );
      setFiles(finalFiles);
    });
    window?.ipc?.on("getSystemInfoComplete", (res) => {
      console.log("systemInfo", res);
      setSystemInfo(res);
    });
    const storeUserConfig: Object =
      store.getItem("userConfig") || defaultUserConfig;
    console.log(storeUserConfig, "storeUserConfig");
    form.reset(storeUserConfig);
    beginWatch.current = true;
  }, []);
  const handleImportVideo = async () => {
    window?.ipc?.send("openDialog", "openDialog");
  };
  const handleTask = async () => {
    if (!files?.length) {
      toast("消息通知", {
        description: "没有需要转换的视频",
      });
      return;
    }
    window?.ipc?.send("handleTask", { files, formData });
  };
  const handleSetKeyAndSecret = (value) => {
    if (value === "-1") return;
    const storeUserConfig = store.getItem("userConfig");
    const { apiKey, apiSecret } = storeUserConfig[value] || {};
    form.setValue(`${value as "baidu" | "volc"}.apiKey`, apiKey);
    form.setValue(`${value as "baidu" | "volc"}.apiSecret`, apiSecret);
  };
  const handleInstallModel = () => {
    setDownModelLoading(true);
    window?.ipc?.send("downModel", formData.model);
  };
  const isInstalledModel = systemInfo?.modelsInstalled?.includes(
    formData.model?.toLowerCase(),
  );
  const handleClearList = () => {
    setFiles([]);
  };

  return (
    <div className="grid h-screen w-full">
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
          <h1 className="text-xl font-semibold">
            <Button
              aria-label="Home"
              size="icon"
              variant="outline"
              className="mr-2"
            >
              <FileVideo2 className="size-5" />
            </Button>
            video-subtitle-master
            <span className="text-sm text-gray-600 ml-4">
              批量为视频生成字幕，并可翻译成其它语言
              <Github
                onClick={() => openUrl("https://github.com/buxuku/video-subtitle-master")}
                className="inline-block ml-4 cursor-pointer"
              />
            </span>
          </h1>
          <div className="ml-auto align-middle items-center">
            <Button
              className="text-sm"
              size="sm"
              variant="outline"
              onClick={handleClearList}
            >
              清空列表
            </Button>
            <Button
              className="text-sm ml-4 float-right"
              size="sm"
              variant="outline"
              onClick={handleImportVideo}
            >
              <Import className="size-5 mr-2" />
              导入视频
            </Button>
          </div>
        </header>
        <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative hidden flex-col items-start gap-8 md:flex">
            <Form {...form}>
              <form className="grid w-full items-start gap-6">
                <fieldset className="grid gap-3 rounded-lg border p-4">
                  <legend className="-ml-1 px-1 text-sm font-medium">
                    源字幕设置
                  </legend>
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>模型选择</FormLabel>
                          <FormControl>
                            <Models
                              onValueChange={field.onChange}
                              value={field.value}
                              modelsInstalled={systemInfo.modelsInstalled}
                            />
                          </FormControl>
                          {!isInstalledModel && (
                            <FormDescription>
                              该模型未下载，
                              {downModelLoading ? (
                                "正在下载中..."
                              ) : (
                                <a
                                  className="cursor-pointer text-blue-500"
                                  onClick={handleInstallModel}
                                >
                                  立即下载
                                </a>
                              )}
                            </FormDescription>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="sourceLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>视频原始语言</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="请选择" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={"auto"}>自动识别</SelectItem>
                                {supportedLanguage.map((item) => (
                                  <SelectItem
                                    key={item.value}
                                    value={item.value}
                                  >
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 mt-2">
                    {/*<span>是否单独保存源字幕文件：</span>*/}
                    <FormField
                      control={form.control}
                      name="saveSourceSrt"
                      render={({ field }) => (
                        <FormItem className="flex justify-between items-center">
                          <FormLabel>是否单独保存源字幕文件</FormLabel>
                          <FormControl>
                            <Switch
                              onCheckedChange={field.onChange}
                              checked={field.value}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {formData.saveSourceSrt && (
                      <div className="grid gap-4">
                        <FormField
                          control={form.control}
                          name="sourceSrtSaveFileName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                源字幕保存文件名设置
                                <SavePathNotice />
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="请输入" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </fieldset>
                <fieldset className="grid gap-6 rounded-lg border p-4">
                  <legend className="-ml-1 px-1 text-sm font-medium">
                    翻译设置
                  </legend>
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="translateProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>翻译服务</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleSetKeyAndSecret(value);
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="请选择" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={"-1"}>不翻译</SelectItem>
                                <SelectItem value="baidu">百度</SelectItem>
                                <SelectItem value="volc">火山</SelectItem>
                                <SelectItem value="deeplx">deepLx</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {formData.translateProvider !== "-1" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-3">
                        <FormField
                          control={form.control}
                          key={`${
                            formData.translateProvider as "baidu" | "volc"
                          }.apiKey`}
                          name={`${
                            formData.translateProvider as "baidu" | "volc"
                          }.apiKey`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API KEY</FormLabel>
                              <FormControl>
                                <Input placeholder="请输入" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-3">
                        <FormField
                          control={form.control}
                          key={`${
                            formData.translateProvider as "baidu" | "volc"
                          }.apiSecret`}
                          name={`${
                            formData.translateProvider as "baidu" | "volc"
                          }.apiSecret`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API SECRET</FormLabel>
                              <FormControl>
                                <Input placeholder="请输入" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3">
                    <div className="grid gap-3">
                      <FormField
                        control={form.control}
                        name="targetLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>翻译目标语言</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择" />
                                </SelectTrigger>
                                <SelectContent>
                                  {supportedLanguage.map((item) => (
                                    <SelectItem
                                      key={item.value}
                                      value={item.value}
                                    >
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="translateContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>翻译输出字幕设置</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="请选择" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="onlyTranslate">
                                  仅输出翻译字幕
                                </SelectItem>
                                <SelectItem value="sourceAndTranslate">
                                  输出双语（源字幕加翻译字幕）
                                </SelectItem>
                                <SelectItem value="translateAndSource">
                                  输出双语（翻译字幕加源字幕）
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="targetSrtSaveFileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            翻译字幕保存文件名设置
                            <SavePathNotice />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="请输入" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </fieldset>
              </form>
            </Form>
          </div>
          <div className="relative flex h-full min-h-[50vh] border flex-col rounded-xl p-4 lg:col-span-2">
            <ScrollArea className="max-h-[650px]">
              <Table>
                <TableCaption>已经导入的视频列表</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[500px]">视频文件名</TableHead>
                    <TableHead>提取音频</TableHead>
                    <TableHead>生成字幕</TableHead>
                    <TableHead className="">翻译字幕</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-[80vh]">
                  {files.map((file) => (
                    <TableRow key={file?.uuid}>
                      <TableCell className="font-medium">
                        {file?.filePath}
                      </TableCell>
                      <TableCell>
                        {file?.extractAudio ? (
                          <CircleCheck className="size-4" />
                        ) : (
                          <Loader className="animate-spin" />
                        )}
                      </TableCell>
                      <TableCell>
                        {file?.extractSubtitle ? (
                          <CircleCheck className="size-4" />
                        ) : (
                          <Loader className="animate-spin" />
                        )}
                      </TableCell>
                      <TableCell className="">
                        {file?.translateSubtitle ? (
                          <CircleCheck className="size-4" />
                        ) : (
                          <Loader className="animate-spin" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex-1" />
            <Button
              className="ml-auto gap-1.5"
              size="sm"
              type="submit"
              onClick={handleTask}
            >
              开始操作
            </Button>
          </div>
        </main>
        <Toaster />
      </div>
      <Guide systemInfo={systemInfo} />
    </div>
  );
}
