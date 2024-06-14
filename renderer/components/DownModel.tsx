import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const DownModel = ({ modelName, callBack, downSource }) => {
  const [loading, setLoading] = React.useState(false);
  const handleDownModel = async () => {
    setLoading(true);
    await window?.ipc?.invoke("downloadModel", {
        model: modelName,
        source: downSource,
    });
    setLoading(false);
    callBack && callBack();
  };
  return (
    <Button onClick={handleDownModel} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}下载
    </Button>
  );
};

export default DownModel;
