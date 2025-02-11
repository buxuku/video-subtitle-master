import React, { useEffect, FC, PropsWithChildren } from "react";

interface IProps extends PropsWithChildren {
  modelName: string;
  callBack?: () => void;
  downSource?: string;
}

const DownModel: FC<IProps> = (props) => {
  const { modelName, callBack, downSource = "huggingface", children } = props;
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  useEffect(() => {
    window?.ipc?.on("downloadProgress", (model: string, progress: number) => {
      if (model?.toLowerCase() === modelName?.toLowerCase()) {
        setProgress(progress);
        setLoading(progress < 100);
        if (progress >= 100) {
          callBack && callBack();
        }
      }
    });
  }, []);
  const handleDownModel = async (source = downSource) => {
    setLoading(true);
    await window?.ipc?.invoke("downloadModel", {
      model: modelName,
      source,
    });
    setLoading(false);
  };
  return (
    <span className="inline-block">
      {React.isValidElement<{
        loading?: boolean;
        progress?: number;
        handleDownModel?: (source?: string) => void;
      }>(children)
        ? React.cloneElement(children, {
            loading,
            progress,
            handleDownModel,
          })
        : children}
    </span>
  );
};

export default DownModel;
