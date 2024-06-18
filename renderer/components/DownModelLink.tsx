import React, { FC } from "react";

interface IProps {
  loading?: boolean;
  progress?: number;
  handleDownModel?: () => void;
}
const DownModelLink: FC<IProps> = ({ loading, progress, handleDownModel }) => {
  return (
    <span className="inline-block">
      该模型未下载，
      {loading ? (
        `正在下载中 ${progress}%...`
      ) : (
        <a
          className="cursor-pointer text-blue-500"
          onClick={() => handleDownModel()}
        >
          立即下载
        </a>
      )}
    </span>
  );
};

export default DownModelLink;
