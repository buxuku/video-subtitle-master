import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const DownModel = ({ modelName, callBack, downSource }) => {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  useEffect(() => {
    window?.ipc?.on("downloadProgress", (model, progress: number) => {
      if (model === modelName) {
        setProgress(progress);
        setLoading(progress < 100);
        if(progress >= 100) {
            console.log(progress, 'progress')
            callBack && callBack();
        }
      }
    });
  }, []);
  const handleDownModel = async () => {
    setLoading(true);
    await window?.ipc?.invoke("downloadModel", {
      model: modelName,
      source: downSource,
    });
    setLoading(false);
  };
  return (
    <Button onClick={handleDownModel} disabled={loading}>
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

export default DownModel;
