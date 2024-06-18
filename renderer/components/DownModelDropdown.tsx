import React, { FC } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface IProps {
  loading?: boolean;
  progress?: number;
  handleDownModel?: (source: string) => void;
  setShowGuide?: (type: boolean) => void;
  installComplete?: boolean;
  whisperLoading?: boolean;
}

const DownModelDropdown: FC<IProps> = ({
  loading,
  progress,
  handleDownModel,
  setShowGuide,
  installComplete,
  whisperLoading,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={loading || !installComplete || whisperLoading}
          className="w-24"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? `${progress}%` : "下载"}
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
  );
};

export default DownModelDropdown;
