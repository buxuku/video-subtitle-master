import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { models } from "lib/utils";
import { Button } from "@/components/ui/button";
import { ISystemInfo } from "../types";
import DeleteModel from "@/components/DeleteModel";
import DownModel from "@/components/DownModel";
import DownModelButton from "@/components/DownModelButton";

const ModelsControl = () => {
  const [systemInfo, setSystemInfo] = React.useState<ISystemInfo>({
    whisperInstalled: true,
    modelsInstalled: [],
    downloadingModels: [],
  });
  const [downSource, setDownSource] = useState("hf-mirror");
  useEffect(() => {
    updateSystemInfo();
  }, []);
  const updateSystemInfo = async () => {
    const systemInfoRes = await window?.ipc?.invoke("getSystemInfo", null);
    setSystemInfo(systemInfoRes);
  };
  const isInstalledModel = (name) =>
    systemInfo?.modelsInstalled?.includes(name.toLowerCase());
  const handleDownSource = (value: string) => {
    setDownSource(value);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>模型管理</CardTitle>
        <CardDescription>
          您可以在这里管理你的模型，下载，删除 <br />
          模型保存位置： {systemInfo?.modelsPath}
          <span className="float-right -mt-4 flex items-center">
            <span>切换下载源：</span>
            <Select onValueChange={handleDownSource} value={downSource}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="切换下载源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hf-mirror">国内镜像源(较快)</SelectItem>
                <SelectItem value="huggingface">
                  huggingface官方源(较慢)
                </SelectItem>
              </SelectContent>
            </Select>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">模型名</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="max-h-[80vh]">
            {models.map((model) => (
              <TableRow key={model?.name}>
                <TableCell className="font-medium">{model?.name}</TableCell>
                <TableCell>{model?.desc}</TableCell>
                <TableCell>
                  {isInstalledModel(model.name) &&
                  !systemInfo?.downloadingModels.includes(model.name) ? (
                    <DeleteModel
                      modelName={model.name}
                      callBack={updateSystemInfo}
                    >
                      <Button variant="destructive">删除</Button>
                    </DeleteModel>
                  ) : (
                    <DownModel
                      modelName={model.name}
                      callBack={updateSystemInfo}
                      downSource={downSource}
                    >
                      <DownModelButton />
                    </DownModel>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ModelsControl;
