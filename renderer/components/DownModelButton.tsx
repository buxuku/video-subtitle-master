import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface IProps {
  loading?: boolean;
  progress?: number;
  handleDownModel?: () => void;
}

const DownModelButton: FC<IProps> = ({
  loading,
  progress,
  handleDownModel,
}) => {
  return (
    <Button disabled={loading} onClick={() => handleDownModel()}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {progress} %
        </>
      ) : (
        "下载"
      )}
    </Button>
  );
};

export default DownModelButton;
