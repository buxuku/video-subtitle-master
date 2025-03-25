import React from "react";
import { CircleCheck, Loader, Pause, RedoDot } from "lucide-react";

const TaskStatus = ({ file, checkKey, skip = false }) => {
  if (skip) return <RedoDot className="size-4" />;
  if (file[checkKey] === "loading") {
    // 检查是否有进度信息
    const progressKey = `${checkKey}Progress`;
    const hasProgress = file[progressKey] !== undefined;
    return (
      <div className="flex items-center gap-1">
        <Loader className="animate-spin size-4" />
        {hasProgress && (
          <span className="text-xs">{file[progressKey].toFixed(2)}%</span>
        )}
      </div>
    );
  }
  if (file[checkKey] === "done") {
    return <CircleCheck className="size-4" />;
  }
  return <Pause className="size-4" />
};

export default TaskStatus;
